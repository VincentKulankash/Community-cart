import { apiRequest } from "./api";

export function getFavorites() {
  return apiRequest("/favorites");
}

export function addFavorite(listingId) {
  return apiRequest(`/favorites/${listingId}`, {
    method: "POST",
  });
}

export function removeFavorite(listingId) {
  return apiRequest(`/favorites/${listingId}`, {
    method: "DELETE",
  });
}
