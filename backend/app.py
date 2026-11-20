# OWNER: VINCENT (Scrum Master / Integration)
# TASKS:
# 1. Set up the Flask app factory create_app().
# 2. Initialize extensions (db, bcrypt, login_manager, migrate, cors).
# 3. Register all blueprints (auth, listings, offers, favorites, inquiries).
# 4. Set up global 404 and 500 error handlers to return JSON.
# RULES:
# - Do not add route logic here. Only app configuration.
# - Ensure CORS allows React on localhost:3000 with credentials.

import os
from flask_migrate import upgrade
from flasgger import Swagger
from flask import jsonify, Flask
from config import Config
from extensions import cors, bcrypt, db, login_manager, migrate
from models import User

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    Swagger(app, template={
        "info": {
            "title": "Community Cart API",
            "description": "A community marketplace where people buy, sell, and make private offers on second-hand items nearby.",
            "version": "1.0.0",
        },
        "basePath": "/",
        "schemes": ["https"] if os.environ.get("FLASK_ENV") == "production" else ["http"],
        "securityDefinitions": {
            "cookieAuth": {
                "type": "apiKey",
                "in": "cookie",
                "name": "session",
            }
        },
    })

    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)

    cors.init_app(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"error":"Unauthorized. Please log in."}), 401

    from routes.auth import auth_bp
    from routes.favorites import favorites_bp
    from routes.inquiries import inquiries_bp
    from routes.listings import listings_bp
    from routes.offers import offers_bp
    from routes.cart import cart_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(favorites_bp)
    app.register_blueprint(inquiries_bp)
    app.register_blueprint(listings_bp)
    app.register_blueprint(offers_bp)
    app.register_blueprint(cart_bp)

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error":"Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({"error":"Internal Server error"}), 500

    return app


