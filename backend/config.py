# OWNER: VINCENT (Scrum Master / Integration)
# TASKS:
# 1. Load environment variables from .env.
# 2. Set up SQLALCHEMY_DATABASE_URI (SQLite by default).
# 3. Set up SECRET_KEY for session cookies.
# 4. Set up TestingConfig (in-memory SQLite).

import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"