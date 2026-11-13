# OWNER: MEMBER 3 (Listings CRUD)
# TASKS:
# 1. GET    /api/listings      (Public, with filters: ?category=&q=&min=&max=)
# 2. GET    /api/listings/<id> (Public, view details)
# 3. POST   /api/listings      (Auth required, owner = current_user)
# 4. PATCH  /api/listings/<id> (Auth required, owner ONLY)
# 5. DELETE /api/listings/<id> (Auth required, owner ONLY)
# 6. PATCH  /api/listings/<id>/sold (Auth required, owner ONLY)
# RULES:
# - Use @login_required for auth routes.
# - If user A tries to edit user B's listing, return 404 (not 403).

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from extensions import db
from models import Listing
from services.listing_service import (
    filter_listings,
    get_owned_listing,
    mark_sold as mark_listing_sold,   # ← renamed to avoid collision
)

listings_bp = Blueprint("listings_bp", __name__, url_prefix="/api/listings")


def to_dict(listing):
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
        "offer_ends_at": listing.offer_ends_at.isoformat() if listing.offer_ends_at else None,
        "user_id": listing.user_id,
    }


# GET all listings (with optional filters)
@listings_bp.get("")
def get_listings():
    category = request.args.get("category")
    search = request.args.get("q")
    min_price = request.args.get("min")
    max_price = request.args.get("max")

    listings = filter_listings(
        category=category,
        search=search,
        min_price=float(min_price) if min_price else None,
        max_price=float(max_price) if max_price else None,
    )
    return jsonify([to_dict(l) for l in listings])


# GET one listing
@listings_bp.get("/<int:id>")
def get_listing(id):
    listing = db.session.get(Listing, id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    return jsonify(to_dict(listing))


# CREATE a listing
@listings_bp.post("")
@login_required
def create_listing():
    data = request.get_json(silent=True) or {}

    if not data.get("title") or not data.get("price") or not data.get("category"):
        return jsonify({"error": "title, price and category are required"}), 422

    try:
        price = float(data["price"])
    except (TypeError, ValueError):
        return jsonify({"error": "price must be a number"}), 422

    listing = Listing(
        title=data["title"],
        description=data.get("description"),
        price=price,
        category=data["category"],
        condition=data.get("condition"),
        image_url=data.get("image_url"),
        location=data.get("location"),
        status="active",
        user_id=current_user.id,
    )
    db.session.add(listing)
    db.session.commit()
    return jsonify(to_dict(listing)), 201


# UPDATE a listing (owner only)
@listings_bp.patch("/<int:id>")
@login_required
def update_listing(id):
    listing = get_owned_listing(id, current_user)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    data = request.get_json(silent=True) or {}

    if "title" in data:
        listing.title = data["title"]
    if "description" in data:
        listing.description = data["description"]
    if "price" in data:
        try:
            listing.price = float(data["price"])
        except (TypeError, ValueError):
            return jsonify({"error": "price must be a number"}), 422
    if "category" in data:
        listing.category = data["category"]
    if "condition" in data:
        listing.condition = data["condition"]
    if "image_url" in data:
        listing.image_url = data["image_url"]
    if "location" in data:
        listing.location = data["location"]

    db.session.commit()
    return jsonify(to_dict(listing)), 200


# DELETE a listing (owner only)
@listings_bp.delete("/<int:id>")
@login_required
def delete_listing(id):
    listing = get_owned_listing(id, current_user)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    db.session.delete(listing)
    db.session.commit()
    return jsonify({"message": "Listing deleted"}), 200


# MARK a listing as sold (owner only)
@listings_bp.patch("/<int:id>/sold")
@login_required
def mark_sold(id):
    listing = get_owned_listing(id, current_user)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    mark_listing_sold(listing)
    return jsonify(to_dict(listing)), 200