
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Require SECRET_KEY — no fallback in production
    SECRET_KEY = os.environ.get("SECRET_KEY")
    if not SECRET_KEY:
        raise RuntimeError(
            "SECRET_KEY environment variable is not set. "
            "Generate one with: python -c 'import secrets; print(secrets.token_hex(32))'"
        )

    # PostgreSQL — main marketplace database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///app.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # MongoDB Atlas — Underground catalogue
    MONGODB_URI = os.environ.get("MONGODB_URI")
    MONGODB_DATABASE = os.environ.get(
        "MONGODB_DATABASE", "community_cart_underground"
    )

    # Underground demo mode
    UNDERGROUND_DEMO_MODE = (
        os.environ.get("UNDERGROUND_DEMO_MODE", "false").lower() == "true"
    )

    # Session cookie configuration
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = os.environ.get(
        "SESSION_COOKIE_SAMESITE", "Lax"
    )

    SESSION_COOKIE_SECURE = os.environ.get(
        "SESSION_COOKIE_SECURE", "False"
    ).lower() == "true"

    PERMANENT_SESSION_LIFETIME = timedelta(days=7)


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
