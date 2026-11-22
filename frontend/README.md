# Community Cart frontend

React and Vite storefront for the Flask marketplace API.

## Start it

```sh
npm install
npm run dev
```

By default, the frontend connects to Flask at `http://localhost:5000`. Set `VITE_API_BASE_URL` in `.env.local` to use a different API origin. The backend must allow the frontend origin through CORS and support cookie credentials for account sessions.

The app includes browsing, search, saved listings, account registration and login, listing creation and management, private offers, and seller inquiries. Start the Flask API and seed local demo data using the instructions in the repository root README.
