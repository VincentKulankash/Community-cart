from decimal import Decimal

import pytest

from extensions import db
from models import CartItem, OrderItem, Payment


def create_pending_payment(buyer, listing):
    payment = Payment(
        user_id=buyer.id,
        amount=Decimal("50000.00"),
        currency="KES",
        status="pending",
        payment_method="mpesa_sandbox",
        merchant_request_id="MERCHANT-TEST-001",
        checkout_request_id="CHECKOUT-TEST-001",
    )
    db.session.add(payment)
    db.session.flush()

    db.session.add(
        OrderItem(
            payment_id=payment.id,
            listing_id=listing.id,
            title=listing.title,
            unit_price=Decimal("50000.00"),
            quantity=1,
            image_url=listing.image_url,
        )
    )

    db.session.add(
        CartItem(
            user_id=buyer.id,
            listing_id=listing.id,
            quantity=1,
        )
    )

    db.session.commit()
    return payment


def successful_query():
    return {
        "ResponseCode": "0",
        "CheckoutRequestID": "CHECKOUT-TEST-001",
        "MerchantRequestID": "MERCHANT-TEST-001",
        "ResultCode": "0",
        "ResultDesc": "The service request is processed successfully.",
    }


def successful_callback():
    return {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "MERCHANT-TEST-001",
                "CheckoutRequestID": "CHECKOUT-TEST-001",
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 50000},
                        {"Name": "MpesaReceiptNumber", "Value": "TESTRECEIPT001"},
                    ]
                },
            }
        }
    }


def test_checkout_requires_login(client):
    response = client.post("/api/payments/checkout")
    assert response.status_code == 401


def test_checkout_rejects_empty_cart(buyer_client):
    response = buyer_client.post("/api/payments/checkout")

    assert response.status_code == 400
    assert "cart is empty" in response.get_json()["error"].lower()


def test_checkout_creates_pending_payment(
    buyer_client, buyer, listing, monkeypatch
):
    from routes import payments

    db.session.add(
        CartItem(
            user_id=buyer.id,
            listing_id=listing.id,
            quantity=1,
        )
    )
    db.session.commit()

    monkeypatch.setattr(
        payments,
        "initiate_stk_push",
        lambda **kwargs: {
            "merchant_request_id": "MERCHANT-CHECKOUT-001",
            "checkout_request_id": "CHECKOUT-CHECKOUT-001",
            "customer_message": "Sandbox request submitted.",
        },
    )

    response = buyer_client.post(
        "/api/payments/checkout",
        json={"phone_number": "0712345678"},
    )

    assert response.status_code == 202
    data = response.get_json()
    assert data["status"] == "pending"
    assert data["amount"] == 50000.0

    payment = db.session.get(Payment, data["payment_id"])
    assert payment is not None
    assert payment.checkout_request_id == "CHECKOUT-CHECKOUT-001"
    assert payment.payment_method == "mpesa_sandbox"
    assert len(payment.order_items) == 1


def test_callback_unknown_checkout_is_acknowledged(client, monkeypatch):
    from routes import payments

    def unexpected_query(*args, **kwargs):
        pytest.fail("Unknown checkout must not trigger an STK Query.")

    monkeypatch.setattr(payments, "query_stk_push", unexpected_query)

    payload = successful_callback()
    response = client.post("/api/payments/callback", json=payload)

    assert response.status_code == 200
    assert response.get_json()["ResultCode"] == 0


def test_callback_without_final_query_result_stays_pending(
    buyer, listing, client, monkeypatch
):
    from routes import payments

    payment = create_pending_payment(buyer, listing)

    monkeypatch.setattr(
        payments,
        "query_stk_push",
        lambda checkout_id: {
            "ResponseCode": "0",
            "CheckoutRequestID": "CHECKOUT-TEST-001",
            "MerchantRequestID": "MERCHANT-TEST-001",
        },
    )

    response = client.post(
        "/api/payments/callback",
        json=successful_callback(),
    )

    assert response.status_code == 200
    db.session.refresh(payment)
    db.session.refresh(listing)

    assert payment.status == "pending"
    assert listing.status == "active"


def test_callback_success_settles_payment_and_listing(
    buyer, listing, client, monkeypatch
):
    from routes import payments

    payment = create_pending_payment(buyer, listing)

    monkeypatch.setattr(
        payments,
        "query_stk_push",
        lambda checkout_id: successful_query(),
    )

    response = client.post(
        "/api/payments/callback",
        json=successful_callback(),
    )

    assert response.status_code == 200

    db.session.refresh(payment)
    db.session.refresh(listing)

    assert payment.status == "succeeded"
    assert payment.result_code == "0"
    assert payment.mpesa_receipt_number == "TESTRECEIPT001"
    assert listing.status == "sold"

    cart_item = CartItem.query.filter_by(
        user_id=buyer.id,
        listing_id=listing.id,
    ).first()
    assert cart_item is None


def test_callback_final_query_failure_marks_payment_failed(
    buyer, listing, client, monkeypatch
):
    from routes import payments

    payment = create_pending_payment(buyer, listing)

    monkeypatch.setattr(
        payments,
        "query_stk_push",
        lambda checkout_id: {
            "ResponseCode": "0",
            "CheckoutRequestID": "CHECKOUT-TEST-001",
            "MerchantRequestID": "MERCHANT-TEST-001",
            "ResultCode": "1032",
            "ResultDesc": "Request cancelled.",
        },
    )

    response = client.post(
        "/api/payments/callback",
        json=successful_callback(),
    )

    assert response.status_code == 200
    db.session.refresh(payment)

    assert payment.status == "failed"
    assert payment.result_code == "1032"


def test_callback_result_mismatch_keeps_payment_pending(
    buyer, listing, client, monkeypatch
):
    from routes import payments

    payment = create_pending_payment(buyer, listing)
    payload = successful_callback()
    payload["Body"]["stkCallback"]["ResultCode"] = 1

    monkeypatch.setattr(
        payments,
        "query_stk_push",
        lambda checkout_id: successful_query(),
    )

    response = client.post("/api/payments/callback", json=payload)

    assert response.status_code == 200
    db.session.refresh(payment)
    assert payment.status == "pending"


def test_payment_status_requires_owner(buyer, seller_client, listing, app):
    payment = create_pending_payment(buyer, listing)

    response = seller_client.get(f"/api/payments/{payment.id}")

    assert response.status_code == 403


def test_payment_status_returns_order_details(
    buyer, buyer_client, listing
):
    payment = create_pending_payment(buyer, listing)

    response = buyer_client.get(f"/api/payments/{payment.id}")

    assert response.status_code == 200
    data = response.get_json()["payment"]

    assert data["id"] == payment.id
    assert data["status"] == "pending"
    assert data["amount"] == 50000.0
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == listing.title
