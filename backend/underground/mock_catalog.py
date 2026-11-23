"""In-process sample catalog used when demo mode is enabled."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from bson import ObjectId
from bson.decimal128 import Decimal128

from underground.database import MARKETPLACE_ID


def _products():
    # Keep the API demo catalog aligned with the optional MongoDB seed data.
    from underground.seed import DEMO_PRODUCTS

    now = datetime.now(timezone.utc)
    products = []
    for index, source in enumerate(DEMO_PRODUCTS, start=1):
        product = {key: value for key, value in source.items() if key != "seed_key"}
        product.update(
            _id=ObjectId(f"{index:024x}"),
            price=Decimal128(Decimal(product["price"])),
            vendor_id=1,
            average_rating=0.0,
            created_at=now - timedelta(days=index - 1),
            marketplace=MARKETPLACE_ID,
        )
        products.append(product)
    return products


def search_demo_products(filters):
    products = _products()
    query = (filters.get("q") or "").strip().casefold()
    category = filters.get("category")
    subcategory = filters.get("subcategory")
    availability = filters.get("availability")
    min_price = filters.get("min_price")
    max_price = filters.get("max_price")

    def price_of(product):
        return product["price"].to_decimal()

    if query:
        products = [
            product
            for product in products
            if query in f"{product['name']} {product['description']}".casefold()
        ]
    if category:
        products = [product for product in products if product["category"] == category]
    if subcategory:
        products = [product for product in products if product["subcategory"] == subcategory]
    if availability is not None:
        products = [product for product in products if product["availability"] is availability]
    if min_price is not None:
        products = [product for product in products if price_of(product) >= min_price]
    if max_price is not None:
        products = [product for product in products if price_of(product) <= max_price]

    sort = filters["sort"]
    if sort == "price_asc":
        products.sort(key=lambda product: (price_of(product), str(product["_id"])))
    elif sort == "price_desc":
        products.sort(key=lambda product: (-price_of(product), str(product["_id"])))
    elif sort == "rating":
        products.sort(key=lambda product: (-product["average_rating"], str(product["_id"])))
    else:
        products.sort(key=lambda product: product["created_at"], reverse=True)

    total = len(products)
    page = filters["page"]
    per_page = filters["per_page"]
    start = (page - 1) * per_page
    return {
        "items": products[start : start + per_page],
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page,
    }


def get_demo_product(product_id):
    return next((item for item in _products() if item["_id"] == product_id), None)


def get_demo_categories():
    return sorted({product["category"] for product in _products()})
