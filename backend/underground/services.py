from decimal import Decimal
from sqlalchemy import asc, desc, or_

from extensions import db
from models import UndergroundProduct

SORT_FIELDS = {
    "newest": (desc(UndergroundProduct.created_at), asc(UndergroundProduct.id)),
    "price_asc": (asc(UndergroundProduct.price), asc(UndergroundProduct.id)),
    "price_desc": (desc(UndergroundProduct.price), asc(UndergroundProduct.id)),
    "rating": (desc(UndergroundProduct.average_rating), asc(UndergroundProduct.id)),
}


def search_products(filters):
    query = UndergroundProduct.query

    for field in ("category", "subcategory", "availability"):
        value = filters.get(field)
        if value is not None:
            query = query.filter(getattr(UndergroundProduct, field) == value)

    search_term = (filters.get("q") or "").strip()
    if search_term:
        pattern = f"%{search_term}%"
        query = query.filter(
            or_(
                UndergroundProduct.name.ilike(pattern),
                UndergroundProduct.description.ilike(pattern),
            )
        )

    if filters.get("min_price") is not None:
        query = query.filter(UndergroundProduct.price >= Decimal(filters["min_price"]))
    if filters.get("max_price") is not None:
        query = query.filter(UndergroundProduct.price <= Decimal(filters["max_price"]))

    total = query.count()
    page = filters["page"]
    per_page = filters["per_page"]

    items = (
        query.order_by(*SORT_FIELDS[filters["sort"]])
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "items": items,
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page,
    }


def get_product(product_id):
    return db.session.get(UndergroundProduct, product_id)


def get_categories():
    rows = (
        db.session.query(UndergroundProduct.category)
        .distinct()
        .order_by(UndergroundProduct.category.asc())
        .all()
    )
    return [cat for (cat,) in rows if isinstance(cat, str) and cat]
