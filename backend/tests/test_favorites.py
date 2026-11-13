def test_get_favorites_requires_login(client):
    response = client.get("/api/favorites")

    assert response.status_code == 401


def test_add_favorite_requires_login(client, listing):
    response = client.post(f"/api/favorites/{listing.id}")

    assert response.status_code == 401


def test_add_favorite_success(buyer_client, listing):
    response = buyer_client.post(f"/api/favorites/{listing.id}")

    assert response.status_code == 201

    favorites_response = buyer_client.get("/api/favorites")

    assert favorites_response.status_code == 200
    data = favorites_response.get_json()

    assert data["count"] == 1
    assert data["favorites"][0]["listing"]["title"] == "Test Laptop"


def test_add_duplicate_favorite(buyer_client, listing):
    first_response = buyer_client.post(
        f"/api/favorites/{listing.id}"
    )
    second_response = buyer_client.post(
        f"/api/favorites/{listing.id}"
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409


def test_delete_favorite_success(buyer_client, listing):
    add_response = buyer_client.post(
        f"/api/favorites/{listing.id}"
    )

    assert add_response.status_code == 201

    delete_response = buyer_client.delete(
        f"/api/favorites/{listing.id}"
    )

    assert delete_response.status_code == 200

    favorites_response = buyer_client.get("/api/favorites")

    assert favorites_response.status_code == 200
    assert favorites_response.get_json()["count"] == 0


def test_delete_nonexistent_favorite(buyer_client, listing):
    response = buyer_client.delete(
        f"/api/favorites/{listing.id}"
    )

    assert response.status_code == 404
