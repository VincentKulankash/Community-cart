
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from extensions import db
from models import CartItem, Listing
from services.offer_service import auto_close_if_expired


cart_bp = Blueprint("cart_bp", __name__, url_prefix="/api/cart")


def listing_is_available(listing):
    return (
        listing.status in ("active", "open_for_offers")
        and (
            listing.offer_ends_at is None
            or datetime.utcnow() <= listing.offer_ends_at
        )
    )


def serialize_cart_item(item):
    listing = item.listing

    if not listing:
        return None

    available = listing_is_available(listing)

    return {
        "id": item.id,
        "listing_id": listing.id,
        "quantity": item.quantity,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "available": available,
        "unavailable_reason": (
            None if available else (
                "This listing has been sold."
                if listing.status == "sold"
                else "This listing's timeline has expired or closed."
            )
        ),
        "listing": {
            "id": listing.id,
            "title": listing.title,
            "description": listing.description,
            "price": float(listing.price),
            "category": listing.category,
            "condition": listing.condition,
            "location": listing.location,
            "image_url": listing.image_url,
            "status": listing.status,
            "offer_ends_at": (
                listing.offer_ends_at.isoformat()
                if listing.offer_ends_at else None
            ),
            "user_id": listing.user_id,
        },
        "subtotal": (
            float(listing.price) * item.quantity if available else 0
        ),
    }


def get_user_cart():
    return (
        db.session.query(CartItem)
        .filter_by(user_id=current_user.id)
        .all()
    )


@cart_bp.get("")
@login_required
def get_cart():
    items = get_user_cart()

    # Apply the same expiry rules used by the Offers feature.
    for item in items:
        if item.listing:
            auto_close_if_expired(item.listing)

    serialized = [
        serialize_cart_item(item)
        for item in items
    ]

    serialized = [item for item in serialized if item is not None]

    available_items = [
        item for item in serialized if item["available"]
    ]

    return jsonify({
        "items": serialized,
        "item_count": sum(item["quantity"] for item in available_items),
        "subtotal": round(
            sum(item["subtotal"] for item in available_items), 2
        ),
    }), 200


@cart_bp.post("/<int:listing_id>")
@login_required
def add_to_cart(listing_id):
    listing = db.session.get(Listing, listing_id)

    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    auto_close_if_expired(listing)

    if not listing_is_available(listing):
        return jsonify({
            "error": "This listing is no longer available."
        }), 409

    if listing.user_id == current_user.id:
        return jsonify({
            "error": "You cannot add your own listing to cart."
        }), 400

    data = request.get_json(silent=True) or {}
    quantity = data.get("quantity", 1)

    if (
        isinstance(quantity, bool)
        or not isinstance(quantity, int)
        or quantity < 1
    ):
        return jsonify({
            "error": "Quantity must be a positive integer."
        }), 422

    cart_item = db.session.query(CartItem).filter_by(
        user_id=current_user.id,
        listing_id=listing.id,
    ).first()

    if cart_item:
        cart_item.quantity += quantity
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            listing_id=listing.id,
            quantity=quantity,
        )
        db.session.add(cart_item)

    db.session.commit()

    return jsonify({
        "message": "Listing added to cart",
        "item": serialize_cart_item(cart_item),
    }), 201


@cart_bp.patch("/<int:listing_id>")
@login_required
def update_cart_quantity(listing_id):
    cart_item = db.session.query(CartItem).filter_by(
        user_id=current_user.id,
        listing_id=listing_id,
    ).first()

    if not cart_item:
        return jsonify({"error": "Cart item not found"}), 404

    data = request.get_json(silent=True) or {}
    quantity = data.get("quantity")

    if (
        isinstance(quantity, bool)
        or not isinstance(quantity, int)
        or quantity < 1
    ):
        return jsonify({
            "error": "Quantity must be a positive integer."
        }), 422

    cart_item.quantity = quantity
    db.session.commit()

    return jsonify({
        "message": "Cart quantity updated",
        "item": serialize_cart_item(cart_item),
    }), 200


@cart_bp.delete("/<int:listing_id>")
@login_required
def remove_from_cart(listing_id):
    cart_item = db.session.query(CartItem).filter_by(
        user_id=current_user.id,
        listing_id=listing_id,
    ).first()

    if not cart_item:
        return jsonify({"error": "Cart item not found"}), 404

    db.session.delete(cart_item)
    db.session.commit()

    return jsonify({
        "message": "Listing removed from cart"
    }), 200


@cart_bp.delete("")
@login_required
def clear_cart():
    db.session.query(CartItem).filter_by(
        user_id=current_user.id
    ).delete(synchronize_session=False)

    db.session.commit()

    return jsonify({
        "message": "Cart cleared successfully"
    }), 200

