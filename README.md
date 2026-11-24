# Community Cart

**A Community-Driven Online Marketplace**

Community Cart is a web-based marketplace that connects buyers and sellers within a community. Users can discover products, create and manage listings, save favourites, send inquiries, communicate with sellers, and submit offers on available items.

The project is built using React, Flask and PostgreSQL, with a REST API connecting the frontend and backend.

---

## Live Application

| Component | Location |
|---|---|
| Frontend Application | [Community Cart – Live Website](https://community-cart-1.onrender.com) |
| Backend API Documentation | [Swagger UI – Interactive API Docs](https://community-cart-giku.onrender.com/apidocs) |
| Backend API Base URL | `https://community-cart-giku.onrender.com` |
| Source Code | [GitHub Repository](https://github.com/VincentKulankash/Community-cart) |

**API Documentation:** The backend provides interactive API documentation through Swagger UI. Visit `/apidocs` on the backend URL to explore available endpoints, request parameters, authentication requirements and responses.

*Note: Confirm the backend service URL against the current Render dashboard if the service has been renamed.*

---

## Project Structure

The repository is organized into two main applications:

```text
Community-cart/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── App.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── routes/
│   ├── services/
│   ├── schemas/
│   ├── migrations/
│   ├── tests/
│   ├── app.py
│   ├── config.py
│   ├── extensions.py
│   ├── models.py
│   ├── seed.py
│   ├── requirements.txt
│   └── Procfile
│
└── README.md
```

### Frontend

The `frontend/` directory contains the React application.

It includes:
- User interface components.
- Application pages and navigation.
- Authentication interfaces.
- Marketplace and listing management pages.
- Messaging and inquiry interfaces.
- Favourites and offers pages.
- API service modules used to communicate with the backend.

**Technologies:** React, JavaScript, Vite and CSS.

### Backend

The `backend/` directory contains the Flask REST API.

It includes:
- API routes and endpoints.
- Database models and relationships.
- Business logic and service modules.
- Request and response schemas.
- Authentication and session management.
- Database migrations.
- Automated backend tests.

**Technologies:** Python, Flask, SQLAlchemy, Flask-Migrate, Flask-Login, Marshmallow and PostgreSQL.

---

## Main Features

### 1. User Authentication
- User registration.
- User login and logout.
- Session-based authentication.
- Protected application functionality.

### 2. Marketplace
- Browse available listings.
- View individual product details.
- Search and filter listings.
- View seller and product information.

### 3. Listing Management
- Create product listings.
- Edit existing listings.
- Delete listings.
- Manage personal listings.
- Mark listings as sold.

### 4. Favourites
- Save interesting listings.
- View saved products.
- Remove listings from favourites.

### 5. Inquiries and Messaging
- Send inquiries to sellers.
- View sent and received inquiries.
- Reply to buyer inquiries.
- View inquiry conversations.

### 6. Offers
- Submit private offers on listings.
- View offers received on personal listings.
- Track submitted offers through My Offers.
- Manage offer deadlines.
- Close offer periods.
- Accept offers and select winning buyers.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Frontend Tooling | Vite |
| Backend | Python / Flask |
| API Documentation | Flasgger / Swagger UI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Database Migrations | Flask-Migrate / Alembic |
| Authentication | Flask-Login |
| API Serialization | Marshmallow |
| Version Control | Git and GitHub |
| Deployment | Render |

---

## Running the Project Locally

You can run the frontend and backend independently on your development machine.

### Prerequisites

Install the following:

- Python 3
- Node.js and npm
- Git
- PostgreSQL (optional for local development if using SQLite)

### 1. Clone the repository

```bash
git clone https://github.com/VincentKulankash/Community-cart.git

cd Community-cart
```

### 2. Set up the backend

Navigate into the backend directory:

```bash
cd backend
```

Create and activate a Python virtual environment:

```bash
python3 -m venv venv

source venv/bin/activate
```

On Windows:

```bash
venv\Scripts\activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure backend environment variables

Create your local environment file:

```bash
cp .env.example .env
```

Open `.env` and configure the required variables:

```env
SECRET_KEY=your_generated_secret_key
DATABASE_URL=sqlite:///app.db
```

Generate a secret key using:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

For local development, SQLite is configured as the default database. PostgreSQL can also be used by providing the appropriate database connection URL.

**Important:** Never commit your actual `.env` file or expose database credentials and secret keys.

### 4. Apply database migrations

From the `backend/` directory, run:

```bash
flask db upgrade
```

This applies the database migrations and creates or updates the required database schema.

### 5. Start the backend server

Run:

```bash
flask run
```

The backend will be available at:

```text
http://127.0.0.1:5000
```

Local interactive API documentation:

```text
http://127.0.0.1:5000/apidocs
```

### 6. Set up the frontend

Open another terminal and navigate to the frontend directory:

```bash
cd Community-cart/frontend
```

Install the dependencies:

```bash
npm install
```

Create a frontend environment file named `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000
```

This configures the React application to communicate with your local Flask backend.

### 7. Start the frontend

Run:

```bash
npm run dev
```

Vite will display the local development address in the terminal.

Open that address in your browser to use Community Cart.

---

## Running Backend Tests

The backend includes automated tests covering major application functionality.

Navigate into the backend directory and activate your virtual environment, then run:

```bash
pytest -v
```

The tests cover areas including:

- Authentication.
- Listing management.
- Favourites.
- Inquiries and replies.
- Offers.
- Offer winner selection.

---

## API Documentation

The backend API is documented using Flasgger, which provides an interactive Swagger interface.

### Accessing the documentation

**Deployed API documentation:**

[https://community-cart-giku.onrender.com/apidocs](https://community-cart-giku.onrender.com/apidocs)

**Local API documentation:**

[http://127.0.0.1:5000/apidocs](http://127.0.0.1:5000/apidocs)

The documentation allows developers to:
- Explore available API endpoints.
- Inspect supported HTTP methods.
- View request parameters and payload structures.
- Understand expected responses and status codes.
- Test API requests interactively.

---

## Deployment

Community Cart is deployed using Render.

The frontend is deployed as a Render Static Site, while the backend runs as a Flask application using Gunicorn.

The production application uses environment variables for configuration, including the database connection and application secret key.

Database schema changes are managed using Flask-Migrate and Alembic.

---

## Version Control and Collaboration

The project is maintained in GitHub.

Repository:

[https://github.com/VincentKulankash/Community-cart](https://github.com/VincentKulankash/Community-cart)

Git was used for source control, collaboration, branch management, feature development and integration.

---

## Project Purpose

Community Cart was developed as an academic software development project to demonstrate the design and implementation of a full-stack web application.

It applies concepts including:
- Frontend development.
- Backend API development.
- Relational database design.
- User authentication and authorization.
- Software integration.
- Version control and collaborative development.
- Software testing and deployment.

---

**Community Cart — Making community commerce simpler and more connected.**