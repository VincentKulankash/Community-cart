import os
from datetime import datetime, timedelta
from decimal import Decimal
import logging

from app import create_app
from extensions import db
from models import Favorite, Inquiry, Listing, Offer, User
from schemas.listing_schema import ListingSchema
from schemas.user_schema import UserSchema

log = logging.getLogger(__name__)

SEED_PASSWORD = os.environ.get("SEED_PASSWORD", "CommunityCart2026!")

USER_DATA = [
    {"name": "Maya Chen", "email": "maya.chen@example.com", "location": "Portland, OR"},
    {"name": "Jordan Ellis", "email": "jordan.ellis@example.com", "location": "Seattle, WA"},
    {"name": "Sofia Ramirez", "email": "sofia.ramirez@example.com", "location": "Austin, TX"},
    {"name": "Ethan Brooks", "email": "ethan.brooks@example.com", "location": "Denver, CO"},
    {"name": "Amara Okafor", "email": "amara.okafor@example.com", "location": "Chicago, IL"},
]

# `offer_days` is an offset in days from seed time. It is converted to a
# concrete `offer_ends_at` datetime at seed time so relative timing stays
# sensible no matter when the seed runs. Omit it for listings with no auction.
LISTING_DATA = [
    {
        "title": "Solid oak dining table",
        "description": "A sturdy six-seat oak table with a few small marks from everyday family use.",
        "price": "240.00",
        "category": "Furniture",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Dining+Table",
        "status": "active",
        "offer_days": 3,          
        "location": "Portland, OR",
        # live auction, two competing offers
    },
    {
        "title": "Pair of mid-century bedside tables",
        "description": "Two walnut-finish nightstands with drawers that slide smoothly.",
        "price": "95.00",
        "category": "Furniture",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Bedside+Tables",
        "status": "active",
        "location": "Seattle, WA",
    },
    {
        "title": "Blue commuter bicycle",
        "description": "Lightweight hybrid bike with recently replaced tires and working lights.",
        "price": "180.00",
        "category": "Sports & Outdoors",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Bicycle",
        "status": "active",
        "location": "Austin, TX",
    },
    {
        "title": "Cast iron Dutch oven",
        "description": "Enameled 5-quart Dutch oven, clean inside with minor chips on the lid.",
        "price": "55.00",
        "category": "Home & Kitchen",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Dutch+Oven",
        "status": "sold",
        "location": "Denver, CO",
        # No offer window for sold listings.
    },
    {
        "title": "Acoustic guitar with soft case",
        "description": "Full-size beginner acoustic guitar with fresh strings and a padded case.",
        "price": "110.00",
        "category": "Musical Instruments",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Guitar",
        "status": "active",
        "location": "Chicago, IL",
    },
    {
        "title": "Adjustable desk lamp",
        "description": "Metal task lamp with a weighted base and a warm LED bulb included.",
        "price": "22.00",
        "category": "Home & Kitchen",
        "condition": "Like New",
        "image_url": "https://placehold.co/600x400?text=Desk+Lamp",
        "status": "active",
        "location": "Portland, OR",
    },
    {
        "title": "Compact espresso machine",
        "description": "Countertop espresso maker, descaled regularly and includes the portafilter.",
        "price": "130.00",
        "category": "Home & Kitchen",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Espresso+Machine",
        "status": "active",
        "location": "Seattle, WA",
    },
    {
        "title": "Kids' balance bike",
        "description": "Red 12-inch balance bike, ideal for a first-time rider.",
        "price": "35.00",
        "category": "Kids",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Balance+Bike",
        "status": "sold",
        "location": "Austin, TX",
    },
    {
        "title": "Vintage denim jacket",
        "description": "Classic medium-weight denim jacket in a relaxed fit, size medium.",
        "price": "40.00",
        "category": "Clothing",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Denim+Jacket",
        "status": "active",
        "location": "Denver, CO",
    },
    {
        "title": "Two-shelf bookcase",
        "description": "Small white bookcase with adjustable shelves; easy to carry and assemble.",
        "price": "30.00",
        "category": "Furniture",
        "condition": "Fair",
        "image_url": "https://placehold.co/600x400?text=Bookcase",
        "status": "active",
        "location": "Chicago, IL",
    },
    {
        "title": "Ceramic planter set",
        "description": "Set of three glazed ceramic planters in graduated sizes, no cracks.",
        "price": "28.00",
        "category": "Garden",
        "condition": "Like New",
        "image_url": "https://placehold.co/600x400?text=Planters",
        "status": "active",
        "location": "Seattle, WA",
    },
    {
        "title": "Insulated camping tent",
        "description": "Three-person, three-season tent with rainfly, stakes, and storage bag.",
        "price": "85.00",
        "category": "Sports & Outdoors",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Tent",
        "status": "active",
        "offer_days": 5,          
        "location": "Austin, TX",
        # live auction, one offer
    },
    {
        "title": "Cordless drill and bit set",
        "description": "18V cordless drill with charger, battery, and a 20-piece bit set.",
        "price": "60.00",
        "category": "Tools",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Drill",
        "status": "sold",
        "location": "Denver, CO",
    },
    {
        "title": "Paperback mystery collection",
        "description": "Eight popular mystery novels in readable condition, sold together.",
        "price": "18.00",
        "category": "Books",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Mystery+Books",
        "status": "active",
        "location": "Chicago, IL",
    },
    {
        "title": "Bluetooth bookshelf speakers",
        "description": "Pair of compact powered speakers with Bluetooth and RCA inputs.",
        "price": "75.00",
        "category": "Electronics",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Speakers",
        "status": "active",
        "location": "Portland, OR",
    },
    {
        "title": "Handmade wool area rug",
        "description": "Colorful 5-by-7-foot wool rug, professionally cleaned last month.",
        "price": "150.00",
        "category": "Home & Kitchen",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Area+Rug",
        "status": "active",
        "offer_days": 1,         
        "location": "Seattle, WA",
         # auction closing soon, no offers yet
    },
    {
        "title": "Stainless steel cookware set",
        "description": "Five-piece cookware set with lids; compatible with induction cooktops.",
        "price": "90.00",
        "category": "Home & Kitchen",
        "condition": "Like New",
        "image_url": "https://placehold.co/600x400?text=Cookware",
        "status": "active",
        "location": "Denver, CO",
    },
    {
        "title": "Road bike helmet",
        "description": "Lightweight adult helmet with adjustable fit system and removable pads.",
        "price": "25.00",
        "category": "Sports & Outdoors",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Helmet",
        "status": "active",
        "location": "Chicago, IL",
    },
    {
        "title": "Solid pine writing desk",
        "description": "Compact writing desk with one drawer, suitable for a small home office.",
        "price": "125.00",
        "category": "Furniture",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Writing+Desk",
        "status": "active",
        "location": "Chicago, IL",
    },
    {
        "title": "Board game bundle",
        "description": "Four family board games with all pieces checked and included.",
        "price": "32.00",
        "category": "Toys & Games",
        "condition": "Good",
        "image_url": "https://placehold.co/600x400?text=Board+Games",
        "status": "active",
        "offer_days": -1,         
        "location": "Denver, CO",
        # already closed; useful for expired-auction UI
    },
]

FAVORITE_DATA = [
    {"user_email": "maya.chen@example.com", "listing_title": "Compact espresso machine"},
    {"user_email": "jordan.ellis@example.com", "listing_title": "Board game bundle"},
    {"user_email": "sofia.ramirez@example.com", "listing_title": "Acoustic guitar with soft case"},
    {"user_email": "ethan.brooks@example.com", "listing_title": "Stainless steel cookware set"},
    {"user_email": "amara.okafor@example.com", "listing_title": "Solid pine writing desk"},
]

INQUIRY_DATA = [
    {"buyer_email": "maya.chen@example.com", "listing_title": "Board game bundle", "message": "Do all four games have their rulebooks?"},
    {"buyer_email": "ethan.brooks@example.com", "listing_title": "Bluetooth bookshelf speakers", "message": "Any hiss or distortion at higher volumes?"},
    {"buyer_email": "sofia.ramirez@example.com", "listing_title": "Handmade wool area rug", "message": "What color is the dominant background?"},
]

OFFER_DATA = [
    {"buyer_email": "jordan.ellis@example.com", "listing_title": "Solid oak dining table", "amount": "200.00", "message": "Would you take $200 if I pick it up this weekend?"},
    {"buyer_email": "amara.okafor@example.com", "listing_title": "Solid oak dining table", "amount": "215.00", "message": "Can do $215, cash today."},
    {"buyer_email": "maya.chen@example.com", "listing_title": "Insulated camping tent", "amount": "70.00", "message": "Would you accept $70?"},
]

def _clear_old_data():
    """Wipe all existing data. Orders matters because of foreign keys"""
    db.session.query(Offer).delete()
    db.session.query(Inquiry).delete()
    db.session.query(Favorite).delete()
    db.session.query(Listing).delete()
    db.session.query(User).delete()
    db.session.commit()
    log.info("Cleared existing data.")


def _seed_users():
    user_schema = UserSchema()
    users_by_email = {}
    for raw in USER_DATA:
        validated = user_schema.load({**raw, "password": SEED_PASSWORD})
        user = User(
            name=validated["name"],
            email=validated["email"],
            location=validated.get("location"),
        )
        user.set_password(validated["password"])
        db.session.add(user)
        users_by_email[user.email] = user
    db.session.flush()
    return users_by_email


def _seed_listings(users_by_email):
    listing_schema = ListingSchema()
    user_by_location = {u.location: u for u in users_by_email.values()}
    now = datetime.utcnow()

    listings_by_title = {}
    for raw in LISTING_DATA:
        raw = dict(raw)  # don't mutate module-level dicts
        status = raw.pop("status", "active")             # not in ListingSchema
        offer_days = raw.pop("offer_days", None)         # not in ListingSchema

        validated = listing_schema.load(raw)

        location = validated.get("location")
        seller = user_by_location.get(location)
        if seller is None:
            seller = list(users_by_email.values())[len(listings_by_title) % len(users_by_email)]
            log.warning("No user in %r; assigning %s as seller.", location, seller.email)

        listing = Listing(
            title=validated["title"],
            description=validated["description"],
            price=Decimal(validated["price"]),
            category=validated["category"],
            condition=validated.get("condition"),
            image_url=validated.get("image_url"),
            location=location,
            status=status,
            offer_ends_at=(
                now + timedelta(days=offer_days) if offer_days is not None else None
            ),
            user_id=seller.id,
        )
        db.session.add(listing)
        listings_by_title[listing.title] = listing
    db.session.flush()
    return listings_by_title


def _seed_favorites(users_by_email, listings_by_title):
    for raw in FAVORITE_DATA:
        user = users_by_email[raw["user_email"]]
        listing = listings_by_title[raw["listing_title"]]
        db.session.add(Favorite(user_id=user.id, listing_id=listing.id))


def _seed_inquiries(users_by_email, listings_by_title):
    for raw in INQUIRY_DATA:
        buyer = users_by_email[raw["buyer_email"]]
        listing = listings_by_title[raw["listing_title"]]
        db.session.add(Inquiry(
            listing_id=listing.id,
            buyer_id=buyer.id,
            message=raw["message"],
        ))


def _seed_offers(users_by_email, listings_by_title):
    for raw in OFFER_DATA:
        buyer = users_by_email[raw["buyer_email"]]
        listing = listings_by_title[raw["listing_title"]]
        db.session.add(Offer(
            listing_id=listing.id,
            buyer_id=buyer.id,
            amount=Decimal(raw["amount"]),
            message=raw.get("message"),
            is_active=True,
        ))


def seed_database():
    app = create_app()
    with app.app_context():
        # Schema creation is left to migrations (`flask db upgrade`).

        try:
            print('Clearing out old data...')
            _clear_old_data()
            users_by_email = _seed_users()
            listings_by_title = _seed_listings(users_by_email)
            _seed_favorites(users_by_email, listings_by_title)
            _seed_inquiries(users_by_email, listings_by_title)
            _seed_offers(users_by_email, listings_by_title)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        log.info(
            "Seeded %d users, %d listings, %d favorites, %d inquiries, %d offers.",
            len(users_by_email),
            len(listings_by_title),
            len(FAVORITE_DATA),
            len(INQUIRY_DATA),
            len(OFFER_DATA),
        )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    seed_database()