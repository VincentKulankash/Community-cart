from flask import Blueprint, jsonify, request


mock_catalog_bp = Blueprint("mock_catalog_bp", __name__, url_prefix="/api/mock")

DEMO_LISTINGS = [
    {
        "id": "demo-1",
        "title": "Lounge chair, teak & cane",
        "description": "A little Sunday reading spot, ready for a new home.",
        "price": 145,
        "category": "Home",
        "location": "Silver Lake",
        "image_url": "https://images.unsplash.com/photo-1598300056393-4aac492f4344?auto=format&fit=crop&w=960&q=85",
        "condition": "Like new",
        "status": "active",
        "user_id": None,
    },
    {
        "id": "demo-2",
        "title": "35mm film camera",
        "description": "A classic film camera, ready for its next roll.",
        "price": 88,
        "category": "Tech",
        "location": "Echo Park",
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=960&q=85",
        "condition": "Good",
        "status": "active",
        "user_id": None,
    },
    {
        "id": "demo-3",
        "title": "Hand-thrown stoneware set",
        "description": "A handmade set from a local potter.",
        "price": 42,
        "category": "Home",
        "location": "Los Feliz",
        "image_url": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=960&q=85",
        "condition": "Like new",
        "status": "active",
        "user_id": None,
    },
    {
        "id": "demo-4",
        "title": "Everyday leather tote",
        "description": "A roomy leather tote for all the little things.",
        "price": 54,
        "category": "Style",
        "location": "Atwater Village",
        "image_url": "https://images.unsplash.com/photo-1590875512994-7f6f2e3b2e8d?auto=format&fit=crop&w=960&q=85",
        "condition": "Good",
        "status": "active",
        "user_id": None,
    },
    {
        "id": "demo-5",
        "title": "Vintage side table",
        "description": "Solid wood with a lovely patina.",
        "price": 70,
        "category": "Home",
        "location": "Highland Park",
        "image_url": "https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=960&q=85",
        "condition": "Well loved",
        "status": "active",
        "user_id": None,
    },
    {
        "id": "demo-6",
        "title": "Trail-ready daypack",
        "description": "A lightweight pack and a good excuse to get outside.",
        "price": 36,
        "category": "Outdoors",
        "location": "Glassell Park",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=960&q=85",
        "condition": "Like new",
        "status": "active",
        "user_id": None,
    },
    {
        "id": "demo-7",
        "title": "Soft cotton throw",
        "description": "A cozy cotton throw for slow evenings.",
        "price": 28,
        "category": "Home",
        "location": "Silver Lake",
        "image_url": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=960&q=85",
        "condition": "Good",
        "status": "active",
        "user_id": None,
    },
    {
        "id": "demo-8",
        "title": "Weekend market basket",
        "description": "A hand-woven basket for the weekend market.",
        "price": 24,
        "category": "Style",
        "location": "Los Feliz",
        "image_url": "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=960&q=85",
        "condition": "Like new",
        "status": "active",
        "user_id": None,
    },
]


@mock_catalog_bp.get("/listings")
def get_mock_listings():
    """Return a public demo catalog without creating database records."""
    listings = DEMO_LISTINGS
    category = request.args.get("category", "").strip().lower()
    search = request.args.get("q", "").strip().lower()
    min_price = request.args.get("min")
    max_price = request.args.get("max")

    try:
        min_price = float(min_price) if min_price else None
        max_price = float(max_price) if max_price else None
    except ValueError:
        return jsonify({"error": "min and max must be numbers"}), 422

    if category:
        listings = [item for item in listings if item["category"].lower() == category]
    if search:
        listings = [
            item
            for item in listings
            if search in f'{item["title"]} {item["description"]}'.lower()
        ]
    if min_price is not None:
        listings = [item for item in listings if item["price"] >= min_price]
    if max_price is not None:
        listings = [item for item in listings if item["price"] <= max_price]

    return jsonify(listings)
