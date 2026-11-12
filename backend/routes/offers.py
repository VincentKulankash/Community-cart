# OWNER: VINCENT (Scrum Master / Offers Engine)
# TASKS:
# 1. POST   /api/listings/<id>/offers (Submit sealed offer, auth required, NOT owner)
# 2. GET    /api/listings/<id>/offers (Owner only: view all offers)
# 3. GET    /api/listings/<id>/offers/mine (Buyer: view own offer + outbid status)
# 4. POST   /api/listings/<id>/offers/close (Owner only: finalize winner now)
# RULES:
# - Outbid logic: If a new offer is higher, trigger Mailtrap email to the previous highest bidder.
# - Tie-break: Earliest offer wins.
# - Auto-close: If deadline passed on read/write, finalize winner.
# - Owner cannot offer on own listing.


from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from extensions import db
from models import Listing, Offer
from services.offer_service import (
    submit_offer,
    close_listing_auction,
    auto_close_if_expired,
    get_highest_offer,
)


offers_bp = Blueprint("offers_bp", __name__, url_prefix="/api/listings")

# Vincent will fill in the offers routes here

def _serialize_offer(offer):
    return {
        "id": offer.id,
        "listing_id":offer.listing_id,
        "buyer_id":offer.buyer_id,
        "amount": float(offer.amount),
        "message": offer.message,
        "is_active": offer.is_active,
        "is_winner": offer.is_winner,
         "created_at": offer.created_at.isoformat() if offer.created_at else None,
    }

#submit offer
@offers_bp.route("/<int:listing_id>/offers", methods=['POST'])
@login_required
def create_offer(listing_id):
    listing = db.session.query(Listing).get(listing_id)
    if not listing:
        return jsonify({"error":"Listing not found"}), 404

    data = request.get_json(silent=True) or {}
    amount = data.get("amount")
    message= data.get("message")

    if amount is None:
        return jsonify({"error":"amount is required"}), 422
    try:
        amount=float(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be a number"}), 422

    if amount <= 0:
        return jsonify({"error": "amount must be greater than 0"}), 422

    offer, error = submit_offer(current_user.id, listing, amount, message)
    if error:
        return jsonify({"error":error}), 400

    return jsonify(_serialize_offer(offer)), 201

#owner views all offers
@offers_bp.route("/<int:listing_id>/offers", methods=["GET"])
@login_required
def list_offers(listing_id):
    listing = db.session.query(Listing).get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    if listing.user_id != current_user.id:
        return jsonify({"error": "Listing not found"}), 404 #not to leak existence

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
        # "winner_id": listing.winner_id,  # TO DO: enable after winner_id column is added
        "offers": [_serialize_offer(o) for o in offers],
    }), 200


#Buyer views own offer
@offers_bp.route("/<int:listing_id>/offers/mine", methods=['GET'])
@login_required
def my_offer(listing_id):
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
    outbid=bool(highest and highest.buyer_id != current_user.id and not my.is_winner)

    return jsonify({
        "offer": _serialize_offer(my),
        "is_outbid": outbid,
        "listing_status": listing.status,
    }), 200

#Owner closes auction manually
@offers_bp.route("/<int:listing_id>/offers/close", methods=["POST"])
@login_required
def close_auction(listing_id):
    listing = db.session.query(Listing).get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    if listing.user_id != current_user.id:
        return jsonify({"error": "Listing not found"}), 404

    winner, did_close = close_listing_auction(listing)
    if not did_close:
        return jsonify({"error":"Listing already closed"}), 400

    return jsonify({
        "message": "Auction closed",
        # "winner_id": listing.winner_id,  # TO DO: enable after winner_id column is added
        "winner_offer_id": winner.id if winner else None,
        "status": listing.status,
    }), 200