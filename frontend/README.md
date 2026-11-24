# LocalLoop frontend

A responsive React storefront inspired by the high-contrast black and red
palette, oversized display type, cinematic imagery, and motion in the design
reference.

## Run locally

```sh
npm install
npm run dev
```

The Vite server runs on port 3000. The storefront starts with curated LocalLoop
demo finds and loads the wider product catalog from DummyJSON. If that catalog
is unavailable, the curated picks remain available and an on-page notice
explains the issue.

Search, category filters, and saved finds work in the browser. Saved finds are
stored in local storage. Listing creation is a visual placeholder; the Flask
auth, favorites, and offers endpoints are not implemented yet.
