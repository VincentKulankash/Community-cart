from datetime import datetime

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
        "reply": inq.reply,
        "replied_at": inq.replied_at.isoformat() if inq.replied_at else None,
    }


def _serialize_thread(inq):
    """Inquiry plus who it is between and which listing it is about."""
    data = _serialize(inq)
    listing = inq.listing
    data["buyer_name"] = inq.buyer.name if inq.buyer else None
    data["listing"] = {
        "id": listing.id,
        "title": listing.title,
        "image_url": listing.image_url,
        "status": listing.status,
        "seller_name": listing.seller.name if listing.seller else None,
    }
    return data


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

    inquiries = (
        db.session.query(Inquiry)
        .filter_by(listing_id=listing.id)
        .order_by(Inquiry.created_at.desc())
        .all()
    )
    serialized = [_serialize_thread(i) for i in inquiries]
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
    inquiries = (
        db.session.query(Inquiry)
        .filter_by(buyer_id=current_user.id)
        .order_by(Inquiry.created_at.desc())
        .all()
    )
    serialized = [_serialize_thread(i) for i in inquiries]
    return jsonify({
        "count": len(serialized),
        "inquiries": serialized,
    }), 200


@inquiries_bp.get("/inquiries/received")
@login_required
def received_inquiries():
    """
    View inquiries sent to me about my listings
    ---
    tags:
      - Inquiries
    security:
      - cookieAuth: []
    responses:
      200:
        description: Inquiries on all my listings, newest first
    """
    inquiries = (
        db.session.query(Inquiry)
        .join(Listing, Inquiry.listing_id == Listing.id)
        .filter(Listing.user_id == current_user.id)
        .order_by(Inquiry.created_at.desc())
        .all()
    )
    serialized = [_serialize_thread(i) for i in inquiries]
    return jsonify({
        "count": len(serialized),
        "unanswered": sum(1 for i in inquiries if not i.reply),
        "inquiries": serialized,
    }), 200


@inquiries_bp.post("/inquiries/<int:inquiry_id>/reply")
@login_required
def reply_to_inquiry(inquiry_id):
    """
    Reply to an inquiry about my listing (seller only)
    ---
    tags:
      - Inquiries
    security:
      - cookieAuth: []
    parameters:
      - name: inquiry_id
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
              example: Yes, it is still available.
    responses:
      200:
        description: Reply saved
      400:
        description: Message required
      404:
        description: Not found / not your listing
    """
    inquiry = db.session.get(Inquiry, inquiry_id)
    if not inquiry or inquiry.listing.user_id != current_user.id:
        return jsonify({"error": "Inquiry not found"}), 404

    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message is required"}), 400
    if len(message) > 2000:
        return jsonify({"error": "message must be 2000 characters or fewer"}), 400

    inquiry.reply = message
    inquiry.replied_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message": "Reply sent.",
        "inquiry": _serialize_thread(inquiry),
    }), 200