import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Gavel, LoaderCircle, Tag } from "lucide-react";

import {
  closeListingAuction,
  getListingOffers,
  getMyOffer,
  submitOffer,
} from "../services/offers";
import "../styles/offers.css";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formatMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { style: "currency", currency: "USD" })
    : "—";
}

export default function Offers({
  listingId,
  listing = null,
  listingOwnerId = listing?.user_id ?? null,
  currentUser = null,
  currentUserId = currentUser?.id ?? null,
}) {
  const [offers, setOffers] = useState([]);
  const [myOffer, setMyOffer] = useState(null);
  const [listingStatus, setListingStatus] = useState(listing?.status || "active");
  const [isOutbid, setIsOutbid] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const ownerView = Boolean(
    listingId &&
      currentUserId != null &&
      listingOwnerId != null &&
      Number(currentUserId) === Number(listingOwnerId)
  );

  const refreshOffers = useCallback(async () => {
    if (!listingId) {
      setLoading(false);
      setError("A listing is required to view offers.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (ownerView) {
        const data = await getListingOffers(listingId);
        setOffers(data.offers || []);
        setListingStatus(data.status || "active");
      } else {
        const data = await getMyOffer(listingId);
        setMyOffer(data.offer || null);
        setIsOutbid(Boolean(data.is_outbid));
        setListingStatus(data.listing_status || listing?.status || "active");
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to load offer information.");
    } finally {
      setLoading(false);
    }
  }, [listingId, listing?.status, ownerView]);

  useEffect(() => {
    refreshOffers();
  }, [refreshOffers]);

  async function handleSubmit(event) {
    event.preventEvent?.();
    event.preventDefault();

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter an offer amount greater than zero.");
      setSuccess("");
      return;
    }

    setActing(true);
    setError("");
    setSuccess("");

    try {
      await submitOffer(listingId, numericAmount, message.trim());
      setAmount("");
      setMessage("");
      setSuccess("Your offer was submitted.");
      await refreshOffers();
    } catch (requestError) {
      setError(requestError.message || "Unable to submit your offer.");
    } finally {
      setActing(false);
    }
  }

  async function handleClose() {
    setActing(true);
    setError("");
    setSuccess("");

    try {
      await closeListingAuction(listingId);
      setSuccess("The auction was closed.");
      await refreshOffers();
    } catch (requestError) {
      setError(requestError.message || "Unable to close the auction.");
    } finally {
      setActing(false);
    }
  }

  const closed = listingStatus !== "active";

  return (
    <section className="offers-panel" aria-label="Offers">
      {error && (
        <div className="offers-message offers-error" role="alert">
          <AlertCircle size={17} /> {error}
        </div>
      )}

      {success && (
        <div className="offers-message offers-success" role="status">
          <CheckCircle2 size={17} /> {success}
        </div>
      )}

      {loading ? (
        <div className="offers-loading" role="status">
          <LoaderCircle className="spin" size={20} /> Loading offers...
        </div>
      ) : ownerView ? (
        <>
          <div className="offers-header">
            <div>
              <span className="offers-eyebrow">OFFERS RECEIVED</span>
              <h2>Manage auction</h2>
            </div>
            <span className={`offers-status offers-status-${listingStatus}`}>
              {listingStatus}
            </span>
          </div>

          {offers.length === 0 ? (
            <div className="offers-empty">
              <Tag size={28} />
              <h3>No offers yet</h3>
              <p>Offers submitted for this listing will appear here.</p>
            </div>
          ) : (
            <div className="offers-list">
              {offers.map((offer) => (
                <article className="offer-card" key={offer.id}>
                  <div>
                    <span className="offer-buyer">Buyer #{offer.buyer_id}</span>
                    {formatDate(offer.created_at) && <time>{formatDate(offer.created_at)}</time>}
                  </div>
                  <strong>{formatMoney(offer.amount)}</strong>
                  {offer.message && <p>{offer.message}</p>}
                  {offer.is_winner && <span className="winner-badge">Winner</span>}
                </article>
              ))}
            </div>
          )}

          {!closed && (
            <button
              className="offers-close-button"
              type="button"
              onClick={handleClose}
              disabled={acting}
            >
              {acting ? <LoaderCircle className="spin" size={17} /> : <Gavel size={17} />}
              {acting ? "Closing..." : "Close auction"}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="offers-header">
            <div>
              <span class="offers-eyebrow">PRIVATE OFFER</span>
              <h2>{myOffer ? "Your offer" : "Make an offer"}</h2>
            </div>
            <span className={`offers-status offers-status-${listingStatus}`}>
              {listingStatus}
            </span>
          </div>

          {myOffer && (
            <div className="current-offer">
              <span>Current offer</span>
              <strong>{formatMoney(myOffer.amount)}</strong>
              {myOffer.message && <p>{myOffer.message}</p>}
              {isOutbid && <span className="outbid-badge">A higher offer has been submitted</span>}
              {myOffer.is_winner && <span className="winner-badge">Winning offer</span>}
            </div>
          )}

          {!closed ? (
            <form className="offer-form" onSubmit={handleSubmit}>
              <label htmlFor="offer-amount">Amount</label>
              <input
                id="offer-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                disabled={acting}
              />

              <label htmlFor="offer-message">Message <span>(optional)</span></label>
              <textarea
                id="offer-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Share pickup or payment details"
                maxLength={1000}
                disabled={acting}
              />

              <button className="offers-primary-button" type="submit" disabled={acting}>
                {acting ? <LoaderCircle className="spin" size={17} /> : <Tag size={17} />}
                {acting ? "Submitting..." : myOffer ? "Update offer" : "Submit offer"}
              </button>
            </form>
          ) : (
            <div className="offers-empty offers-closed">
              <Gavel size={28} />
              <h3>Auction closed</h3>
              <p>This listing no longer accepts offers.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
