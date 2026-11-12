# OWNER: VINCENT (Scrum Master / Offers Engine)
# TASKS:
# 1. POST   /api/listings/<id>/offers (Submit sealed offer, auth required, NOT owner)
# 2. GET    /api/listings/<id>/offers (Owner only: view all offers)
# 3. GET    /api/listings/<id>/offers/mine (Buyer: view own offer + outbid status)
# 4. POST   /api/listings/<id>/offers/close (Owner only: finalize winner now)
# RULES:
# - Outbid logic: If a new offer is higher, trigger Mailtrap email to the previous highest bidder.
# - Tie-break: Earliest offer wins.
# - Auto-close: If deadline passed on read/write, finalize winner.
# - Owner cannot offer on own listing.


from flask import Blueprint

offers_bp = Blueprint("offers_bp", __name__, url_prefix="/api/listings")

# Vincent will fill in the offers routes here