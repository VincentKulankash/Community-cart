# OWNER: MEMBER 6 (Testing & Docs)
# TASKS:
# 1. Write Pytest tests for the corresponding routes.
# 2. Cover both success paths and error paths.
# 3. Use the fixtures from conftest.py.


from datetime import datetime, timedelta

import pytest

from extensions import db
from models import Listing, Offer


# LOCAL FIXTURE (only one that isn't in conftest)

@pytest.fixture
def expired_listing(app, seller):
    """A listing whose offer deadline has already passed."""
    item = Listing(
        title="Expired Item",
        description="Deadline gone.",
        price=20,
        category="Home",
        condition="Fair",
        location="Nairobi",
        status="open_for_offers",
        offer_ends_at=datetime.utcnow() - timedelta(days=1),
        user_id=seller.id,
    )
    db.session.add(item)
    db.session.commit()
    return item


# SUBMIT OFFER 

def test_offer_requires_login(client, listing):
    response = client.post(f"/api/listings/{listing.id}/offers", json={"amount": 50})
    assert response.status_code == 401


def test_create_offer_success(buyer_client, listing):
    response = buyer_client.post(
        f"/api/listings/{listing.id}/offers",
        json={"amount": 50, "message": "Nice laptop"},
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["amount"] == 50.0
    assert data["message"] == "Nice laptop"
    assert data["is_active"] is True


def test_owner_cannot_offer_on_own_listing(seller_client, listing):
    response = seller_client.post(
        f"/api/listings/{listing.id}/offers",
        json={"amount": 50},
    )

    assert response.status_code == 400
    assert "own listing" in response.get_json()["error"].lower()


def test_offer_on_missing_listing(buyer_client):
    response = buyer_client.post("/api/listings/99999/offers", json={"amount": 50})
    assert response.status_code == 404


def test_offer_missing_amount(buyer_client, listing):
    response = buyer_client.post(f"/api/listings/{listing.id}/offers", json={})
    assert response.status_code == 422


def test_offer_non_numeric_amount(buyer_client, listing):
    response = buyer_client.post(
        f"/api/listings/{listing.id}/offers",
        json={"amount": "fifty"},
    )
    assert response.status_code == 422


def test_offer_zero_or_negative_amount(buyer_client, listing):
    r1 = buyer_client.post(f"/api/listings/{listing.id}/offers", json={"amount": 0})
    r2 = buyer_client.post(f"/api/listings/{listing.id}/offers", json={"amount": -10})
    assert r1.status_code == 422
    assert r2.status_code == 422


def test_offer_after_deadline(buyer_client, expired_listing):
    response = buyer_client.post(
        f"/api/listings/{expired_listing.id}/offers",
        json={"amount": 50},
    )
    assert response.status_code == 400
    assert "deadline" in response.get_json()["error"].lower()


def test_new_offer_replaces_previous_one(buyer_client, listing):
    buyer_client.post(f"/api/listings/{listing.id}/offers", json={"amount": 50})
    buyer_client.post(f"/api/listings/{listing.id}/offers", json={"amount": 80})

    response = buyer_client.get(f"/api/listings/{listing.id}/offers/mine")
    assert response.get_json()["offer"]["amount"] == 80.0


# OUTBID LOGIC 

def test_second_higher_offer_marks_first_outbid(
    app, buyer_client, listing, monkeypatch
):
    # Prevent real email sending during tests
    import services.offer_service as offer_service
    monkeypatch.setattr(offer_service, "send_outbid_email", lambda *a, **kw: None)

    buyer_client.post(f"/api/listings/{listing.id}/offers", json={"amount": 50})

    # Second user outbids
    second = app.test_client()
    second.post("/api/auth/signup", json={
        "name": "Second Buyer",
        "email": "second@example.com",
        "password": "Password123",
    })
    second.post("/api/auth/login", json={
        "email": "second@example.com",
        "password": "Password123",
    })
    second.post(f"/api/listings/{listing.id}/offers", json={"amount": 60})

    with app.app_context():
        losing = Offer.query.filter_by(amount=50).first()
        assert losing is not None, "Offer of 50 not found in DB"
        assert losing.is_active is False, "Losing offer should be deactivated"
        assert losing.outbid_notified is True, "Losing offer should be marked as notified"


def test_lower_offer_does_not_outbid_previous(
    app, buyer_client, listing, monkeypatch
):
    import services.offer_service as offer_service
    monkeypatch.setattr(offer_service, "send_outbid_email", lambda *a, **kw: None)

    buyer_client.post(f"/api/listings/{listing.id}/offers", json={"amount": 100})

    second = app.test_client()
    second.post("/api/auth/signup", json={
        "name": "Second Buyer",
        "email": "second@example.com",
        "password": "Password123",
    })
    second.post("/api/auth/login", json={
        "email": "second@example.com",
        "password": "Password123",
    })
    second.post(f"/api/listings/{listing.id}/offers", json={"amount": 50})

    top_offer = Offer.query.filter_by(amount=100).first()
    assert top_offer.outbid_notified is False


# OWNER VIEWS ALL OFFERS 

def test_non_owner_cannot_see_offers(buyer_client, listing):
    response = buyer_client.get(f"/api/listings/{listing.id}/offers")
    assert response.status_code == 404


# MY OFFER

def test_my_offer_when_none(buyer_client, listing):
    response = buyer_client.get(f"/api/listings/{listing.id}/offers/mine")
    assert response.status_code == 200
    assert response.get_json()["offer"] is None


def test_my_offer_reflects_submitted_amount(buyer_client, listing):
    buyer_client.post(f"/api/listings/{listing.id}/offers", json={"amount": 75})

    response = buyer_client.get(f"/api/listings/{listing.id}/offers/mine")

    assert response.status_code == 200
    data = response.get_json()
    assert data["offer"]["amount"] == 75.0
    assert data["is_outbid"] is False


# CLOSE AUCTION

def test_close_already_closed_returns_400(seller_client, listing):
    seller_client.post(f"/api/listings/{listing.id}/offers/close")
    response = seller_client.post(f"/api/listings/{listing.id}/offers/close")
    assert response.status_code == 400

       # ← add this

def test_non_owner_cannot_close_auction(buyer_client, listing):
    response = buyer_client.post(f"/api/listings/{listing.id}/offers/close")
    assert response.status_code == 404


def test_close_with_no_offers_sets_status_closed(seller_client, listing):
    response = seller_client.post(f"/api/listings/{listing.id}/offers/close")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "closed"
    assert data["winner_offer_id"] is None


#AUTO-CLOSE ON READ 

def test_listing_auto_closes_on_read_after_deadline(seller_client, expired_listing):
    seller_client.get(f"/api/listings/{expired_listing.id}/offers")
    response = seller_client.get(f"/api/listings/{expired_listing.id}/offers")
    assert response.get_json()["status"] in ("closed", "sold")

# ACCEPT A SPECIFIC OFFER

def _make_offers(listing, buyer, seller):
    """Two offers from two buyers; returns (low, high)."""
    from models import User

    other = User(name="Other Buyer", email="other-accept@example.com")
    other.set_password("OtherPass123")
    db.session.add(other)
    db.session.commit()

    low = Offer(listing_id=listing.id, buyer_id=buyer.id, amount=40, is_active=True)
    high = Offer(listing_id=listing.id, buyer_id=other.id, amount=90, is_active=True)
    db.session.add_all([low, high])
    db.session.commit()
    return low, high


def test_owner_can_accept_a_lower_offer(seller_client, buyer, seller, listing):
    low, high = _make_offers(listing, buyer, seller)

    response = seller_client.post(
        f"/api/listings/{listing.id}/offers/{low.id}/accept"
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["status"] == "sold"
    assert body["winner_id"] == buyer.id
    assert body["offer"]["is_winner"] is True

    db.session.expire_all()
    assert db.session.get(Offer, high.id).is_winner is False


def test_owner_can_change_accepted_offer(seller_client, buyer, seller, listing):
    low, high = _make_offers(listing, buyer, seller)

    seller_client.post(f"/api/listings/{listing.id}/offers/{low.id}/accept")
    response = seller_client.post(
        f"/api/listings/{listing.id}/offers/{high.id}/accept"
    )

    assert response.status_code == 200
    db.session.expire_all()
    assert db.session.get(Offer, high.id).is_winner is True
    assert db.session.get(Offer, low.id).is_winner is False


def test_non_owner_cannot_accept_offer(buyer_client, buyer, seller, listing):
    low, _ = _make_offers(listing, buyer, seller)

    response = buyer_client.post(
        f"/api/listings/{listing.id}/offers/{low.id}/accept"
    )
    assert response.status_code == 404


def test_accept_offer_from_another_listing_is_404(seller_client, buyer, seller, listing):
    low, _ = _make_offers(listing, buyer, seller)
    other_listing = Listing(
        title="Other", description="x", price=10, category="Home",
        status="active", user_id=seller.id,
    )
    db.session.add(other_listing)
    db.session.commit()

    response = seller_client.post(
        f"/api/listings/{other_listing.id}/offers/{low.id}/accept"
    )
    assert response.status_code == 404


def test_owner_offer_list_includes_buyer_name(seller_client, buyer, seller, listing):
    _make_offers(listing, buyer, seller)

    response = seller_client.get(f"/api/listings/{listing.id}/offers")

    assert response.status_code == 200
    names = {o["buyer_name"] for o in response.get_json()["offers"]}
    assert names == {"Test Buyer", "Other Buyer"}


# SELLER DECIDES AFTER THE DEADLINE

def test_expired_listing_with_offers_waits_for_seller(seller_client, buyer, seller, expired_listing):
    offer = Offer(listing_id=expired_listing.id, buyer_id=buyer.id, amount=30, is_active=True)
    db.session.add(offer)
    db.session.commit()

    response = seller_client.get(f"/api/listings/{expired_listing.id}/offers")

    assert response.get_json()["status"] == "awaiting_decision"
    assert response.get_json()["winner_id"] is None


def test_seller_can_accept_after_deadline(seller_client, buyer, seller, expired_listing):
    offer = Offer(listing_id=expired_listing.id, buyer_id=buyer.id, amount=30, is_active=True)
    db.session.add(offer)
    db.session.commit()
    seller_client.get(f"/api/listings/{expired_listing.id}/offers")

    response = seller_client.post(
        f"/api/listings/{expired_listing.id}/offers/{offer.id}/accept"
    )

    assert response.status_code == 200
    assert response.get_json()["status"] == "sold"


def test_buyer_cannot_offer_while_awaiting_decision(buyer_client, seller_client, buyer, expired_listing):
    db.session.add(Offer(listing_id=expired_listing.id, buyer_id=buyer.id, amount=30, is_active=True))
    db.session.commit()
    seller_client.get(f"/api/listings/{expired_listing.id}/offers")

    response = buyer_client.post(
        f"/api/listings/{expired_listing.id}/offers", json={"amount": 99}
    )
    assert response.status_code == 400


def test_extending_deadline_reopens_awaiting_listing(seller_client, buyer, expired_listing):
    db.session.add(Offer(listing_id=expired_listing.id, buyer_id=buyer.id, amount=30, is_active=True))
    db.session.commit()
    seller_client.get(f"/api/listings/{expired_listing.id}/offers")

    future = (datetime.utcnow() + timedelta(days=2)).isoformat()
    response = seller_client.patch(
        f"/api/listings/{expired_listing.id}", json={"offer_ends_at": future}
    )

    assert response.status_code == 200
    assert response.get_json()["status"] == "open_for_offers"


# MARK SOLD WITH A CHOSEN OFFER

def test_mark_sold_with_chosen_offer(seller_client, buyer, seller, listing):
    low, high = _make_offers(listing, buyer, seller)

    response = seller_client.patch(
        f"/api/listings/{listing.id}/sold", json={"offer_id": low.id}
    )

    assert response.status_code == 200
    assert response.get_json()["status"] == "sold"
    db.session.expire_all()
    assert db.session.get(Offer, low.id).is_winner is True


def test_mark_sold_without_offer_still_works(seller_client, listing):
    response = seller_client.patch(f"/api/listings/{listing.id}/sold")
    assert response.status_code == 200
    assert response.get_json()["status"] == "sold"


def test_mark_sold_with_foreign_offer_is_404(seller_client, buyer, seller, listing):
    low, _ = _make_offers(listing, buyer, seller)
    other = Listing(title="Other", description="x", price=10, category="Home",
                    status="active", user_id=seller.id)
    db.session.add(other)
    db.session.commit()

    response = seller_client.patch(
        f"/api/listings/{other.id}/sold", json={"offer_id": low.id}
    )
    assert response.status_code == 404


# MY OFFERS (BUYER VIEW)

def test_my_offers_lists_latest_offer_per_listing(buyer_client, buyer, seller, listing):
    low, high = _make_offers(listing, buyer, seller)

    response = buyer_client.get("/api/listings/my-offers")

    assert response.status_code == 200
    body = response.get_json()
    assert body["count"] == 1
    item = body["offers"][0]
    assert item["listing"]["title"] == listing.title
    assert item["listing"]["seller_name"] == "Test Seller"
    assert item["result"] == "outbid"          # Other Buyer offered 90 vs 40


def test_my_offers_reports_not_selected_when_seller_picks_another(buyer_client, buyer, seller, listing):
    from services.offer_service import accept_offer

    low, high = _make_offers(listing, buyer, seller)
    accept_offer(listing, high)

    response = buyer_client.get("/api/listings/my-offers")

    assert response.get_json()["offers"][0]["result"] == "not_selected"


def test_my_offers_requires_login(client):
    assert client.get("/api/listings/my-offers").status_code == 401


# STATUS STAYS HONEST WHEN THE DEADLINE PASSES

def test_listing_moves_to_awaiting_decision_when_viewed_after_deadline(
    client, buyer, listing
):
    from datetime import datetime, timedelta

    db.session.add(Offer(listing_id=listing.id, buyer_id=buyer.id, amount=50, is_active=True))
    listing.status = "open_for_offers"
    listing.offer_ends_at = datetime.utcnow() - timedelta(minutes=1)
    db.session.commit()

    response = client.get(f"/api/listings/{listing.id}")

    assert response.status_code == 200
    assert response.get_json()["status"] == "awaiting_decision"
    assert response.get_json().get("winner_id") is None


def test_expired_listing_without_offers_is_closed_when_viewed(client, listing):
    from datetime import datetime, timedelta

    listing.status = "active"
    listing.offer_ends_at = datetime.utcnow() - timedelta(minutes=1)
    db.session.commit()

    response = client.get(f"/api/listings/{listing.id}")

    assert response.get_json()["status"] == "closed"