from flask import Flask
from marshmallow import ValidationError

from underground import database
from underground.schemas import underground_product_schema


class FakeCollection:
    def __init__(self):
        self.created_indexes = []

    def create_indexes(self, indexes):
        self.created_indexes.extend(indexes)


class FakeDatabase:
    def __init__(self):
        self.collections = {}

    def __getitem__(self, name):
        return self.collections.setdefault(name, FakeCollection())


class FakeMongoClient:
    def __init__(self, uri, **options):
        self.uri = uri
        self.options = options
        self.databases = {}

    def __getitem__(self, name):
        return self.databases.setdefault(name, FakeDatabase())


def make_app(**config):
    app = Flask(__name__)
    app.config.update(config)
    return app


def test_missing_mongodb_uri_fails_without_fallback(monkeypatch):
    app = make_app()
    monkeypatch.delenv("MONGODB_URI", raising=False)

    with app.app_context():
        try:
            database.get_underground_database()
        except database.UndergroundMongoConfigurationError as error:
            assert "MONGODB_URI" in str(error)
        else:
            raise AssertionError("Missing MongoDB configuration must be explicit.")


def test_mongo_client_and_product_indexes_are_reused(monkeypatch):
    clients = []

    def create_client(uri, **options):
        client = FakeMongoClient(uri, **options)
        clients.append(client)
        return client

    monkeypatch.setattr(database, "MongoClient", create_client)
    app = make_app(
        MONGODB_URI="mongodb://underground-test",
        MONGODB_DATABASE="underground_test",
    )

    with app.app_context():
        collection = database.get_underground_products()
        assert database.get_underground_products() is collection

    assert len(clients) == 1
    assert clients[0].uri == "mongodb://underground-test"
    assert clients[0].options == {"serverSelectionTimeoutMS": 3000}
    indexes = clients[0]["underground_test"][database.PRODUCTS_COLLECTION].created_indexes
    assert len(indexes) == len(database.PRODUCT_INDEXES)
    assert any(index.document.get("unique") for index in indexes)


def test_product_schema_supplies_underground_fields_and_defaults():
    product = underground_product_schema.load(
        {
            "name": "Neon Circuit Jacket",
            "description": "A fictional demo jacket for the Underground catalogue.",
            "price": "74.50",
            "category": "Alternative Fashion",
            "subcategory": "Outerwear",
            "image": "https://example.test/neon-jacket.jpg",
            "vendor_id": 7,
        }
    )

    assert product["price"] == 74.50
    assert product["availability"] is True
    assert "marketplace" not in product
    assert "average_rating" not in product


def test_product_schema_rejects_untrusted_marketplace_and_invalid_price():
    with_validation_error = {
        "name": "Demo product",
        "description": "Fictional demo product.",
        "price": "-0.01",
        "category": "Gaming",
        "subcategory": "Accessories",
        "image": "https://example.test/item.jpg",
        "vendor_id": 7,
        "marketplace": "community",
    }

    try:
        underground_product_schema.load(with_validation_error)
    except ValidationError as error:
        assert "marketplace" in error.messages
        assert "price" in error.messages
    else:
        raise AssertionError("Clients must not override marketplace ownership.")
