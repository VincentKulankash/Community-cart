# Community Cart

Community Cart is a neighborhood marketplace for second-hand goods. The React storefront connects to a Flask API for accounts, listings, favorites, inquiries, and private offers.

## Project structure

- `frontend/` — React 19 and Vite application
- `backend/` — Flask API, SQLAlchemy models, migrations, and seed data

## Run the backend

In one terminal:

```sh
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` with a secret key and local database URL:

```env
SECRET_KEY=replace-with-a-long-random-secret
DATABASE_URL=sqlite:///app.db
MONGODB_URI=mongodb://127.0.0.1:27017/
MONGODB_DATABASE=community_cart_underground
UNDERGROUND_DEMO_MODE=true
```

With `UNDERGROUND_DEMO_MODE=true`, the Underground API serves its curated sample catalog directly and does not need MongoDB. Product examples use real product names and images, but retailer prices, stock, booking availability, and checkout are not connected. Set it to `false` when you want to read products from MongoDB; then configure `MONGODB_URI` and `MONGODB_DATABASE` for your local server or Atlas. The MongoDB URI is separate from the SQLite `DATABASE_URL` used by the main marketplace.

Then initialize and start the API:

```sh
flask --app app:create_app db upgrade
python seed.py
flask --app app:create_app run
```

`python seed.py` is optional demo data for a fresh local SQLite database. It clears existing records before reseeding, so don’t run it against a database with data you want to keep. When using MongoDB mode (`UNDERGROUND_DEMO_MODE=false`), `python -m underground.seed` adds the Underground sample catalog to MongoDB and requires at least one SQLite user.

The API runs at `http://127.0.0.1:5000`; interactive documentation is at `/apidocs`. The sample accounts use the password `CommunityCart2026!`.

## Run the frontend

In a second terminal:

```sh
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend uses the Flask API at port 5000 by default. To point it at another API origin, create `frontend/.env.local` and set:

```env
VITE_API_BASE_URL=https://your-api.example.com
```

## Marketplace features

- Browse and search active listings
- Register, sign in, and maintain a server session
- Create, update, mark sold, and delete your listings
- Save favorites to your account
- Send listing inquiries and private offers
- Review offers on your listings and close an offer window
