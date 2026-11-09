# OWNER: MEMBER 5 (Inquiries & Dashboard)
# TASKS:
# 1. POST /api/listings/<id>/inquiries (Auth: buyer sends message to seller)
# 2. GET  /api/listings/<id>/inquiries (Auth: seller views messages for their listing)
# 3. GET  /api/inquiries/sent          (Auth: buyer views their sent messages)
# RULES:
# - Only the listing owner can view inquiries for that listing.


from flask import Blueprint

inquiries_bp = Blueprint("inquiries_bp", __name__, url_prefix="/api/inquiries")

# Member 5 will fill in the inquiries routes here