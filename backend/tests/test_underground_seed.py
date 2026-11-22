from copy import deepcopy
from datetime import datetime, timezone

import pytest

from underground.database import MARKETPLACE_ID
from underground.seed import DEMO_PRODUCTS, seed_underground_products


class FakeUpdateResult:
    def __init__(self, upserted_id=None, modified_count=0):
        self.upserted_id = upserted_id
        self.modified_count = modified_count


class FakeCollection:
    def __init__(self, documents=()):
        self.documents = {
            (document.get("marketplace"), document.get("seed_key")): deepcopy(document)
            for document in documents
        }
        self.next_id = 1

    def update_one(self, query, update, upsert):
        key = (query["marketplace"], query["seed_key"])
        existing = self.documents.get(key)
        if existing is None:
            if not upsert:
                return FakeUpdateResult()
            document = deepcopy(update["$setOnInsert"])
            document.update(deepcopy(update["$set"]))
            document["_id"] = self.next_id
            self.next_id += 1
            self.documents[key] = document
            return FakeUpdateResult(upserted_id=document["_id"])

        updated = deepcopy(existing)
        updated.update(deepcopy(update["$set"]))
        modified = int(updated != existing)
        self.documents[key] = updated
        return FakeUpdateResult(modified_count=modified)


def test_seed_is_idempotent_and_preserves_community_data():
    community_listing = {
        "_id": 900,
        "marketplace": "community",
        "title": "Community Cart listing",
    }
    collection = FakeCollection([community_listing])
    first_run_at = datetime(2026, 1, 1, tzinfo=timezone.utc)

    count = seed_underground_products(
        collection,
        [7, 9],
        now=first_run_at,
    )
    original_ids = {
        key: document["_id"]
        for key, document in collection.documents.items()
        if key[0] == MARKETPLACE_ID
    }

    assert count == len(DEMO_PRODUCTS)
    assert len(original_ids) == len(DEMO_PRODUCTS)
    assert all(
        document["vendor_id"] in {7, 9}
        for key, document in collection.documents.items()
        if key[0] == MARKETPLACE_ID
    )
    restricted_demo = collection.documents[
        (MARKETPLACE_ID, "restricted-fictional-display-item")
    ]
    assert restricted_demo["availability"] is False
    assert "Fictional school-demo placeholder" in restricted_demo["description"]

    seed_underground_products(
        collection,
        [7, 9],
        now=datetime(2026, 2, 1, tzinfo=timezone.utc),
    )

    assert len(collection.documents) == len(DEMO_PRODUCTS) + 1
    assert collection.documents[("community", None)] == community_listing
    for key, original_id in original_ids.items():
        assert collection.documents[key]["_id"] == original_id
        assert collection.documents[key]["created_at"] == first_run_at


@pytest.mark.parametrize("vendor_ids", [[], [0], [-4], ["7"], [True]])
def test_seed_requires_existing_positive_integer_users(vendor_ids):
    collection = FakeCollection()

    with pytest.raises(ValueError, match="existing positive integer user ID"):
        seed_underground_products(collection, vendor_ids)

    assert collection.documents == {}
