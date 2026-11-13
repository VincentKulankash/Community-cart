from datetime import datetime, timedelta
from decimal import Decimal

import pytest

from extensions import db
from models import Listing, Offer, User
from services.offer_service import close_listing_auction


# ---------- HELPER ----------

@pytest.fixture
def other_buyer(app):
    """A second buyer, distinct from the `buyer` fixture."""
    user = User(name="Other Buyer", email="other@example.com", location="Nairobi")
    user.set_password("OtherPass123")
    db.session.add(user)
    db.session.commit()
    return user


# ---------- WINNER SELECTION ----------

def test_highest_bidder_becomes_winner(app, seller, buyer, other_buyer, listing):
    """Two offers; the higher one should be selected as the winner."""
    listing_id = listing.id   # capture id outside context

    with app.app_context():
        # Re-fetch inside this session's context
        fresh_listing = db.session.get(Listing, listing_id)

        low = Offer(
            listing_id=listing_id, buyer_id=buyer.id,
            amount=Decimal("50.00"), is_active=True,
        )
        high = Offer(
            listing_id=listing_id, buyer_id=other_buyer.id,
            amount=Decimal("100.00"), is_active=True,
        )
        db.session.add_all([low, high])
        db.session.commit()

        winner, did_close = close_listing_auction(fresh_listing)
        db.session.refresh(fresh_listing)

        assert did_close is True
        assert winner is not None
        assert winner.amount == Decimal("100.00")
        assert winner.buyer_id == other_buyer.id
        assert fresh_listing.winner_id == other_buyer.id
        assert fresh_listing.status == "sold"


def test_equal_offers_pick_earliest(app, seller, buyer, other_buyer, listing):
    """Tie-break: when two offers match, the earlier created_at wins."""
    listing_id = listing.id

    with app.app_context():
        fresh_listing = db.session.get(Listing, listing_id)

        earlier = Offer(
            listing_id=listing_id, buyer_id=buyer.id,
            amount=Decimal("100.00"), is_active=True,
            created_at=datetime.utcnow() - timedelta(minutes=10),
        )
        later = Offer(
            listing_id=listing_id, buyer_id=other_buyer.id,
            amount=Decimal("100.00"), is_active=True,
            created_at=datetime.utcnow(),
        )
        db.session.add_all([earlier, later])
        db.session.commit()

        winner, _ = close_listing_auction(fresh_listing)
        db.session.refresh(fresh_listing)

        assert winner.id == earlier.id
        assert fresh_listing.winner_id == buyer.id



def test_close_without_offers_leaves_winner_null(app, seller, listing):
    """No offers → winner_id stays None, status becomes 'closed'."""
    listing_id = listing.id

    with app.app_context():
        fresh_listing = db.session.get(Listing, listing_id)

        winner, did_close = close_listing_auction(fresh_listing)
        db.session.refresh(fresh_listing)

        assert did_close is True
        assert winner is None
        assert fresh_listing.winner_id is None
        assert fresh_listing.status == "closed"


def test_winner_id_appears_in_close_response(app, seller, buyer, listing):
    """The HTTP close endpoint exposes winner_id and winner_offer_id."""
    with app.app_context():
        offer = Offer(
            listing_id=listing.id, buyer_id=buyer.id,
            amount=Decimal("75.00"), is_active=True,
        )
        db.session.add(offer)
        db.session.commit()
        offer_id = offer.id

    # Single logged-in client (avoids the two-client cookie issue)
    client = app.test_client()
    login_res = client.post("/api/auth/login", json={
        "email": seller.email, "password": "SellerPass123",
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.get_json()}"

    response = client.post(f"/api/listings/{listing.id}/offers/close")

    assert response.status_code == 200, f"Close failed: {response.get_json()}"
    data = response.get_json()
    assert data["status"] == "sold"
    assert data["winner_id"] == buyer.id
    assert data["winner_offer_id"] == offer_id