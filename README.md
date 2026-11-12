# LocalLoop

LocalLoop makes local second-hand sales fairer with private sealed offers and
deadlines: buyers browse listings without an account, and the highest offer
wins when a listing closes.

## Frontend

The React/Vite prototype is in [`frontend/`](./frontend/). To run it locally:

```sh
cd frontend
npm install
npm run dev
```

The frontend loads its product catalog from Fake Store API and keeps
LocalLoop-specific demo state in browser storage. Fake Store writes are
simulated and overlaid locally. See [`frontend/README.md`](./frontend/README.md)
for details and the Flask integration boundary.
