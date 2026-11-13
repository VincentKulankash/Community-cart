def test_signup_success(client):
    response = client.post(
        "/api/auth/signup",
        json={
            "name": "New User",
            "email": "newuser@example.com",
            "password": "Password123",
            "location": "Nairobi",
        },
    )

    assert response.status_code == 201
    data = response.get_json()

    assert data["name"] == "New User"
    assert data["email"] == "newuser@example.com"
    assert data["location"] == "Nairobi"
    assert "id" in data


def test_signup_missing_fields(client):
    response = client.post(
        "/api/auth/signup",
        json={
            "name": "New User",
            "email": "newuser@example.com",
        },
    )

    assert response.status_code == 422
    assert "error" in response.get_json()


def test_signup_duplicate_email(client, seller):
    response = client.post(
        "/api/auth/signup",
        json={
            "name": "Another Seller",
            "email": seller.email,
            "password": "Password123",
        },
    )

    assert response.status_code == 409


def test_signup_short_password(client):
    response = client.post(
        "/api/auth/signup",
        json={
            "name": "New User",
            "email": "newuser@example.com",
            "password": "short",
        },
    )

    assert response.status_code == 422


def test_login_success(client, seller):
    response = client.post(
        "/api/auth/login",
        json={
            "email": seller.email,
            "password": "SellerPass123",
        },
    )

    assert response.status_code == 200
    assert response.get_json()["email"] == seller.email


def test_login_invalid_password(client, seller):
    response = client.post(
        "/api/auth/login",
        json={
            "email": seller.email,
            "password": "WrongPassword123",
        },
    )

    assert response.status_code == 401


def test_login_missing_fields(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "seller@example.com"},
    )

    assert response.status_code == 422


def test_me_requires_login(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_me_returns_logged_in_user(seller_client, seller):
    response = seller_client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.get_json()["email"] == seller.email


def test_logout_success(seller_client):
    response = seller_client.post("/api/auth/logout")

    assert response.status_code == 200

    # The session should no longer be authenticated.
    me_response = seller_client.get("/api/auth/me")
    assert me_response.status_code == 401
