# OWNER: MEMBER 3 (Listings CRUD)
# TASKS:
# 1. Helper functions for filtering listings (category, search, price range).
# 2. Ownership check for PATCH/DELETE.
# 3. Logic to mark listing as sold.
# RULES:
# - Keep business logic here, not in the route functions.

# Member 3 will fill this in
from sqlalchemy import or_

from extensions import db
from models import Listing


def filter_listings(category=None, search=None, min_price=None, max_price=None):
    query = Listing.query

    if category:
        query = query.filter(Listing.category == category)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(Listing.title.ilike(pattern), Listing.description.ilike(pattern))
        )
    if min_price is not None:
        query = query.filter(Listing.price >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price <= max_price)

    return query.order_by(Listing.id.desc()).all()


def get_owned_listing(listing_id, user):
    listing = db.session.get(Listing, listing_id)
    if listing is None or listing.owner_id != user.id:
        return None
    return listing


def mark_sold(listing):
    listing.status = "sold"
    db.session.commit()
    return listing
