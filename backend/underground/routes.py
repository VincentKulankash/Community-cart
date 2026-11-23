import logging
from datetime import datetime
from decimal import Decimal

from bson import ObjectId
from bson.errors import InvalidId
from bson.decimal128 import Decimal128
from flask import Blueprint, current_app, jsonify, request, session
from pymongo.errors import PyMongoError
from werkzeug.exceptions import BadRequest

from underground.access import MINIMUM_AGE, underground_age_required
from underground.database import (
    MARKETPLACE_ID,
    UndergroundMongoConfigurationError,
    get_underground_products,
)
from underground.schemas import (
    product_query_schema,
    underground_age_verification_schema,
)
from underground.services import get_categories, get_product, search_products
from underground.mock_catalog import (
    get_demo_categories,
    get_demo_product,
    search_demo_products,
)
from marshmallow import ValidationError

log = logging.getLogger(__name__)
underground_bp = Blueprint(
    "underground_bp",
    __name__,
    url_prefix="/api/underground",
)


@underground_bp.get("/age-verification")
def age_verification_status():
    return jsonify(
        {
            "verified": session.get("underground_age_verified") is True,
            "minimum_age": MINIMUM_AGE,
            "simulated": True,
        }
    ), 200


@underground_bp.post("/age-verification")
def verify_underground_age():
    if not request.is_json:
        return jsonify(
            {
                "error": "A JSON age confirmation is required.",
                "code": "invalid_content_type",
            }
        ), 415

    try:
        data = request.get_json()
    except BadRequest:
        return jsonify(
            {
                "error": "The request body must contain valid JSON.",
                "code": "invalid_json",
            }
        ), 400

    try:
        values = underground_age_verification_schema.load(data)
    except ValidationError as error:
        return jsonify(
            {
                "error": "Invalid age verification request.",
                "details": error.messages,
                "code": "invalid_age",
            }
        ), 422

    if values["age"] < MINIMUM_AGE:
        session.pop("underground_age_verified", None)
        return jsonify(
            {
                "error": f"You must be at least {MINIMUM_AGE} to enter Underground.",
                "code": "underground_age_rejected",
            }
        ), 403

    session["underground_age_verified"] = True
    return jsonify(
        {
            "verified": True,
            "minimum_age": MINIMUM_AGE,
            "simulated": True,
        }
    ), 200


def serialize_product(product):
    raw_price = product.get("price", 0)
    if isinstance(raw_price, Decimal128):
        raw_price = raw_price.to_decimal()
    price = float(Decimal(str(raw_price)))

    created_at = product.get("created_at")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()

    return {
        "id": str(product["_id"]),
        "name": product["name"],
        "description": product["description"],
        "price": price,
        "category": product["category"],
        "subcategory": product["subcategory"],
        "image": product["image"],
        "vendor_id": product["vendor_id"],
        "availability": product["availability"],
        "average_rating": float(product.get("average_rating", 0)),
        "created_at": created_at,
        "marketplace": MARKETPLACE_ID,
    }


def _database_unavailable(configuration_error=False):
    log.exception("Underground MongoDB request failed.")
    if configuration_error:
        return jsonify(
            {
                "error": "Underground catalog is temporarily unavailable.",
                "hint": "Set MONGODB_URI in backend/.env, make sure MongoDB is running, and restart Flask.",
                "code": "underground_database_not_configured",
            }
        ), 503
    return jsonify({"error": "Underground catalog is temporarily unavailable."}), 503


@underground_bp.get("/products")
@underground_age_required
def products():
    try:
        filters = product_query_schema.load(request.args.to_dict())
    except ValidationError as error:
        return jsonify(
            {
                "error": "Invalid product query.",
                "details": error.messages,
            }
        ), 422

    min_price = filters.get("min_price")
    max_price = filters.get("max_price")
    if min_price is not None and max_price is not None and min_price > max_price:
        return jsonify(
            {"error": "min_price cannot be greater than max_price."}
        ), 422

    for field in ("q", "category", "subcategory"):
        if filters.get(field) is not None:
            filters[field] = filters[field].strip() or None

    if current_app.config.get("UNDERGROUND_DEMO_MODE"):
        result = search_demo_products(filters)
    else:
        try:
            result = search_products(get_underground_products(), filters)
        except UndergroundMongoConfigurationError:
            return _database_unavailable(configuration_error=True)
        except PyMongoError:
            return _database_unavailable()
    result["items"] = [serialize_product(item) for item in result["items"]]
    return jsonify(result), 200


@underground_bp.get("/products/<product_id>")
@underground_age_required
def product_detail(product_id):
    try:
        object_id = ObjectId(product_id)
    except (InvalidId, TypeError):
        return jsonify({"error": "Invalid product ID."}), 400

    if current_app.config.get("UNDERGROUND_DEMO_MODE"):
        product = get_demo_product(object_id)
    else:
        try:
            product = get_product(get_underground_products(), object_id)
        except UndergroundMongoConfigurationError:
            return _database_unavailable(configuration_error=True)
        except PyMongoError:
            return _database_unavailable()

    if product is None:
        return jsonify({"error": "Underground product not found."}), 404
    return jsonify(serialize_product(product)), 200


@underground_bp.get("/categories")
@underground_age_required
def categories():
    if current_app.config.get("UNDERGROUND_DEMO_MODE"):
        items = get_demo_categories()
    else:
        try:
            items = get_categories(get_underground_products())
        except UndergroundMongoConfigurationError:
            return _database_unavailable(configuration_error=True)
        except PyMongoError:
            return _database_unavailable()
    return jsonify({"items": items}), 200
