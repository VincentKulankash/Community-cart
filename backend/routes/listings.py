from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from marshmallow import ValidationError

from extensions import db
from models import Listing
from schemas.listing_schema import listing_schema, listing_update_schema
from services.listing_service import (
    filter_listings,
    get_owned_listing,
    mark_sold as mark_listing_sold,
)

listings_bp = Blueprint("listings_bp", __name__, url_prefix="/api/listings")


def to_dict(listing):
    return {
        "id": listing.id,
        "title": listing.title,
        "description": listing.description,
        "price": float(listing.price),  # JSON needs float, but internal is Decimal
        "category": listing.category,
        "location": listing.location,
        "image_url": listing.image_url,
        "condition": listing.condition,
        "status": listing.status,
        "offer_ends_at": listing.offer_ends_at.isoformat() if listing.offer_ends_at else None,
        "user_id": listing.user_id,
    }


def _parse_decimal(value, field_name):
    """Safely parse a numeric query param. Returns (value_or_None, error_or_None)."""
    if value is None or value == "":
        return None, None
    try:
        return Decimal(str(value)), None
    except (InvalidOperation, ValueError):
        return None, f"{field_name} must be a valid number"


# GET all listings (public, with filters)
@listings_bp.get("")
def get_listings():
    category = request.args.get("category")
    search = request.args.get("q")

    min_price, err1 = _parse_decimal(request.args.get("min"), "min")
    if err1:
        return jsonify({"error": err1}), 422

    max_price, err2 = _parse_decimal(request.args.get("max"), "max")
    if err2:
        return jsonify({"error": err2}), 422

    listings = filter_listings(
        category=category,
        search=search,
        min_price=min_price,
        max_price=max_price,
    )
    return jsonify([to_dict(l) for l in listings])


# GET one listing (public)
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

    try:
        validated = listing_schema.load(data)
    except ValidationError as err:
        return jsonify({"error": err.messages}), 422

    # Reject negative/zero price BEFORE inserting
    if validated["price"] <= 0:
        return jsonify({"error": "price must be greater than 0"}), 422

    listing = Listing(
        title=validated["title"],
        description=validated["description"],
        price=validated["price"],
        category=validated["category"],
        condition=validated.get("condition"),
        image_url=validated.get("image_url"),
        location=validated.get("location"),
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

    try:
        validated = listing_update_schema.load(data)
    except ValidationError as err:
        return jsonify({"error": err.messages}), 422

    if "price" in validated and validated["price"] <= 0:
        return jsonify({"error": "price must be greater than 0"}), 422

    for field in ("title", "description", "price", "category", "condition", "image_url", "location"):
        if field in validated:
            setattr(listing, field, validated[field])

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