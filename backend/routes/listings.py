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

from flask import Blueprint

listings_bp = Blueprint("listings_bp", __name__, url_prefix="/api/listings")

# Member 3 will fill in the listings routes here
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from extensions import db
from models import Listing

listings_bp = Blueprint("listings_bp", __name__, url_prefix="/api/listings")


def to_dict(listing):
    return {
        "id": listing.id,
        "title": listing.title,
        "description": listing.description,
        "price": listing.price,
        "category": listing.category,
        "is_sold": listing.is_sold,
        "user_id": listing.user_id,
    }


# Get all listings (with optional filters)
@listings_bp.get("")
def get_listings():
    query = Listing.query

    category = request.args.get("category")
    q = request.args.get("q")
    min_price = request.args.get("min")
    max_price = request.args.get("max")

    if category:
        query = query.filter_by(category=category)
    if q:
        query = query.filter(Listing.title.ilike(f"%{q}%"))
    if min_price:
        query = query.filter(Listing.price >= float(min_price))
    if max_price:
        query = query.filter(Listing.price <= float(max_price))

    listings = query.all()
    return jsonify([to_dict(l) for l in listings])


# Get one listing
@listings_bp.get("/<int:id>")
def get_listing(id):
    listing = Listing.query.get(id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404
    return jsonify(to_dict(listing))


# Create a listing
@listings_bp.post("")
@login_required
def create_listing():
    data = request.get_json()

    listing = Listing(
        title=data["title"],
        description=data.get("description"),
        price=data["price"],
        category=data.get("category"),
        user_id=current_user.id,
    )
    db.session.add(listing)
    db.session.commit()
    return jsonify(to_dict(listing)), 201


# Update a listing (owner only)
@listings_bp.patch("/<int:id>")
@login_required
def update_listing(id):
    listing = Listing.query.get(id)
    if not listing or listing.user_id != current_user.id:
        return jsonify({"error": "Listing not found"}), 404

    data = request.get_json()
    listing.title = data.get("title", listing.title)
    listing.description = data.get("description", listing.description)
    listing.price = data.get("price", listing.price)
    listing.category = data.get("category", listing.category)

    db.session.commit()
    return jsonify(to_dict(listing))


# Delete a listing (owner only)
@listings_bp.delete("/<int:id>")
@login_required
def delete_listing(id):
    listing = Listing.query.get(id)
    if not listing or listing.user_id != current_user.id:
        return jsonify({"error": "Listing not found"}), 404

    db.session.delete(listing)
    db.session.commit()
    return "", 204


# Mark a listing as sold (owner only)
@listings_bp.patch("/<int:id>/sold")
@login_required
def mark_sold(id):
    listing = Listing.query.get(id)
    if not listing or listing.user_id != current_user.id:
        return jsonify({"error": "Listing not found"}), 404

    listing.is_sold = True
    db.session.commit()
    return jsonify(to_dict(listing))
