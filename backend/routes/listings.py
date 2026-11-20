
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from extensions import db
from models import Listing
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
        "price": float(listing.price),
        "category": listing.category,
        "location": listing.location,
        "image_url": listing.image_url,
        "condition": listing.condition,
        "status": listing.status,
        "offer_ends_at": (
            listing.offer_ends_at.isoformat()
            if listing.offer_ends_at
            else None
        ),
        "user_id": listing.user_id,
    }


@listings_bp.get("")
def get_listings():
    """
    List all listings (public)
    ---
    tags:
      - Listings
    parameters:
      - name: category
        in: query
        type: string
        required: false
      - name: q
        in: query
        type: string
        required: false
        description: Search title
      - name: min
        in: query
        type: number
        required: false
      - name: max
        in: query
        type: number
        required: false
    responses:
      200:
        description: Array of listings
    """
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

    return jsonify([to_dict(listing) for listing in listings])


@listings_bp.get("/<int:id>")
def get_listing(id):
    """
    Get a single listing by ID
    ---
    tags:
      - Listings
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Listing details
      404:
        description: Not found
    """
    listing = db.session.get(Listing, id)

    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    return jsonify(to_dict(listing))


@listings_bp.post("")
@login_required
def create_listing():
    """
    Create a new listing
    ---
    tags:
      - Listings
    security:
      - cookieAuth: []
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [title, price, category]
          properties:
            title:
              type: string
            description:
              type: string
            price:
              type: number
            category:
              type: string
            condition:
              type: string
            image_url:
              type: string
            location:
              type: string
            offer_ends_at:
              type: string
              format: date-time
              description: Deadline for submitting offers
    responses:
      201:
        description: Created
      401:
        description: Not logged in
      422:
        description: Validation error
    """
    data = request.get_json(silent=True) or {}

    if (
        not data.get("title")
        or data.get("price") is None
        or data.get("price") == ""
        or not data.get("category")
    ):
        return jsonify({
            "error": "title, price and category are required"
        }), 422

    offer_ends_at = None

    if data.get("offer_ends_at"):
        try:
            offer_ends_at = datetime.fromisoformat(data["offer_ends_at"])
        except (TypeError, ValueError):
            return jsonify({
                "error": "Invalid offer deadline format"
            }), 422

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
        offer_ends_at=offer_ends_at,
        status="active",
        user_id=current_user.id,
    )

    db.session.add(listing)
    db.session.commit()

    return jsonify(to_dict(listing)), 201


@listings_bp.patch("/<int:id>")
@login_required
def update_listing(id):
    """
    Update a listing (owner only)
    ---
    tags:
      - Listings
    security:
      - cookieAuth: []
    parameters:
      - name: id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
            description:
              type: string
            price:
              type: number
            category:
              type: string
            condition:
              type: string
            image_url:
              type: string
            location:
              type: string
            offer_ends_at:
              type: string
              format: date-time
              description: Deadline for submitting offers
    responses:
      200:
        description: Updated
      404:
        description: Not found / not owned
      422:
        description: Validation error
    """
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

    if "offer_ends_at" in data:
        if data["offer_ends_at"] is None or data["offer_ends_at"] == "":
            listing.offer_ends_at = None
        else:
            try:
                listing.offer_ends_at = datetime.fromisoformat(
                    data["offer_ends_at"]
                )
            except (TypeError, ValueError):
                return jsonify({
                    "error": "Invalid offer deadline format"
                }), 422

    db.session.commit()

    return jsonify(to_dict(listing)), 200


@listings_bp.delete("/<int:id>")
@login_required
def delete_listing(id):
    """
    Delete a listing (owner only)
    ---
    tags:
      - Listings
    security:
      - cookieAuth: []
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Deleted
      404:
        description: Not found / not owned
    """
    listing = get_owned_listing(id, current_user)

    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    db.session.delete(listing)
    db.session.commit()

    return jsonify({"message": "Listing deleted"}), 200


@listings_bp.patch("/<int:id>/sold")
@login_required
def mark_sold(id):
    """
    Mark a listing as sold (owner only)
    ---
    tags:
      - Listings
    security:
      - cookieAuth: []
    parameters:
      - name: id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Listing marked sold
      404:
        description: Not found / not owned
    """
    listing = get_owned_listing(id, current_user)

    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    mark_listing_sold(listing)

    return jsonify(to_dict(listing)), 200
