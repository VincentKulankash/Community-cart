import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  MapPin,
  Tag,
  Clock3,
  MessageCircle,
  Send,
  HandCoins,
} from "lucide-react";

import { getListingById } from "../services/listings";
import { sendInquiry } from "../services/inquiries";
import { getMyOffer, submitOffer } from "../services/offers";
import BackButton from "../components/BackButton";
import OfferManager from "../components/OfferManager";
import { formatDeadline, parseServerDate } from "../utils/dates";

function formatPrice(price) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

const STATUS_LABELS = {
  active: "Open for offers",
  open_for_offers: "Open for offers",
  sold: "Sold",
  closed: "Closed",
  pending: "Pending",
};

function statusLabel(status) {
  if (!status) return "";
  return (
    STATUS_LABELS[status] ||
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
  );
}

function ListingDetails({
  listingId,
  currentUser,
  onNavigate,
  onNotify,
  onBack,
}) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [inquiryMessage, setInquiryMessage] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [sendingOffer, setSendingOffer] = useState(false);

  const [myOffer, setMyOffer] = useState(null);
  const [offerLoading, setOfferLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadListing() {
      try {
        setLoading(true);
        setError("");

        const data = await getListingById(listingId);

        if (isMounted) {
          setListing(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load this listing.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadListing();

    return () => {
      isMounted = false;
    };
  }, [listingId]);

  const isOwner =
    listing &&
    currentUser &&
    Number(currentUser.id) === Number(listing.user_id);

  useEffect(() => {
    let isMounted = true;

    async function loadMyOffer() {
      if (!listing || !currentUser || isOwner) {
        setMyOffer(null);
        return;
      }

      try {
        setOfferLoading(true);

        const data = await getMyOffer(listingId);

        if (isMounted) {
          setMyOffer(data?.offer || null);
        }
      } catch {
        // A failed offer lookup should not prevent viewing the listing.
      } finally {
        if (isMounted) {
          setOfferLoading(false);
        }
      }
    }

    loadMyOffer();

    return () => {
      isMounted = false;
    };
  }, [listing, listingId, currentUser, isOwner]);

  async function handleInquirySubmit(event) {
    event.preventDefault();

    if (!currentUser) {
      onNotify?.("Please sign in to contact the seller");
      onNavigate("/login");
      return;
    }

    if (!inquiryMessage.trim()) {
      onNotify?.("Please enter a message");
      return;
    }

    try {
      setSendingInquiry(true);

      await sendInquiry(listingId, inquiryMessage.trim());

      setInquiryMessage("");
      onNotify?.("Your inquiry has been sent to the seller");
    } catch (err) {
      onNotify?.(err.message || "Unable to send your inquiry");
    } finally {
      setSendingInquiry(false);
    }
  }

  async function handleOfferSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
      onNotify?.("Please sign in to make an offer");
      onNavigate("/login");
      return;
    }

    const amount = Number(offerAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      onNotify?.("Enter a valid offer amount");
      return;
    }

    try {
      setSendingOffer(true);

      const data = await submitOffer(
        listingId,
        amount,
        offerMessage.trim()
      );

      setMyOffer(data);
      setOfferAmount("");
      setOfferMessage("");

      onNotify?.("Your offer has been submitted");
    } catch (err) {
      onNotify?.(err.message || "Unable to submit your offer");
    } finally {
      setSendingOffer(false);
    }
  }

  if (loading) {
    return (
      <main className="listing-detail-page">
        <p className="finds-message" role="status">
          Loading listing details...
        </p>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="listing-detail-page">
        <BackButton onBack={onBack} fallback="/listings" className="marketplace-back" />

        <p className="finds-message finds-error" role="alert">
          {error || "This listing could not be found."}
        </p>
      </main>
    );
  }

  // "active" = no offers yet, "open_for_offers" = at least one offer received.
  const isOpen =
    listing.status === "active" || listing.status === "open_for_offers";
  const canMakeOffer = isOpen && !isOwner;

  const deadline = parseServerDate(listing.offer_ends_at);
  const offersClosed = Boolean(deadline && deadline.getTime() < Date.now());

  return (
    <main className="listing-detail-page">
      <BackButton onBack={onBack} fallback="/listings" className="marketplace-back" />

      <div className="listing-detail-layout">
        <section className="listing-detail-main">
          <div className="listing-detail-image">
            {listing.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.title}
              />
            ) : (
              <div className="listing-image-placeholder">
                No image available
              </div>
            )}
          </div>

          <div className="listing-detail-content">
            <div className="listing-detail-category">
              <Tag size={14} />
              {listing.category}
            </div>

            <h1>{listing.title}</h1>

            <p className="listing-detail-price">
              {formatPrice(listing.price)}
            </p>

            <div className="listing-detail-meta">
              {listing.condition && (
                <span>{listing.condition}</span>
              )}

              <span>
                <MapPin size={15} />
                {listing.location || "Location not specified"}
              </span>

              <span className="listing-status">
                {statusLabel(listing.status)}
              </span>
            </div>

            {canMakeOffer && !offersClosed && (
              <button
                type="button"
                className="button-primary detail-jump"
                onClick={() =>
                  document
                    .getElementById("offer-card")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <HandCoins size={18} aria-hidden="true" />
                Make an offer
              </button>
            )}

            <div className="listing-description">
              <h2>About this item</h2>
              <p>
                {listing.description || "The seller has not added a description."}
              </p>
            </div>

            {deadline && (
              <div
                className={
                  offersClosed
                    ? "listing-deadline is-closed"
                    : "listing-deadline"
                }
              >
                <Clock3 size={16} />
                {offersClosed ? "Offers closed" : "Offer deadline"}:{" "}
                {formatDeadline(deadline)}
              </div>
            )}
          </div>
        </section>

        <aside className="listing-detail-sidebar">
          {isOwner ? (
            <>
              <div className="detail-action-card">
                <h2>Your listing</h2>
                <p>
                  Review the offers below, or update the details and
                  deadline.
                </p>
                <button
                  type="button"
                  className="detail-submit-button"
                  onClick={() => onNavigate(`/listings/${listing.id}/edit`)}
                >
                  <Edit3 size={16} /> Edit listing
                </button>
              </div>

              <OfferManager
                listing={listing}
                onNotify={onNotify}
                onStatusChange={(status) =>
                  setListing((previous) =>
                    previous && previous.status !== status
                      ? { ...previous, status }
                      : previous
                  )
                }
              />
            </>
          ) : !isOpen ? (
            myOffer?.is_winner ? (
              <div className="detail-action-card">
                <div className="detail-card-heading">
                  <CheckCircle2 size={20} />
                  <h2>Your offer was accepted</h2>
                </div>
                <p>
                  The seller chose your offer of{" "}
                  <strong>{formatPrice(myOffer.amount)}</strong>. Send them
                  a message to arrange the next steps.
                </p>
              </div>
            ) : (
              <div className="detail-action-card">
                <h2>Listing unavailable</h2>
                <p>
                  This listing is no longer accepting inquiries or offers.
                </p>
              </div>
            )
          ) : (
            <>
              <div className="detail-action-card">
                <div className="detail-card-heading">
                  <MessageCircle size={19} />
                  <h2>Ask the seller</h2>
                </div>

                <p>
                  Have a question about this item? Send the seller
                  a message.
                </p>

                <form onSubmit={handleInquirySubmit}>
                  <label htmlFor="inquiry-message">
                    Your message
                  </label>

                  <textarea
                    id="inquiry-message"
                    value={inquiryMessage}
                    onChange={(event) =>
                      setInquiryMessage(event.target.value)
                    }
                    placeholder="Hi, is this item still available?"
                    rows={4}
                    required
                  />

                  <button
                    type="submit"
                    className="detail-submit-button"
                    disabled={sendingInquiry}
                  >
                    <Send size={16} />
                    {sendingInquiry ? "Sending..." : "Send inquiry"}
                  </button>
                </form>
              </div>

              <div className="detail-action-card offer-card" id="offer-card">
                <div className="detail-card-heading">
                  <HandCoins size={20} />
                  <h2>Make an offer</h2>
                </div>

                <p>
                  Interested in the item? Submit a private offer to the
                  seller.
                </p>

                {offerLoading ? (
                  <p className="detail-muted">Checking your offer...</p>
                ) : myOffer ? (
                  <div className="existing-offer">
                    <span>Your latest offer</span>
                    <strong>{formatPrice(myOffer.amount)}</strong>
                    {myOffer.is_winner && (
                      <span className="offer-status">You won this offer</span>
                    )}
                  </div>
                ) : null}

                {offersClosed ? (
                  <p className="offers-closed-note" role="status">
                    <Clock3 size={16} aria-hidden="true" />
                    The offer deadline has passed, so new offers can no
                    longer be submitted. You can still message the seller.
                  </p>
                ) : (
                <form onSubmit={handleOfferSubmit}>
                  <label htmlFor="offer-amount">
                    Your offer (KES)
                  </label>

                  <input
                    id="offer-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={offerAmount}
                    onChange={(event) =>
                      setOfferAmount(event.target.value)
                    }
                    placeholder="Enter your offer"
                    required
                  />

                  <label htmlFor="offer-message">
                    Message (optional)
                  </label>

                  <textarea
                    id="offer-message"
                    value={offerMessage}
                    onChange={(event) =>
                      setOfferMessage(event.target.value)
                    }
                    placeholder="Add a message to your offer..."
                    rows={3}
                  />

                  <button
                    type="submit"
                    className="detail-submit-button"
                    disabled={sendingOffer}
                  >
                    <HandCoins size={16} />
                    {sendingOffer ? "Submitting..." : "Submit offer"}
                  </button>
                </form>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}

export default ListingDetails;