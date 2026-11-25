
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

    listings = db.relationship(
        "Listing",
        back_populates="seller",
        cascade="all, delete-orphan",
        foreign_keys="Listing.user_id",
    )

    favorites = db.relationship(
        "Favorite",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    inquiries = db.relationship(
        "Inquiry",
        back_populates="buyer",
        cascade="all, delete-orphan",
    )

    offers = db.relationship(
        "Offer",
        back_populates="buyer",
        cascade="all, delete-orphan",
    )

    cart_items = db.relationship(
        "CartItem",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    payments = db.relationship(
        "Payment",
        back_populates="user",
        cascade="all, delete-orphan",
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

    winner_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint("price >= 0", name="check_listing_price"),
    )

    seller = db.relationship(
        "User",
        back_populates="listings",
        foreign_keys=[user_id],
    )

    favorites = db.relationship(
        "Favorite",
        back_populates="listing",
        cascade="all, delete-orphan",
    )

    inquiries = db.relationship(
        "Inquiry",
        back_populates="listing",
        cascade="all, delete-orphan",
    )

    offers = db.relationship(
        "Offer",
        back_populates="listing",
        cascade="all, delete-orphan",
    )

    cart_items = db.relationship(
        "CartItem",
        back_populates="listing",
        cascade="all, delete-orphan",
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


class CartItem(db.Model):
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

    quantity = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "listing_id",
            name="unique_user_listing_cart"
        ),
        CheckConstraint(
            "quantity >= 1",
            name="check_cart_quantity"
        ),
    )

    user = db.relationship(
        "User",
        back_populates="cart_items"
    )

    listing = db.relationship(
        "Listing",
        back_populates="cart_items"
    )


class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False,
        index=True
    )

    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(
        db.String(3),
        nullable=False,
        default="KES"
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending"
    )

    payment_method = db.Column(
        db.String(30),
        nullable=False,
        default="mpesa_sandbox"
    )

    merchant_request_id = db.Column(
        db.String(100),
        unique=True
    )

    checkout_request_id = db.Column(
        db.String(100),
        unique=True
    )

    mpesa_receipt_number = db.Column(
        db.String(100),
        unique=True
    )

    result_code = db.Column(db.String(20))
    result_description = db.Column(db.Text)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "amount > 0",
            name="check_payment_amount"
        ),
        CheckConstraint(
            "status IN ('pending', 'succeeded', 'failed')",
            name="check_payment_status"
        ),
    )

    user = db.relationship(
        "User",
        back_populates="payments"
    )

    order_items = db.relationship(
        "OrderItem",
        back_populates="payment",
        cascade="all, delete-orphan",
    )


class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    payment_id = db.Column(
        db.Integer,
        db.ForeignKey("payment.id"),
        nullable=False,
        index=True
    )

    listing_id = db.Column(
        db.Integer,
        db.ForeignKey("listing.id", ondelete="SET NULL"),
        nullable=True
    )

    title = db.Column(db.String(150), nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(500))

    payment = db.relationship(
        "Payment",
        back_populates="order_items"
    )

    listing = db.relationship("Listing")

    __table_args__ = (
        CheckConstraint("unit_price > 0", name="check_order_item_price"),
        CheckConstraint("quantity >= 1", name="check_order_item_quantity"),
    )
