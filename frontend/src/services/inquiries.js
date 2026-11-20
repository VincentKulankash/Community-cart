
/*
 * DEVELOPER: Mumo
 * RESPONSIBILITY: Inquiries feature integration.
 *
 * EXISTING SERVICE FUNCTIONS:
 * - sendInquiry(listingId, message)
 * - getListingInquiries(listingId)
 * - getSentInquiries()
 *
 * TASKS:
 * - Connect the existing inquiry service functions to the UI.
 * - Implement the inquiry form on the listing details page.
 * - Allow users to view inquiries they have sent.
 * - Allow listing owners to view inquiries received on their listings.
 * - Add loading, empty, success, and error states.
 * - Refresh inquiry data after submitting an inquiry.
 *
 * RULES:
 * - Import and reuse functions from this service file.
 * - Do not recreate API requests inside React components.
 * - Do not duplicate the shared API configuration in api.js.
 * - All endpoints require authentication.
 * - Users cannot inquire about their own listings.
 * - Only listing owners can view inquiries on their listings.
 * - The backend remains responsible for enforcing permissions.
 */

import { get, post } from "./api";

const LISTINGS_ENDPOINT = "/api/listings";
const INQUIRIES_ENDPOINT = "/api/inquiries";

// Send an inquiry to a listing's seller.
export function sendInquiry(listingId, message) {
  return post(
    `${LISTINGS_ENDPOINT}/${encodeURIComponent(listingId)}/inquiries`,
    { message }
  );
}

// Retrieve inquiries received on your own listing.
export function getListingInquiries(listingId) {
  return get(
    `${LISTINGS_ENDPOINT}/${encodeURIComponent(listingId)}/inquiries`
  );
}

// Retrieve inquiries you have sent to other sellers.
export function getSentInquiries() {
  return get(`${INQUIRIES_ENDPOINT}/sent`);
}
