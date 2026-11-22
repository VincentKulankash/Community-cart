from bson.decimal128 import Decimal128
from pymongo import ASCENDING, DESCENDING

from underground.database import MARKETPLACE_ID

SORT_FIELDS = {
    "newest": [("created_at", DESCENDING), ("_id", ASCENDING)],
    "price_asc": [("price", ASCENDING), ("_id", ASCENDING)],
    "price_desc": [("price", DESCENDING), ("_id", ASCENDING)],
    "rating": [("average_rating", DESCENDING), ("_id", ASCENDING)],
}


def search_products(collection, filters):
    query = {"marketplace": MARKETPLACE_ID}
    for field in ("category", "subcategory", "availability"):
        value = filters.get(field)
        if value is not None:
            query[field] = value

    search_term = (filters.get("q") or "").strip()
    if search_term:
        query["$text"] = {"$search": search_term}

    price_range = {}
    if filters.get("min_price") is not None:
        price_range["$gte"] = Decimal128(filters["min_price"])
    if filters.get("max_price") is not None:
        price_range["$lte"] = Decimal128(filters["max_price"])
    if price_range:
        query["price"] = price_range

    page = filters["page"]
    per_page = filters["per_page"]
    cursor = (
        collection.find(query)
        .sort(SORT_FIELDS[filters["sort"]])
        .skip((page - 1) * per_page)
        .limit(per_page)
    )
    total = collection.count_documents(query)

    return {
        "items": list(cursor),
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page,
    }


def get_product(collection, product_id):
    return collection.find_one(
        {
            "_id": product_id,
            "marketplace": MARKETPLACE_ID,
        }
    )


def get_categories(collection):
    return sorted(
        category
        for category in collection.distinct(
            "category",
            {"marketplace": MARKETPLACE_ID},
        )
        if isinstance(category, str) and category
    )
