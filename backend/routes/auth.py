# OWNER: VINCENT (Scrum Master / Integration)
# TASKS:
# 1. POST /api/auth/signup (Create user, return 201)
# 2. POST /api/auth/login  (login_user(), return 200)
# 3. GET  /api/auth/me     (@login_required, return current_user)
# 4. POST /api/auth/logout (logout_user(), clear session)
# RULES:
# - Return JSON errors: {"error": "message"}.
# - Return 401 for bad credentials, 409/422 for duplicates.

from flask import Blueprint, jsonify, request
from flask_login import login_user, logout_user, login_required, current_user
from sqlalchemy.exc import IntegrityError

from extensions import db, bcrypt
from models import User

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")

# Vincent will fill this in later

#Signup

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    location = (data.get("location") or "").strip() or None

    if not name or not email or not password:
        return jsonify({"error":"name, email and password are required"}), 422

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 422
    if "@" not in email or "." not in email:
        return jsonify({"error": "Invalid email address"}), 422

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(name=name, email=email, location=location)
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email already registered"}), 409
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "location": user.location,
    }), 201


#login

@auth_bp.route("/login", methods=["POST"])
def login():
    data=request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 422

    user = User.query.filter_by(email=email).first()
    if user is None or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    login_user(user)
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "location": user.location,
    }), 200

#check session
@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return jsonify({
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "location": current_user.location,
    }), 200

@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Successfully logged out"}), 200