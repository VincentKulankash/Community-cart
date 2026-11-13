
import pytest

from app import create_app
from config import TestingConfig
from extensions import db
from models import User, Listing


@pytest.fixture
def app():
    """Create a fresh Flask application and database for each test."""
    app = create_app(TestingConfig)

    with app.app_context():
        db.create_all()

        yield app

        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Provide an unauthenticated test client."""
    return app.test_client()


@pytest.fixture
def seller(app):
    """Create a seller account for tests."""
    user = User(
        name="Test Seller",
        email="seller@example.com",
        location="Nairobi",
    )
    user.set_password("SellerPass123")

    db.session.add(user)
    db.session.commit()

    return user


@pytest.fixture
def buyer(app):
    """Create a buyer account for tests."""
    user = User(
        name="Test Buyer",
        email="buyer@example.com",
        location="Mombasa",
    )
    user.set_password("BuyerPass123")

    db.session.add(user)
    db.session.commit()

    return user


@pytest.fixture
def seller_client(app, seller):
    """Provide a test client logged in as the seller."""
    c = app.test_client()
    response = c.post(
        "/api/auth/login",
        json={
            "email": seller.email,
            "password": "SellerPass123",
        },
    )
    assert response.status_code == 200
    return c


@pytest.fixture
def buyer_client(app, buyer):
    """Provide a test client logged in as the buyer."""
    c = app.test_client()
    response = c.post(
        "/api/auth/login",
        json={
            "email": buyer.email,
            "password": "BuyerPass123",
        },
    )
    assert response.status_code == 200
    return c

@pytest.fixture
def listing(app, seller):
    """Create a listing owned by the test seller."""
    item = Listing(
        title="Test Laptop",
        description="A laptop for testing marketplace features.",
        price=50000,
        category="Electronics",
        condition="Used",
        location="Nairobi",
        user_id=seller.id,
    )

    db.session.add(item)
    db.session.commit()

    return item
