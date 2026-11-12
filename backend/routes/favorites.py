
from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import Favorite, Listing

favorites_bp = Blueprint(
    "favorites_bp",
    __name__,
    url_prefix="/api/favorites"
)


def serialize_favorite(favorite):
    listing = favorite.listing

    return {
        "favorite_id": favorite.id,
        "saved_at": (
            favorite.created_at.isoformat()
            if favorite.created_at else None
        ),
        "listing": {
            "id": listing.id,
            "title": listing.title,
            "description": listing.description,
            "price": str(listing.price),
            "category": listing.category,
            "condition": listing.condition,
            "image_url": listing.image_url,
            "location": listing.location,
            "status": listing.status,
            "offer_ends_at": (
                listing.offer_ends_at.isoformat()
                if listing.offer_ends_at else None
            ),
            "seller_id": listing.user_id,
            "created_at": (
                listing.created_at.isoformat()
                if listing.created_at else None
            )
        }
    }


# GET /api/favorites
# Return the logged-in user's saved listings.
@favorites_bp.route("", methods=["GET"])
@login_required
def get_favorites():
    favorites = (
        Favorite.query
        .filter_by(user_id=current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )

    return jsonify({
        "count": len(favorites),
        "favorites": [
            serialize_favorite(favorite)
            for favorite in favorites
        ]
    }), 200


# POST /api/favorites/<listing_id>
# Save a listing for the logged-in user.
@favorites_bp.route("/<int:listing_id>", methods=["POST"])
@login_required
def add_favorite(listing_id):
    listing = db.session.get(Listing, listing_id)

    if listing is None:
        return jsonify({
            "error": "Listing not found."
        }), 404

    existing_favorite = Favorite.query.filter_by(
        user_id=current_user.id,
        listing_id=listing_id
    ).first()

    if existing_favorite:
        return jsonify({
            "error": "This listing is already in your favorites."
        }), 409

    favorite = Favorite(
        user_id=current_user.id,
        listing_id=listing_id
    )

    try:
        db.session.add(favorite)
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "error": "This listing is already in your favorites."
        }), 409

    return jsonify({
        "message": "Listing added to favorites.",
        "favorite": serialize_favorite(favorite)
    }), 201


# DELETE /api/favorites/<listing_id>
# Remove a listing from the logged-in user's favorites.
@favorites_bp.route("/<int:listing_id>", methods=["DELETE"])
@login_required
def remove_favorite(listing_id):
    favorite = Favorite.query.filter_by(
        user_id=current_user.id,
        listing_id=listing_id
    ).first()

    if favorite is None:
        return jsonify({
            "error": "Favorite not found."
        }), 404

    db.session.delete(favorite)
    db.session.commit()

    return jsonify({
        "message": "Listing removed from favorites."
    }), 200
