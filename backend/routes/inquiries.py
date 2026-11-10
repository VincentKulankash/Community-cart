
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from extensions import db
from models import Inquiry, Listing

inquiries_bp = Blueprint(
    "inquiries_bp",
    __name__,
    url_prefix="/api"
)


def serialize_inquiry(inquiry):
    return {
        "id": inquiry.id,
        "message": inquiry.message,
        "created_at": (
            inquiry.created_at.isoformat()
            if inquiry.created_at else None
        ),
        "buyer": {
            "id": inquiry.buyer.id,
            "name": inquiry.buyer.name
        },
        "listing": {
            "id": inquiry.listing.id,
            "title": inquiry.listing.title,
            "price": str(inquiry.listing.price)
        }
    }


# POST /api/listings/<listing_id>/inquiries
# A logged-in buyer sends a message about a listing.
@inquiries_bp.route(
    "/listings/<int:listing_id>/inquiries",
    methods=["POST"]
)
@login_required
def create_inquiry(listing_id):
    listing = db.session.get(Listing, listing_id)

    if listing is None:
        return jsonify({"error": "Listing not found."}), 404

    if listing.user_id == current_user.id:
        return jsonify({
            "error": "You cannot send an inquiry about your own listing."
        }), 403

    data = request.get_json(silent=True) or {}
    message = data.get("message", "")

    if not isinstance(message, str) or not message.strip():
        return jsonify({
            "error": "A message is required."
        }), 400

    inquiry = Inquiry(
        listing_id=listing.id,
        buyer_id=current_user.id,
        message=message.strip()
    )

    db.session.add(inquiry)
    db.session.commit()

    return jsonify({
        "message": "Inquiry sent successfully.",
        "inquiry": serialize_inquiry(inquiry)
    }), 201


# GET /api/listings/<listing_id>/inquiries
# Only the listing owner can view its inquiries.
@inquiries_bp.route(
    "/listings/<int:listing_id>/inquiries",
    methods=["GET"]
)
@login_required
def get_listing_inquiries(listing_id):
    listing = db.session.get(Listing, listing_id)

    if listing is None:
        return jsonify({"error": "Listing not found."}), 404

    if listing.user_id != current_user.id:
        return jsonify({
            "error": "You are not authorized to view these inquiries."
        }), 403

    inquiries = (
        Inquiry.query
        .filter_by(listing_id=listing_id)
        .order_by(Inquiry.created_at.desc())
        .all()
    )

    return jsonify({
        "count": len(inquiries),
        "inquiries": [
            serialize_inquiry(inquiry)
            for inquiry in inquiries
        ]
    }), 200


# GET /api/inquiries/sent
# A buyer views their own sent inquiries.
@inquiries_bp.route(
    "/inquiries/sent",
    methods=["GET"]
)
@login_required
def get_sent_inquiries():
    inquiries = (
        Inquiry.query
        .filter_by(buyer_id=current_user.id)
        .order_by(Inquiry.created_at.desc())
        .all()
    )

    return jsonify({
        "count": len(inquiries),
        "inquiries": [
            serialize_inquiry(inquiry)
            for inquiry in inquiries
        ]
    }), 200
