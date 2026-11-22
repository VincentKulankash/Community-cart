
/*
 * DEVELOPER: Vincent (shared API integration)
 * RESPONSIBILITY: Marketplace listings API service.
 *
 * Handles:
 * - Retrieving all listings.
 * - Retrieving an individual listing.
 * - Creating a listing.
 * - Updating an existing listing.
 * - Deleting a listing.
 * - Marking a listing as sold.
 *
 * INTEGRATION:
 * - Uses the shared api.js configuration.
 * - Does not implement its own fetch configuration.
 * - Public listing retrieval does not require authentication.
 * - Creating, updating and deleting listings require authentication.
 */

import { get, post, patch, remove } from "./api";

const LISTINGS_ENDPOINT = "/api/listings";

// Retrieve marketplace listings.
// Supported filters: category, q, min, max.
export function getListings(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value);
    }
  });

  const queryString = params.toString();

  return get(
    queryString
      ? `${LISTINGS_ENDPOINT}?${queryString}`
      : LISTINGS_ENDPOINT
  );
}

// Retrieve a single listing by ID.
export function getListingById(id) {
  return get(`${LISTINGS_ENDPOINT}/${encodeURIComponent(id)}`);
}

// Retrieve listings owned by the authenticated user.
export function getMyListings() {
  return get(`${LISTINGS_ENDPOINT}/mine`);
}

// Create a new listing.
export function createListing(listingData) {
  return post(LISTINGS_ENDPOINT, listingData);
}

// Update an existing listing.
export function updateListing(id, listingData) {
  return patch(
    `${LISTINGS_ENDPOINT}/${encodeURIComponent(id)}`,
    listingData
  );
}

// Delete a listing.
export function deleteListing(id) {
  return remove(
    `${LISTINGS_ENDPOINT}/${encodeURIComponent(id)}`
  );
}

// Mark a listing as sold.
export function markListingAsSold(id) {
  return patch(
    `${LISTINGS_ENDPOINT}/${encodeURIComponent(id)}/sold`
  );
}
