import logging
import re
from decimal import Decimal, InvalidOperation

from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_required

from extensions import db
from models import CartItem, Payment, OrderItem
from routes.cart import listing_is_available
from services.offer_service import auto_close_if_expired
from services.mpesa_service import (
    MpesaConfigurationError,
    MpesaServiceError,
    initiate_stk_push,
    query_stk_push,
)


logger = logging.getLogger(__name__)

payments_bp = Blueprint(
    "payments_bp",
    __name__,
    url_prefix="/api/payments"
)


def callback_acknowledgement():
    return jsonify({
        "ResultCode": 0,
        "ResultDesc": "Accepted"
    }), 200


def get_callback_metadata(callback):
    metadata = callback.get("CallbackMetadata", {})
    items = metadata.get("Item", [])

    if not isinstance(items, list):
        return {}

    return {
        item.get("Name"): item.get("Value")
        for item in items
        if isinstance(item, dict) and item.get("Name")
    }


@payments_bp.post("/checkout")
@login_required
def checkout():
    cart_items = (
        db.session.query(CartItem)
        .filter_by(user_id=current_user.id)
        .all()
    )

    if not cart_items:
        return jsonify({"error": "Your cart is empty."}), 400

    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid checkout details."}), 400

    phone_number = str(data.get("phone_number") or "").strip()
    phone_number = phone_number.replace(" ", "").replace("-", "")

    if phone_number.startswith("0") and len(phone_number) == 10:
        phone_number = "254" + phone_number[1:]
    elif phone_number.startswith("+254"):
        phone_number = phone_number[1:]

    if not re.fullmatch(r"254\d{9}", phone_number):
        return jsonify({
            "error": "Enter a valid Kenyan M-Pesa phone number."
        }), 422

    total = Decimal("0.00")
    order_items = []

    for cart_item in cart_items:
        listing = cart_item.listing

        if not listing:
            return jsonify({
                "error": "A listing in your cart no longer exists."
            }), 409

        auto_close_if_expired(listing)

        if not listing_is_available(listing):
            return jsonify({
                "error": f"{listing.title} is no longer available."
            }), 409

        if listing.user_id == current_user.id:
            return jsonify({
                "error": "You cannot purchase your own listing."
            }), 400

        if cart_item.quantity != 1:
            return jsonify({
                "error": (
                    f"{listing.title} is a unique item. "
                    "Its quantity must be one."
                )
            }), 422

        try:
            price = Decimal(str(listing.price))
        except (InvalidOperation, TypeError, ValueError):
            return jsonify({
                "error": "A listing has an invalid price."
            }), 422

        if not price.is_finite() or price <= 0:
            return jsonify({
                "error": "A listing has an invalid price."
            }), 422

        total += price

        order_items.append({
            "listing": listing,
            "title": listing.title,
            "unit_price": price,
            "quantity": 1,
            "image_url": listing.image_url,
        })

    if total <= 0:
        return jsonify({"error": "Invalid checkout total."}), 422

    if total != total.to_integral_value():
        return jsonify({
            "error": (
                "M-Pesa checkout requires a whole-number KES amount. "
                "Please contact support about this cart."
            )
        }), 422

    payment = Payment(
        user_id=current_user.id,
        amount=total,
        currency="KES",
        status="pending",
        payment_method="mpesa_sandbox",
    )

    try:
        db.session.add(payment)
        db.session.flush()

        for item in order_items:
            db.session.add(
                OrderItem(
                    payment_id=payment.id,
                    listing_id=item["listing"].id,
                    title=item["title"],
                    unit_price=item["unit_price"],
                    quantity=item["quantity"],
                    image_url=item["image_url"],
                )
            )

        db.session.commit()

    except Exception:
        db.session.rollback()
        current_app.logger.exception(
            "Could not create payment record."
        )
        return jsonify({
            "error": "Could not create the payment record."
        }), 500

    try:
        stk_response = initiate_stk_push(
            amount=int(total),
            account_reference=f"LC{payment.id}",
            phone_number=phone_number,
        )

    except MpesaConfigurationError as exc:
        payment.result_description = str(exc)
        db.session.commit()
        return jsonify({
            "error": str(exc),
            "payment_id": payment.id,
            "status": payment.status,
        }), 503

    except MpesaServiceError as exc:
        payment.result_description = str(exc)
        db.session.commit()
        return jsonify({
            "error": str(exc),
            "payment_id": payment.id,
            "status": payment.status,
        }), 502

    payment.merchant_request_id = stk_response["merchant_request_id"]
    payment.checkout_request_id = stk_response["checkout_request_id"]
    payment.result_description = stk_response.get("customer_message")
    db.session.commit()

    return jsonify({
        "message": (
            "Sandbox payment request submitted. "
            "The payment is awaiting confirmation."
        ),
        "payment_id": payment.id,
        "amount": float(payment.amount),
        "currency": payment.currency,
        "status": payment.status,
        "customer_message": stk_response.get("customer_message"),
    }), 202


@payments_bp.post("/callback")
def mpesa_callback():
    """
    Public Daraja STK callback.

    The callback is matched to a stored payment and verified
    using the sandbox STK Query endpoint before settlement.
    """
    try:
        payload = request.get_json(silent=True)

        if not isinstance(payload, dict):
            return callback_acknowledgement()

        body = payload.get("Body", {})
        callback = body.get("stkCallback", {}) if isinstance(body, dict) else {}

        if not isinstance(callback, dict):
            return callback_acknowledgement()

        checkout_id = callback.get("CheckoutRequestID")
        merchant_id = callback.get("MerchantRequestID")

        if not checkout_id or not merchant_id:
            logger.warning("Received an incomplete M-Pesa callback.")
            return callback_acknowledgement()

        payment = Payment.query.filter_by(
            checkout_request_id=str(checkout_id)
        ).first()

        if not payment:
            logger.warning(
                "M-Pesa callback received for an unknown checkout."
            )
            return callback_acknowledgement()

        if payment.status in ("succeeded", "failed"):
            return callback_acknowledgement()

        if (
            payment.merchant_request_id
            and payment.merchant_request_id != str(merchant_id)
        ):
            logger.warning(
                "M-Pesa callback merchant ID did not match."
            )
            return callback_acknowledgement()

        # Verify the provider's transaction status independently.
        query_result = query_stk_push(payment.checkout_request_id)

        if not isinstance(query_result, dict):
            return callback_acknowledgement()

        if str(query_result.get("ResponseCode")) != "0":
            logger.warning("M-Pesa STK Query was not accepted.")
            return callback_acknowledgement()

        if (
            query_result.get("CheckoutRequestID")
            and query_result["CheckoutRequestID"] != payment.checkout_request_id
        ):
            logger.warning("STK Query checkout ID did not match.")
            return callback_acknowledgement()

        if (
            query_result.get("MerchantRequestID")
            and query_result["MerchantRequestID"] != payment.merchant_request_id
        ):
            logger.warning("STK Query merchant ID did not match.")
            return callback_acknowledgement()

        query_code = query_result.get("ResultCode")

        # No final provider result yet. Leave the payment pending.
        if query_code is None:
            return callback_acknowledgement()

        try:
            query_code = int(query_code)
        except (TypeError, ValueError):
            return callback_acknowledgement()

        # Only a final non-zero query result marks the payment failed.
        if query_code != 0:
            payment.status = "failed"
            payment.result_code = str(query_code)
            payment.result_description = str(
                query_result.get("ResultDesc")
                or callback.get("ResultDesc")
                or "Sandbox payment was not completed."
            )
            db.session.commit()
            return callback_acknowledgement()

        # Both the callback and provider query must report success.
        try:
            callback_code = int(callback.get("ResultCode"))
        except (TypeError, ValueError):
            return callback_acknowledgement()

        if callback_code != 0:
            logger.warning(
                "Callback and STK Query results did not agree."
            )
            return callback_acknowledgement()

        metadata = get_callback_metadata(callback)
        receipt = metadata.get("MpesaReceiptNumber")
        callback_amount = metadata.get("Amount")

        if not receipt or callback_amount is None:
            logger.warning(
                "Successful callback did not contain payment metadata."
            )
            return callback_acknowledgement()

        try:
            confirmed_amount = Decimal(str(callback_amount))
        except (InvalidOperation, TypeError, ValueError):
            return callback_acknowledgement()

        if confirmed_amount != Decimal(str(payment.amount)):
            logger.error(
                "M-Pesa amount mismatch for payment ID %s.",
                payment.id
            )
            payment.result_description = (
                "Provider confirmed a payment, but the amount "
                "requires manual reconciliation."
            )
            db.session.commit()
            return callback_acknowledgement()

        receipt = str(receipt).strip()

        if not receipt or len(receipt) > 100:
            return callback_acknowledgement()

        if Payment.query.filter(
            Payment.mpesa_receipt_number == receipt,
            Payment.id != payment.id
        ).first():
            logger.error("Duplicate M-Pesa receipt detected.")
            return callback_acknowledgement()

        # Check every listing before changing any listing status.
        listings = []

        for order_item in payment.order_items:
            listing = order_item.listing

            if not listing:
                payment.result_description = (
                    "Payment was confirmed, but an order listing "
                    "is missing. Manual reconciliation is required."
                )
                db.session.commit()
                return callback_acknowledgement()

            auto_close_if_expired(listing)

            if (
                not listing_is_available(listing)
                or listing.user_id == payment.user_id
            ):
                payment.result_description = (
                    "Payment was confirmed, but an item is no longer "
                    "available. Manual reconciliation is required."
                )
                db.session.commit()
                return callback_acknowledgement()

            listings.append(listing)

        # Settle the payment and listings together.
        payment.status = "succeeded"
        payment.mpesa_receipt_number = receipt
        payment.result_code = "0"
        payment.result_description = str(
            query_result.get("ResultDesc")
            or callback.get("ResultDesc")
            or "Sandbox payment confirmed."
        )

        for listing in listings:
            listing.status = "sold"

            cart_item = CartItem.query.filter_by(
                user_id=payment.user_id,
                listing_id=listing.id
            ).first()

            if cart_item:
                db.session.delete(cart_item)

        db.session.commit()

        logger.info(
            "Sandbox payment %s confirmed successfully.",
            payment.id
        )

    except (MpesaConfigurationError, MpesaServiceError):
        db.session.rollback()
        logger.exception(
            "Could not verify M-Pesa callback with the sandbox."
        )

    except Exception:
        db.session.rollback()
        logger.exception(
            "Unexpected error while processing M-Pesa callback."
        )

    return callback_acknowledgement()


@payments_bp.get("/<int:payment_id>")
@login_required
def get_payment_status(payment_id):
    payment = db.session.get(Payment, payment_id)

    if not payment:
        return jsonify({"error": "Payment not found."}), 404

    if payment.user_id != current_user.id:
        return jsonify({"error": "You cannot access this payment."}), 403

    return jsonify({
        "payment": {
            "id": payment.id,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "status": payment.status,
            "payment_method": payment.payment_method,
            "receipt_number": payment.mpesa_receipt_number,
            "result_description": payment.result_description,
            "created_at": (
                payment.created_at.isoformat()
                if payment.created_at else None
            ),
            "items": [
                {
                    "title": item.title,
                    "unit_price": float(item.unit_price),
                    "quantity": item.quantity,
                    "image_url": item.image_url,
                }
                for item in payment.order_items
            ],
        }
    }), 200
