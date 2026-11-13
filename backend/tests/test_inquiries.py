
def test_send_inquiry_requires_login(client, listing):
    response = client.post(
        f"/api/listings/{listing.id}/inquiries",
        json={"message": "Is this item available?"},
    )

    assert response.status_code == 401


def test_send_inquiry_success(buyer_client, listing):
    response = buyer_client.post(
        f"/api/listings/{listing.id}/inquiries",
        json={"message": "Is this laptop still available?"},
    )

    assert response.status_code == 201

    data = response.get_json()
    assert data["message"] == "Inquiry sent successfully."


def test_send_inquiry_missing_message(buyer_client, listing):
    response = buyer_client.post(
        f"/api/listings/{listing.id}/inquiries",
        json={},
    )

    assert response.status_code == 400


def test_send_inquiry_empty_message(buyer_client, listing):
    response = buyer_client.post(
        f"/api/listings/{listing.id}/inquiries",
        json={"message": "   "},
    )

    assert response.status_code == 400


def test_send_inquiry_for_nonexistent_listing(buyer_client):
    response = buyer_client.post(
        "/api/listings/9999/inquiries",
        json={"message": "Is this item available?"},
    )

    assert response.status_code == 404


def test_seller_cannot_inquire_on_own_listing(seller_client, listing):
    response = seller_client.post(
        f"/api/listings/{listing.id}/inquiries",
        json={"message": "I want to inquire about my listing."},
    )

    assert response.status_code == 403


def test_buyer_can_view_sent_inquiries(buyer_client, listing):
    buyer_client.post(
        f"/api/listings/{listing.id}/inquiries",
        json={"message": "Please contact me."},
    )

    response = buyer_client.get("/api/inquiries/sent")

    assert response.status_code == 200
    assert response.get_json()["count"] == 1


def test_seller_can_view_listing_inquiries(
    app, buyer_client, seller, listing
):
    # Buyer sends an inquiry using their own session.
    inquiry_response = buyer_client.post(
        f"/api/listings/{listing.id}/inquiries",
        json={"message": "Is delivery available?"},
    )

    assert inquiry_response.status_code == 201

    # Create a separate client for the seller.
    seller_view_client = app.test_client()

    login_response = seller_view_client.post(
        "/api/auth/login",
        json={
            "email": seller.email,
            "password": "SellerPass123",
        },
    )

    assert login_response.status_code == 200

    response = seller_view_client.get(
        f"/api/listings/{listing.id}/inquiries"
    )

    assert response.status_code == 200
    assert response.get_json()["count"] == 1


def test_buyer_cannot_view_seller_inquiries(buyer_client, listing):
    response = buyer_client.get(
        f"/api/listings/{listing.id}/inquiries"
    )

    assert response.status_code == 403
