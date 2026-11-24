/*
 * Listing status helpers.
 *
 * Backend statuses: "active" (no offers yet), "open_for_offers" (offers
 * received, still open), "awaiting_decision" (deadline passed, seller is
 * choosing), "sold" and "closed" (finished).
 */

// Still accepting offers and visible on the marketplace.
export function isOpenStatus(status) {
  return status === "active" || status === "open_for_offers";
}