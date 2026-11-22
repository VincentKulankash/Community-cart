
import { get, post, remove } from "./api";

const FAVORITES_ENDPOINT = "/api/favorites";

export function getFavorites() {
  return get(FAVORITES_ENDPOINT);
}

export function addFavorite(listingId) {
  return post(`${FAVORITES_ENDPOINT}/${encodeURIComponent(listingId)}`);
}

export function removeFavorite(listingId) {
  return remove(`${FAVORITES_ENDPOINT}/${encodeURIComponent(listingId)}`);
}
