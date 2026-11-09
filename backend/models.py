# OWNER: MEMBER 2 (Models & Database)
# TASKS:
# 1. Finalize the User model (name, email, password_hash, location).
# 2. Create Listing model (title, description, price, category, status, offer_ends_at, etc.).
# 3. Create Favorite model (unique user_id + listing_id).
# 4. Create Inquiry model.
# 5. Create Offer model (amount, is_active, outbid_notified, etc.).
# 6. Set up relationships (User -> Listings, Listing -> Offers, etc.).
# RULES:
# - Do not change the User model columns without telling Vincent.
# - Ensure cascade="all, delete-orphan" is set where appropriate.

from datetime import datetime
from flask_login import UserMixin
from extensions import db, bcrypt

class User(db.Model, UserMixin):
    __table_name__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    password_hash = db.COlumn(db.String(255), nullable=False)
    location = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

#TO DO (Member 2): Add Listing, Favorite, Inquiry, Offer models