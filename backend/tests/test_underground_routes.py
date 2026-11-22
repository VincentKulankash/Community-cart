from datetime import datetime, timezone
from decimal import Decimal

from bson import ObjectId
from bson.decimal128 import Decimal128

from underground import routes
from underground.database import MARKETPLACE_ID


class FakeCursor(list):
    def sort(self, keys):
        items = list(self)
        for key, direction in reversed(keys):
            items.sort(
                key=lambda item: (
                    item[key].to_decimal()
                    if isinstance(item[key], Decimal128)
                    else item[key]
                ),
                reverse=direction < 0,
            )
        return FakeCursor(items)

    def skip(self, count):
        return FakeCursor(self[count:])

    def limit(self, count):
        return FakeCursor(self[:count])


class FakeCollection:
    def __init__(self, products=()):
        self.products = list(products)
        self.last_find_filter = None

    def find(self, query):
        self.last_find_filter = query
        return FakeCursor(
            item for item in self.products if self._matches(item, query)
        )

    def count_documents(self, query):
        return sum(self._matches(item, query) for item in self.products)

    def find_one(self, query):
        return next(
            (
                item for item in self.products
                if item.get("_id") == query["_id"]
                and item.get("marketplace") == query["marketplace"]
            ),
            None,
        )

    def distinct(self, field, query):
        return list(
            {
                item[field]
                for item in self.products
                if item.get("marketplace") == query["marketplace"]
                and field in item
            }
        )

    @staticmethod
    def _matches(item, query):
        for field, value in query.items():
            if field == "$text":
                terms = value["$search"].lower().split()
                searchable = f'{item["name"]} {item["description"]}'.lower()
                if not any(term in searchable for term in terms):
                    return False
            elif field == "price":
                price = item["price"]
                if isinstance(price, Decimal128):
                    price = price.to_decimal()
                for operator, bound in value.items():
                    if isinstance(bound, Decimal128):
                        bound = bound.to_decimal()
                    if operator == "$gte" and price < bound:
                        return False
                    if operator == "$lte" and price > bound:
                        return False
            elif item.get(field) != value:
                return False
        return True


def sample_product(marketplace=MARKETPLACE_ID):
    return {
        "_id": ObjectId(),
        "name": "Neon Circuit Jacket",
        "description": "A fictional demo jacket.",
        "price": Decimal128(Decimal("74.50")),
        "category": "Alternative Fashion",
        "subcategory": "Outerwear",
        "image": "https://example.test/neon-jacket.jpg",
        "vendor_id": 7,
        "availability": True,
        "average_rating": 0.0,
        "created_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
        "marketplace": marketplace,
    }


def verify_age(client):
    with client.session_transaction() as session:
        session["underground_age_verified"] = True


def test_underground_routes_block_direct_api_access(client, monkeypatch):
    def unexpected_database_access():
        raise AssertionError("Age gate must run before database access.")

    monkeypatch.setattr(routes, "get_underground_products", unexpected_database_access)

    for path in (
        "/api/underground/products",
        "/api/underground/products/not-an-id",
        "/api/underground/categories",
    ):
        response = client.get(path)
        assert response.status_code == 403
        assert response.get_json()["code"] == "underground_age_required"


def test_product_list_is_marketplace_scoped_and_serializes_data(client, monkeypatch):
    underground_product = sample_product()
    community_product = sample_product(marketplace="community")
    collection = FakeCollection([underground_product, community_product])
    monkeypatch.setattr(routes, "get_underground_products", lambda: collection)
    verify_age(client)

    response = client.get("/api/underground/products")

    assert response.status_code == 200
    assert collection.last_find_filter == {"marketplace": MARKETPLACE_ID}
    items = response.get_json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == str(underground_product["_id"])
    assert items[0]["price"] == 74.5
    assert items[0]["marketplace"] == MARKETPLACE_ID


def test_product_detail_validates_ids_and_returns_not_found(client, monkeypatch):
    collection = FakeCollection()
    monkeypatch.setattr(routes, "get_underground_products", lambda: collection)
    verify_age(client)

    invalid = client.get("/api/underground/products/not-an-id")
    missing = client.get(f"/api/underground/products/{ObjectId()}")

    assert invalid.status_code == 400
    assert missing.status_code == 404


def test_categories_are_deduplicated_and_sorted(client, monkeypatch):
    collection = FakeCollection(
        [
            {**sample_product(), "category": "Gaming"},
            {**sample_product(), "category": "Alternative Fashion"},
            sample_product(marketplace="community"),
        ]
    )
    monkeypatch.setattr(routes, "get_underground_products", lambda: collection)
    verify_age(client)

    response = client.get("/api/underground/categories")

    assert response.status_code == 200
    assert response.get_json()["items"] == ["Alternative Fashion", "Gaming"]


def test_combined_search_and_filters_are_marketplace_scoped(client, monkeypatch):
    arcade_product = {
        **sample_product(),
        "_id": ObjectId(),
        "name": "Arc Byte Controller",
        "price": Decimal128(Decimal("59.95")),
        "category": "Gaming",
        "subcategory": "Accessories",
    }
    collection = FakeCollection(
        [
            sample_product(),
            arcade_product,
            {**arcade_product, "_id": ObjectId(), "marketplace": "community"},
        ]
    )
    monkeypatch.setattr(routes, "get_underground_products", lambda: collection)
    verify_age(client)

    response = client.get(
        "/api/underground/products"
        "?q=Arc+Byte&category=Gaming&max_price=60"
        "&availability=true&sort=price_asc&page=1&per_page=1"
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["total"] == 1
    assert payload["pages"] == 1
    assert payload["items"][0]["id"] == str(arcade_product["_id"])
    assert collection.last_find_filter["marketplace"] == MARKETPLACE_ID
    assert collection.last_find_filter["category"] == "Gaming"
    assert collection.last_find_filter["availability"] is True
    assert collection.last_find_filter["$text"] == {"$search": "Arc Byte"}


def test_price_sort_and_pagination_are_stable(client, monkeypatch):
    products = [
        {
            **sample_product(),
            "_id": ObjectId(),
            "price": Decimal128(Decimal(price)),
        }
        for price in ("74.50", "20.00", "59.95")
    ]
    collection = FakeCollection(products)
    monkeypatch.setattr(routes, "get_underground_products", lambda: collection)
    verify_age(client)

    response = client.get(
        "/api/underground/products?sort=price_asc&page=2&per_page=1"
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["total"] == 3
    assert payload["page"] == 2
    assert payload["per_page"] == 1
    assert payload["pages"] == 3
    assert payload["items"][0]["price"] == 59.95


def test_invalid_filters_and_price_ranges_return_validation_errors(client, monkeypatch):
    def unexpected_database_access():
        raise AssertionError("Invalid filters must be rejected before DB access.")

    monkeypatch.setattr(routes, "get_underground_products", unexpected_database_access)
    verify_age(client)

    invalid_sort = client.get("/api/underground/products?sort=arbitrary")
    invalid_page_size = client.get("/api/underground/products?per_page=1000")
    invalid_price_range = client.get(
        "/api/underground/products?min_price=100&max_price=20"
    )

    assert invalid_sort.status_code == 422
    assert invalid_page_size.status_code == 422
    assert invalid_price_range.status_code == 422


def test_missing_mongodb_configuration_returns_service_unavailable(client, monkeypatch):
    monkeypatch.delenv("MONGODB_URI", raising=False)
    verify_age(client)

    response = client.get("/api/underground/products")

    assert response.status_code == 503
    assert response.get_json()["error"] == (
        "Underground catalog is temporarily unavailable."
    )
