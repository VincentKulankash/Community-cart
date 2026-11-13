# OWNER: MEMBER 6 (Testing & Docs)
# TASKS:
# 1. Write Pytest tests for the corresponding routes.
# 2. Cover both success paths and error paths.
# 3. Use the fixtures from conftest.py.


from extensions import db
from models import Listing


# ---------- PUBLIC GET ALL ----------

def test_get_listings_public_no_auth_required(client, listing):
    """GET /api/listings is public — no login needed."""
    response = client.get("/api/listings")

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["title"] == "Test Laptop"



def test_get_listings_filter_by_category(client, app, seller, listing):
    """?category= returns only matching listings."""
    other = Listing(
        title="Running Shoes",
        description="For jogging.",
        price=3000,
        category="Sports",
        user_id=seller.id,
    )
    db.session.add(other)
    db.session.commit()

    response = client.get("/api/listings?category=Electronics")

    assert response.status_code == 200
    titles = [item["title"] for item in response.get_json()]
    assert "Test Laptop" in titles
    assert "Running Shoes" not in titles


def test_get_listings_search_by_title(client, app, seller, listing):
    """?q= filters by title case-insensitively."""
    response = client.get("/api/listings?q=laptop")

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Test Laptop"

def test_get_listings_search_no_match(client):
    response = client.get("/api/listings?q=nonexistentthing")

    assert response.status_code == 200
    assert response.get_json() == []


def test_get_listings_min_max_price(client, app, seller):
    """?min=&max= filter by price range."""
    cheap = Listing(
        title="Cheap Item",
        description="Low price.",
        price=100,
        category="Misc",
        user_id=seller.id,
    )
    expensive = Listing(
        title="Expensive Item",
        description="High price.",
        price=99999,
        category="Misc",
        user_id=seller.id,
    )
    db.session.add_all([cheap, expensive])
    db.session.commit()

    response = client.get("/api/listings?min=50&max=200")

    assert response.status_code == 200
    titles = [item["title"] for item in response.get_json()]
    assert "Cheap Item" in titles
    assert "Expensive Item" not in titles
    assert "Test Laptop" not in titles  # price 50000 is out of range


# ---------- PUBLIC GET ONE ----------

def test_get_one_listing_public(client, listing):
    response = client.get(f"/api/listings/{listing.id}")

    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == listing.id
    assert data["title"] == "Test Laptop"


def test_get_missing_listing_returns_404(client):
    response = client.get("/api/listings/99999")

    assert response.status_code == 404
    assert response.get_json() == {"error": "Listing not found"}


# ---------- CREATE ----------

def test_create_listing_requires_login(client):
    response = client.post(
        "/api/listings",
        json={"title": "X", "price": 10, "category": "Test"},
    )

    assert response.status_code == 401


def test_create_listing_success(seller_client):
    response = seller_client.post(
        "/api/listings",
        json={
            "title": "New Gadget",
            "description": "Fresh from seller",
            "price": 250.50,
            "category": "Electronics",
            "condition": "New",
            "location": "Nairobi",
            "image_url": "https://example.com/g.jpg",
        },
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "New Gadget"
    assert data["price"] == 250.50
    assert data["status"] == "active"
    assert data["user_id"] is not None


def test_create_listing_missing_title(seller_client):
    response = seller_client.post(
        "/api/listings",
        json={"price": 100, "category": "Test"},
    )

    assert response.status_code == 422
    assert "error" in response.get_json()


def test_create_listing_missing_price(seller_client):
    response = seller_client.post(
        "/api/listings",
        json={"title": "X", "category": "Test"},
    )

    assert response.status_code == 422
    assert "error" in response.get_json()


def test_create_listing_non_numeric_price(seller_client):
    response = seller_client.post(
        "/api/listings",
        json={"title": "X", "price": "not-a-number", "category": "Test"},
    )

    assert response.status_code == 422
    assert response.get_json() == {"error": "price must be a number"}


# ---------- UPDATE ----------

def test_update_listing_owner_can(seller_client, listing):
    response = seller_client.patch(
        f"/api/listings/{listing.id}",
        json={"title": "Updated Title", "price": 75000},
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["title"] == "Updated Title"
    assert data["price"] == 75000.0
    assert data["category"] == "Electronics"  # unchanged


def test_update_listing_non_owner_gets_404(buyer_client, listing):
    """User B trying to edit user A's listing gets 404, not 403."""
    response = buyer_client.patch(
        f"/api/listings/{listing.id}",
        json={"title": "Hacked"},
    )

    assert response.status_code == 404
    assert response.get_json() == {"error": "Listing not found"}


def test_update_listing_requires_login(client, listing):
    response = client.patch(
        f"/api/listings/{listing.id}",
        json={"title": "Anonymous"},
    )

    assert response.status_code == 401


def test_update_listing_non_numeric_price(seller_client, listing):
    response = seller_client.patch(
        f"/api/listings/{listing.id}",
        json={"price": "abc"},
    )

    assert response.status_code == 422
    assert response.get_json() == {"error": "price must be a number"}


# ---------- DELETE ----------

def test_delete_listing_owner_can(seller_client, listing, app):
    listing_id = listing.id
    response = seller_client.delete(f"/api/listings/{listing_id}")

    assert response.status_code == 200
    assert response.get_json() == {"message": "Listing deleted"}

    # Confirm it's gone
    with app.app_context():
        assert db.session.get(Listing, listing_id) is None


def test_delete_listing_non_owner_gets_404(buyer_client, listing, app):
    listing_id = listing.id
    response = buyer_client.delete(f"/api/listings/{listing_id}")

    assert response.status_code == 404
    with app.app_context():
        assert db.session.get(Listing, listing_id) is not None


def test_delete_listing_requires_login(client, listing):
    response = client.delete(f"/api/listings/{listing.id}")

    assert response.status_code == 401


# ---------- MARK SOLD ----------

def test_mark_sold_owner_can(seller_client, listing):
    response = seller_client.patch(f"/api/listings/{listing.id}/sold")

    assert response.status_code == 200
    assert response.get_json()["status"] == "sold"


def test_mark_sold_non_owner_gets_404(buyer_client, listing):
    response = buyer_client.patch(f"/api/listings/{listing.id}/sold")

    assert response.status_code == 404


def test_mark_sold_requires_login(client, listing):
    response = client.patch(f"/api/listings/{listing.id}/sold")

    assert response.status_code == 401