import { get, post, remove } from "./api";

const FAVORITES_ENDPOINT = "/api/favorites";

// Retrieve the logged-in user's favourites.
export function getFavorites() {
  return get(FAVORITES_ENDPOINT);
}

// Add a listing to favourites.
export function addFavorite(listingId) {
  return post(
    `${FAVORITES_ENDPOINT}/${encodeURIComponent(listingId)}`
  );
}

// Remove a listing from favourites.
export function removeFavorite(listingId) {
  return remove(
    `${FAVORITES_ENDPOINT}/${encodeURIComponent(listingId)}`
  );
}