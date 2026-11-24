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


# REPLIES AND THE RECEIVED BOX
#
# The test app keeps one app context open, so Flask-Login caches the current
# user across test clients. Each test therefore drives ONE logged-in client
# and sets up the other party's data directly in the database.

from datetime import datetime

from extensions import db
from models import Inquiry


def _make_inquiry(listing, buyer, message="Still available?", reply=None):
    inquiry = Inquiry(listing_id=listing.id, buyer_id=buyer.id, message=message)
    if reply:
        inquiry.reply = reply
        inquiry.replied_at = datetime.utcnow()
    db.session.add(inquiry)
    db.session.commit()
    return inquiry


def test_seller_can_reply_to_inquiry(seller_client, buyer, listing):
    inquiry = _make_inquiry(listing, buyer)

    response = seller_client.post(
        f"/api/inquiries/{inquiry.id}/reply", json={"message": "Yes it is!"}
    )

    assert response.status_code == 200
    assert response.get_json()["inquiry"]["reply"] == "Yes it is!"
    db.session.expire_all()
    saved = db.session.get(Inquiry, inquiry.id)
    assert saved.reply == "Yes it is!"
    assert saved.replied_at is not None


def test_buyer_sees_reply_and_listing_details(buyer_client, buyer, listing):
    _make_inquiry(listing, buyer, reply="Yes it is!")

    mine = buyer_client.get("/api/inquiries/sent").get_json()["inquiries"][0]

    assert mine["reply"] == "Yes it is!"
    assert mine["replied_at"] is not None
    assert mine["listing"]["title"] == listing.title
    assert mine["listing"]["seller_name"] == "Test Seller"


def test_only_the_seller_can_reply(buyer_client, buyer, listing):
    inquiry = _make_inquiry(listing, buyer)

    response = buyer_client.post(
        f"/api/inquiries/{inquiry.id}/reply", json={"message": "I reply to myself"}
    )
    assert response.status_code == 404


def test_reply_requires_message(seller_client, buyer, listing):
    inquiry = _make_inquiry(listing, buyer)

    response = seller_client.post(
        f"/api/inquiries/{inquiry.id}/reply", json={"message": "   "}
    )
    assert response.status_code == 400


def test_received_inquiries_for_seller(seller_client, buyer, listing):
    _make_inquiry(listing, buyer)

    body = seller_client.get("/api/inquiries/received").get_json()

    assert body["count"] == 1
    assert body["unanswered"] == 1
    assert body["inquiries"][0]["buyer_name"] == "Test Buyer"


def test_received_inquiries_empty_for_buyer(buyer_client, buyer, listing):
    _make_inquiry(listing, buyer)
    assert buyer_client.get("/api/inquiries/received").get_json()["count"] == 0