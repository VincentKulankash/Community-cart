# OWNER: MEMBER 5 (Favorites & Dashboard)
# TASKS:
# 1. GET    /api/favorites          (Auth: list current user's saved items)
# 2. POST   /api/favorites/<id>     (Auth: save a listing)
# 3. DELETE /api/favorites/<id>     (Auth: remove a listing from saved)
# RULES:
# - Prevent duplicate favorites (unique constraint in DB).

from flask import Blueprint

favorites_bp = Blueprint("favorites_bp", __name__, url_prefix="/api/favorites")

# Member 5 will fill in the favorites routes here