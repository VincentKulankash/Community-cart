# OWNER: MEMBER 3 (Listings CRUD)
# TASKS:
# 1. GET    /api/listings      (Public, with filters: ?category=&q=&min=&max=)
# 2. GET    /api/listings/<id> (Public, view details)
# 3. POST   /api/listings      (Auth required, owner = current_user)
# 4. PATCH  /api/listings/<id> (Auth required, owner ONLY)
# 5. DELETE /api/listings/<id> (Auth required, owner ONLY)
# 6. PATCH  /api/listings/<id>/sold (Auth required, owner ONLY)
# RULES:
# - Use @login_required for auth routes.
# - If user A tries to edit user B's listing, return 404 (not 403).

from flask import Blueprint

listings_bp = Blueprint("listings_bp", __name__, url_prefix="/api/listings")

# Member 3 will fill in the listings routes here
