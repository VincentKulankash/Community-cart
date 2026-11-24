from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from extensions import db
from models import Listing, Offer
from services.offer_service import (
    accept_offer,
    submit_offer,
    close_listing_auction,
    auto_close_if_expired,
    get_highest_offer,
)

offers_bp = Blueprint("offers_bp", __name__, url_prefix="/api/listings")


def _serialize_offer(offer, include_buyer=False):
    data = {
        "id": offer.id,
        "listing_id": offer.listing_id,
        "buyer_id": offer.buyer_id,
        "amount": float(offer.amount),
        "message": offer.message,
        "is_active": offer.is_active,
        "is_winner": offer.is_winner,
        "created_at": offer.created_at.isoformat() if offer.created_at else None,
    }
    if include_buyer:
        data["buyer_name"] = offer.buyer.name if offer.buyer else None
    return data


@offers_bp.route("/<int:listing_id>/offers", methods=["POST"])
@login_required
def create_offer(listing_id):
    """
    Submit a sealed offer on a listing
    ---
    tags:
      - Offers
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
          required: [amount]
          properties:
            amount:
              type: number
              example: 50.00
            message:
              type: string
              example: Can I pick it up this weekend?
    responses:
      201:
        description: Offer created (and outbid email sent to previous top bidder if applicable)
      400:
        description: Invalid offer (own listing, sold, deadline passed)
      401:
        description: Not logged in
      404:
        description: Listing not found
      422:
        description: Validation error
    """
    listing = db.session.query(Listing).get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    data = request.get_json(silent=True) or {}
    amount = data.get("amount")
    message = data.get("message")

    if amount is None:
        return jsonify({"error": "amount is required"}), 422
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be a number"}), 422

    if amount <= 0:
        return jsonify({"error": "amount must be greater than 0"}), 422

    offer, error = submit_offer(current_user.id, listing, amount, message)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(_serialize_offer(offer)), 201


@offers_bp.route("/<int:listing_id>/offers", methods=["GET"])
@login_required
def list_offers(listing_id):
    """
    List all offers on a listing (owner only)
    ---
    tags:
      - Offers
    security:
      - cookieAuth: []
    parameters:
      - name: listing_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: All offers, highest first
      404:
        description: Not found / not the owner
    """
    listing = db.session.query(Listing).get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    if listing.user_id != current_user.id:
        return jsonify({"error": "Listing not found"}), 404

    auto_close_if_expired(listing)

    offers = (
        db.session.query(Offer)
        .filter_by(listing_id=listing.id)
        .order_by(Offer.amount.desc(), Offer.created_at.asc())
        .all()
    )

    return jsonify({
        "listing_id": listing.id,
        "status": listing.status,
        "winner_id": listing.winner_id,
        "offers": [_serialize_offer(o, include_buyer=True) for o in offers],
    }), 200


@offers_bp.route("/<int:listing_id>/offers/mine", methods=["GET"])
@login_required
def my_offer(listing_id):
    """
    Get my own offer on a listing
    ---
    tags:
      - Offers
    security:
      - cookieAuth: []
    parameters:
      - name: listing_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: My offer (or null) plus outbid status
      404:
        description: Listing not found
    """
    listing = db.session.query(Listing).get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    auto_close_if_expired(listing)

    my = (
        db.session.query(Offer)
        .filter_by(listing_id=listing.id, buyer_id=current_user.id)
        .order_by(Offer.created_at.desc())
        .first()
    )

    if not my:
        return jsonify({"offer": None, "message": "You have not offered on this listing"}), 200

    highest = get_highest_offer(listing.id)
    outbid = bool(highest and highest.buyer_id != current_user.id and not my.is_winner)

    return jsonify({
        "offer": _serialize_offer(my),
        "is_outbid": outbid,
        "listing_status": listing.status,
    }), 200


@offers_bp.route("/<int:listing_id>/offers/close", methods=["POST"])
@login_required
def close_auction(listing_id):
    """
    Close an auction early and finalize the winner (owner only)
    ---
    tags:
      - Offers
    security:
      - cookieAuth: []
    parameters:
      - name: listing_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Auction closed; winner set
      400:
        description: Listing already closed
      404:
        description: Not found / not the owner
    """
    listing = db.session.query(Listing).get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    if listing.user_id != current_user.id:
        return jsonify({"error": "Listing not found"}), 404

    winner, did_close = close_listing_auction(listing)
    if not did_close:
        return jsonify({"error": "Listing already closed"}), 400

    return jsonify({
        "message": "Auction closed",
        "winner_id": listing.winner_id,
        "winner_offer_id": winner.id if winner else None,
        "status": listing.status,
    }), 200


@offers_bp.route("/<int:listing_id>/offers/<int:offer_id>/accept", methods=["POST"])
@login_required
def accept_offer_route(listing_id, offer_id):
    """
    Accept a specific offer and mark the listing as sold (owner only)
    ---
    tags:
      - Offers
    security:
      - cookieAuth: []
    parameters:
      - name: listing_id
        in: path
        type: integer
        required: true
      - name: offer_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Offer accepted; listing marked sold
      400:
        description: Listing was closed without a sale
      404:
        description: Not found / not the owner
    """
    listing = db.session.query(Listing).get(listing_id)
    if not listing or listing.user_id != current_user.id:
        return jsonify({"error": "Listing not found"}), 404

    offer = db.session.query(Offer).get(offer_id)
    if not offer or offer.listing_id != listing.id:
        return jsonify({"error": "Offer not found"}), 404

    accepted, error = accept_offer(listing, offer)
    if error:
        return jsonify({"error": error}), 400

    return jsonify({
        "message": "Offer accepted",
        "status": listing.status,
        "winner_id": listing.winner_id,
        "offer": _serialize_offer(accepted, include_buyer=True),
    }), 200