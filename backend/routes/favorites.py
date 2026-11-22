from flask import Blueprint, jsonify
from flask_login import login_required, current_user

from extensions import db
from models import Favorite, Listing

favorites_bp = Blueprint("favorites_bp", __name__, url_prefix="/api/favorites")


def _serialize_listing(listing):
    return {
        "id": listing.id,
        "title": listing.title,
        "description": listing.description,
        "price": float(listing.price),
        "category": listing.category,
        "location": listing.location,
        "image_url": listing.image_url,
        "condition": listing.condition,
        "status": listing.status,
        "user_id": listing.user_id,
    }


def _serialize(fav):
    return {
        "id": fav.id,
        "listing_id": fav.listing_id,
        "created_at": fav.created_at.isoformat() if fav.created_at else None,
        "listing": _serialize_listing(fav.listing),
    }


@favorites_bp.get("")
@login_required
def get_favorites():
    """
    List my saved listings
    ---
    tags:
      - Favorites
    security:
      - cookieAuth: []
    responses:
      200:
        description: My favorites with a count and nested listing details
      401:
        description: Not logged in
    """
    favorites = db.session.query(Favorite).filter_by(user_id=current_user.id).all()
    serialized = [_serialize(f) for f in favorites]
    return jsonify({
        "count": len(serialized),
        "favorites": serialized,
    }), 200


@favorites_bp.post("/<int:listing_id>")
@login_required
def add_favorite(listing_id):
    """
    Save a listing to favorites
    ---
    tags:
      - Favorites
    security:
      - cookieAuth: []
    parameters:
      - name: listing_id
        in: path
        type: integer
        required: true
    responses:
      201:
        description: Added to favorites
      404:
        description: Listing not found
      409:
        description: Already in favorites
    """
    listing = db.session.get(Listing, listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    existing = db.session.query(Favorite).filter_by(
        user_id=current_user.id, listing_id=listing.id
    ).first()
    if existing:
        return jsonify({"error": "Listing already in favorites"}), 409

    fav = Favorite(user_id=current_user.id, listing_id=listing.id)
    db.session.add(fav)
    db.session.commit()

    return jsonify(_serialize(fav)), 201


@favorites_bp.delete("/<int:listing_id>")
@login_required
def remove_favorite(listing_id):
    """
    Remove a listing from favorites
    ---
    tags:
      - Favorites
    security:
      - cookieAuth: []
    parameters:
      - name: listing_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Removed
      404:
        description: Not in favorites
    """
    fav = db.session.query(Favorite).filter_by(
        user_id=current_user.id, listing_id=listing_id
    ).first()
    if not fav:
        return jsonify({"error": "Favorite not found"}), 404

    db.session.delete(fav)
    db.session.commit()
    return jsonify({"message": "Removed from favorites"}), 200