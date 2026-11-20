def test_mock_catalog_is_public_and_returns_active_products(client):
    response = client.get("/api/mock/listings")

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 8
    assert all(item["status"] == "active" for item in data)
    assert all(item["image_url"] and item["price"] > 0 for item in data)
    assert data[0]["id"] == "demo-1"


def test_mock_catalog_supports_category_and_search_filters(client):
    response = client.get("/api/mock/listings?category=home&q=chair")

    assert response.status_code == 200
    assert [item["title"] for item in response.get_json()] == [
        "Lounge chair, teak & cane"
    ]


def test_mock_catalog_rejects_non_numeric_price_filters(client):
    response = client.get("/api/mock/listings?min=cheap")

    assert response.status_code == 422
    assert response.get_json() == {"error": "min and max must be numbers"}
