from flask import Blueprint, jsonify, request
from flask_login import login_user, logout_user, login_required, current_user

from extensions import db, bcrypt
from models import User

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    """
    Register a new user
    ---
    tags:
      - Authentication
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [name, email, password]
          properties:
            name:
              type: string
              example: Alice
            email:
              type: string
              example: alice@example.com
            password:
              type: string
              example: password123
            location:
              type: string
              example: Nairobi
    responses:
      201:
        description: User created
      409:
        description: Email already registered
      422:
        description: Invalid input
    """
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    location = (data.get("location") or "").strip() or None

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 422
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 422
    if "@" not in email or "." not in email:
        return jsonify({"error": "Invalid email address"}), 422

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(name=name, email=email, location=location)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "location": user.location,
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Log in with email and password
    ---
    tags:
      - Authentication
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [email, password]
          properties:
            email:
              type: string
              example: alice@example.com
            password:
              type: string
              example: password123
    responses:
      200:
        description: Logged in; session cookie set
      401:
        description: Invalid credentials
      422:
        description: Missing fields
    """
    data = request.get_json(silent=True) or {}
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


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    """
    Get current logged-in user
    ---
    tags:
      - Authentication
    responses:
      200:
        description: Current user details
      401:
        description: Not authenticated
    """
    return jsonify({
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "location": current_user.location,
    }), 200


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    """
    Log out (clears session cookie)
    ---
    tags:
      - Authentication
    responses:
      200:
        description: Logged out
      401:
        description: Not authenticated
    """
    logout_user()
    return jsonify({"message": "Successfully logged out"}), 200