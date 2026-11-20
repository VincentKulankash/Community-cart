import { apiRequest } from "./api";

export function getCart() {
  return apiRequest("/cart");
}

export function addToCart(listingId, quantity = 1) {
  return apiRequest(`/cart/${listingId}`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  });
}

export function updateCartQuantity(listingId, quantity) {
  return apiRequest(`/cart/${listingId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export function removeFromCart(listingId) {
  return apiRequest(`/cart/${listingId}`, {
    method: "DELETE",
  });
}

export function clearCart() {
  return apiRequest("/cart", {
    method: "DELETE",
  });
}
