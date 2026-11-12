# OWNER: VINCENT (Scrum Master / Integration)
# TASKS:
# 1. POST /api/auth/signup (Create user, return 201)
# 2. POST /api/auth/login  (login_user(), return 200)
# 3. GET  /api/auth/me     (@login_required, return current_user)
# 4. POST /api/auth/logout (logout_user(), clear session)
# RULES:
# - Return JSON errors: {"error": "message"}.
# - Return 401 for bad credentials, 409/422 for duplicates.

from flask import Blueprint, jsonify

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")

# Vincent will fill this in later