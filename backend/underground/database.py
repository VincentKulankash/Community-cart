import os
from threading import Lock

from flask import current_app
from pymongo import ASCENDING, DESCENDING, TEXT, IndexModel, MongoClient

MARKETPLACE_ID = "underground"
PRODUCTS_COLLECTION = "underground_products"
DEFAULT_DATABASE_NAME = "community_cart_underground"

PRODUCT_INDEXES = (
    IndexModel(
        [("marketplace", ASCENDING), ("category", ASCENDING)],
        name="underground_marketplace_category",
    ),
    IndexModel(
        [("marketplace", ASCENDING), ("subcategory", ASCENDING)],
        name="underground_marketplace_subcategory",
    ),
    IndexModel(
        [("marketplace", ASCENDING), ("availability", ASCENDING)],
        name="underground_marketplace_availability",
    ),
    IndexModel(
        [("marketplace", ASCENDING), ("price", ASCENDING)],
        name="underground_marketplace_price",
    ),
    IndexModel(
        [("marketplace", ASCENDING), ("created_at", DESCENDING)],
        name="underground_marketplace_newest",
    ),
    IndexModel(
        [("marketplace", ASCENDING), ("average_rating", DESCENDING)],
        name="underground_marketplace_rating",
    ),
    IndexModel(
        [("vendor_id", ASCENDING)],
        name="underground_vendor",
    ),
    IndexModel(
        [("seed_key", ASCENDING)],
        unique=True,
        sparse=True,
        name="underground_seed_key",
    ),
    IndexModel(
        [("name", TEXT), ("description", TEXT)],
        name="underground_product_text",
    ),
)


class UndergroundMongoConfigurationError(RuntimeError):
    """Raised when the Underground MongoDB connection is not configured."""


def _app_lock(key):
    return current_app.extensions.setdefault(key, Lock())


def get_underground_database():
    app = current_app._get_current_object()
    uri = app.config.get("MONGODB_URI") or os.environ.get("MONGODB_URI")
    if not uri:
        raise UndergroundMongoConfigurationError(
            "Underground MongoDB is not configured. Set MONGODB_URI."
        )

    with _app_lock("underground_mongo_lock"):
        client = app.extensions.get("underground_mongo_client")
        if client is None:
            client = MongoClient(uri, serverSelectionTimeoutMS=3000)
            app.extensions["underground_mongo_client"] = client

    database_name = (
        app.config.get("MONGODB_DATABASE")
        or os.environ.get("MONGODB_DATABASE")
        or DEFAULT_DATABASE_NAME
    )
    return client[database_name]


def get_underground_products():
    app = current_app._get_current_object()
    collection = get_underground_database()[PRODUCTS_COLLECTION]

    with _app_lock("underground_product_indexes_lock"):
        if not app.extensions.get("underground_product_indexes_ready"):
            collection.create_indexes(list(PRODUCT_INDEXES))
            app.extensions["underground_product_indexes_ready"] = True

    return collection
