
from datetime import datetime

from flask_login import UserMixin
from sqlalchemy import UniqueConstraint, CheckConstraint

from extensions import db, bcrypt


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(200), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    listings = db.relationship(
        "Listing",
        back_populates="seller",
        cascade="all, delete-orphan"
    )

    favorites = db.relationship(
        "Favorite",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    inquiries = db.relationship(
        "Inquiry",
        back_populates="buyer",
        cascade="all, delete-orphan"
    )

    offers = db.relationship(
        "Offer",
        back_populates="buyer",
        cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(
            self.password_hash,
            password
        )


class Listing(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(100), nullable=False)

    condition = db.Column(db.String(50))
    image_url = db.Column(db.String(500))
    location = db.Column(db.String(150))

    status = db.Column(
        db.String(20),
        nullable=False,
        default="active"
    )

    offer_ends_at = db.Column(db.DateTime)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint("price >= 0", name="check_listing_price"),
    )

    # Relationships
    seller = db.relationship(
        "User",
        back_populates="listings"
    )

    favorites = db.relationship(
        "Favorite",
        back_populates="listing",
        cascade="all, delete-orphan"
    )

    inquiries = db.relationship(
        "Inquiry",
        back_populates="listing",
        cascade="all, delete-orphan"
    )

    offers = db.relationship(
        "Offer",
        back_populates="listing",
        cascade="all, delete-orphan"
    )


class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    listing_id = db.Column(
        db.Integer,
        db.ForeignKey("listing.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Prevent a user from saving the same listing twice.
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "listing_id",
            name="unique_user_listing_favorite"
        ),
    )

    user = db.relationship(
        "User",
        back_populates="favorites"
    )

    listing = db.relationship(
        "Listing",
        back_populates="favorites"
    )


class Inquiry(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    listing_id = db.Column(
        db.Integer,
        db.ForeignKey("listing.id"),
        nullable=False
    )

    buyer_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    message = db.Column(db.Text, nullable=False)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    listing = db.relationship(
        "Listing",
        back_populates="inquiries"
    )

    buyer = db.relationship(
        "User",
        back_populates="inquiries"
    )


class Offer(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    listing_id = db.Column(
        db.Integer,
        db.ForeignKey("listing.id"),
        nullable=False
    )

    buyer_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    amount = db.Column(db.Numeric(10, 2), nullable=False)
    message = db.Column(db.Text)

    is_active = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    outbid_notified = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    is_winner = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_offer_amount"),
    )

    listing = db.relationship(
        "Listing",
        back_populates="offers"
    )

    buyer = db.relationship(
        "User",
        back_populates="offers"
    )
