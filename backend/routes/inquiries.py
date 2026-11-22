from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from extensions import db
from models import Inquiry, Listing

inquiries_bp = Blueprint("inquiries_bp", __name__, url_prefix="/api")


def _serialize(inq):
    return {
        "id": inq.id,
        "listing_id": inq.listing_id,
        "buyer_id": inq.buyer_id,
        "message": inq.message,
        "created_at": inq.created_at.isoformat() if inq.created_at else None,
    }


@inquiries_bp.post("/listings/<int:listing_id>/inquiries")
@login_required
def send_inquiry(listing_id):
    """
    Send an inquiry to a listing's seller
    ---
    tags:
      - Inquiries
    security:
      - cookieAuth: []
    parameters:
      - name: listing_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [message]
          properties:
            message:
              type: string
              example: Is this still available?
    responses:
      201:
        description: Inquiry sent
      403:
        description: Cannot inquire on your own listing
      404:
        description: Listing not found
      400:
        description: Message required
    """
    listing = db.session.get(Listing, listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    if listing.user_id == current_user.id:
        return jsonify({"error": "Cannot inquire on your own listing"}), 403

    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message is required"}), 400

    inq = Inquiry(
        listing_id=listing.id,
        buyer_id=current_user.id,
        message=message,
    )
    db.session.add(inq)
    db.session.commit()

    return jsonify({
        "message": "Inquiry sent successfully.",
        "inquiry": _serialize(inq),
    }), 201


@inquiries_bp.get("/listings/<int:listing_id>/inquiries")
@login_required
def listing_inquiries(listing_id):
    """
    View all inquiries on one of my listings (owner only)
    ---
    tags:
      - Inquiries
    security:
      - cookieAuth: []
    parameters:
      - name: listing_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: All inquiries for the listing
      403:
        description: Not the owner
      404:
        description: Listing not found
    """
    listing = db.session.get(Listing, listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    if listing.user_id != current_user.id:
        return jsonify({"error": "Forbidden"}), 403

    inquiries = db.session.query(Inquiry).filter_by(listing_id=listing.id).all()
    serialized = [_serialize(i) for i in inquiries]
    return jsonify({
        "count": len(serialized),
        "inquiries": serialized,
    }), 200


@inquiries_bp.get("/inquiries/sent")
@login_required
def sent_inquiries():
    """
    View inquiries I have sent
    ---
    tags:
      - Inquiries
    security:
      - cookieAuth: []
    responses:
      200:
        description: Array of my sent inquiries with a count
    """
    inquiries = db.session.query(Inquiry).filter_by(buyer_id=current_user.id).all()
    serialized = [_serialize(i) for i in inquiries]
    return jsonify({
        "count": len(serialized),
        "inquiries": serialized,
    }), 200