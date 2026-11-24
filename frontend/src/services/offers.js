/*
 * DEVELOPER: Mumo
 * RESPONSIBILITY: Offers feature integration.
 *
 * EXISTING SERVICE FUNCTIONS:
 * - submitOffer(listingId, amount, message)
 * - getListingOffers(listingId)
 * - getMyOffer(listingId)
 * - closeListingAuction(listingId)
 * - acceptOffer(listingId, offerId)
 *
 * TASKS:
 * - Connect the existing offer service functions to the UI.
 * - Implement the offer submission interface.
 * - Display the current user's offer on a listing.
 * - Allow listing owners to view offers received.
 * - Implement the auction closing interface for listing owners.
 * - Add loading, empty, success, and error states.
 * - Refresh offer information after submitting or closing an auction.
 *
 * RULES:
 * - Import and reuse functions from this service file.
 * - Do not recreate API requests inside React components.
 * - Do not duplicate the shared API configuration in api.js.
 * - All endpoints require authentication.
 * - Offer amounts must be greater than zero.
 * - Only listing owners can view all offers or close auctions.
 * - The backend remains responsible for enforcing permissions.
 */

import { get, post } from "./api";

const LISTINGS_ENDPOINT = "/api/listings";

// Submit an offer on a listing.
export function submitOffer(listingId, amount, message) {
  const offerData = { amount };

  if (message !== undefined && message !== null && message !== "") {
    offerData.message = message;
  }

  return post(
    `${LISTINGS_ENDPOINT}/${encodeURIComponent(listingId)}/offers`,
    offerData
  );
}

// Retrieve all offers on your own listing.
export function getListingOffers(listingId) {
  return get(
    `${LISTINGS_ENDPOINT}/${encodeURIComponent(listingId)}/offers`
  );
}

// Retrieve your own offer on a listing.
export function getMyOffer(listingId) {
  return get(
    `${LISTINGS_ENDPOINT}/${encodeURIComponent(listingId)}/offers/mine`
  );
}

// Close an auction and finalise its winner.
export function closeListingAuction(listingId) {
  return post(
    `${LISTINGS_ENDPOINT}/${encodeURIComponent(listingId)}/offers/close`
  );
}

// Accept a specific offer (owner only) and mark the listing as sold.
export function acceptOffer(listingId, offerId) {
  return post(
    `${LISTINGS_ENDPOINT}/${encodeURIComponent(listingId)}/offers/${encodeURIComponent(offerId)}/accept`
  );
}