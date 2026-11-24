import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Crown,
  HandCoins,
  LoaderCircle,
} from "lucide-react";

import { markListingAsSold } from "../services/listings";
import { getListingOffers } from "../services/offers";
import { parseServerDate } from "../utils/dates";
import "../styles/offer-manager.css";

function formatPrice(price) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function formatWhen(value) {
  const date = parseServerDate(value);
  return date
    ? date.toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
}

/*
 * The API keeps every offer a buyer has ever made (a new offer replaces
 * the old one). The seller only needs each buyer's current offer, so keep
 * the winning one if there is one, otherwise the most recent.
 */
function currentOfferPerBuyer(offers) {
  const byBuyer = new Map();

  offers.forEach((offer) => {
    const existing = byBuyer.get(offer.buyer_id);
    const time = parseServerDate(offer.created_at)?.getTime() || 0;
    const existingTime = existing
      ? parseServerDate(existing.created_at)?.getTime() || 0
      : 0;

    if (
      !existing ||
      offer.is_winner ||
      (!existing.is_winner && time > existingTime)
    ) {
      byBuyer.set(offer.buyer_id, offer);
    }
  });

  return [...byBuyer.values()].sort(
    (a, b) =>
      Number(b.amount) - Number(a.amount) ||
      (parseServerDate(a.created_at)?.getTime() || 0) -
        (parseServerDate(b.created_at)?.getTime() || 0)
  );
}

/*
 * Seller view of the offers on one listing: see every buyer's offer and
 * choose which one to proceed with.
 */
function OfferManager({ listing, onStatusChange, onNotify, onNavigate }) {
  const [offers, setOffers] = useState([]);
  const [status, setStatus] = useState(listing.status);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);

  const cancelRef = useRef(null);
  const statusCallbackRef = useRef(onStatusChange);
  statusCallbackRef.current = onStatusChange;

  const listingId = listing.id;

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await getListingOffers(listingId);

      setOffers(currentOfferPerBuyer(data?.offers || []));

      if (data?.status) {
        setStatus(data.status);
        statusCallbackRef.current?.(data.status);
      }
    } catch (err) {
      setError(err.message || "Unable to load offers.");
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Confirm dialog: focus the safe action and close on Escape.
  useEffect(() => {
    if (!pending) return undefined;

    cancelRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !busy) setPending(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pending, busy]);

  async function confirmPending() {
    if (!pending) return;

    try {
      setBusy(true);

      if (pending.type === "accept") {
        // The seller's pick, not necessarily the highest offer.
        await markListingAsSold(listingId, pending.offer.id);
        onNotify?.(`Sold to ${pending.offer.buyer_name || "the buyer"} for ${formatPrice(pending.offer.amount)}`);
      } else {
        // Sold outside the app: no buyer from the offers list.
        await markListingAsSold(listingId);
        onNotify?.("Listing marked as sold");
      }

      await load();
    } catch (err) {
      onNotify?.(err.message || "Something went wrong");
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  const isOpen = status === "active" || status === "open_for_offers";
  const isAwaiting = status === "awaiting_decision";
  const isSold = status === "sold";
  const canDecide = isOpen || isAwaiting;
  const highestId = offers[0]?.id;

  return (
    <div className="detail-action-card offer-manager">
      <div className="detail-card-heading">
        <HandCoins size={20} aria-hidden="true" />
        <h2>Offers received</h2>
      </div>

      {loading ? (
        <p className="detail-muted" role="status">
          <LoaderCircle size={15} className="om-spin" aria-hidden="true" /> Loading offers...
        </p>
      ) : error ? (
        <p className="om-error" role="alert">{error}</p>
      ) : offers.length === 0 ? (
        <p className="detail-muted">
          {status === "closed"
            ? "Bidding ended with no offers."
            : "No offers yet. Buyers' private offers will show up here."}
        </p>
      ) : (
        <>
          <p className="om-summary">
            {offers.length} {offers.length === 1 ? "buyer has" : "buyers have"} made an
            offer. {isSold
              ? "You have chosen an offer. You can still switch to a different one."
              : isAwaiting
              ? "The deadline has passed. Choose the offer you want. It does not have to be the highest."
              : "Choose any offer you like, or wait for more. It does not have to be the highest."}
          </p>

          {isAwaiting && (
            <button
              type="button"
              className="om-secondary"
              onClick={() => onNavigate?.(`/listings/${listingId}/edit`)}
            >
              <CalendarClock size={15} aria-hidden="true" /> Extend the deadline instead
            </button>
          )}

          <ul className="om-list">
            {offers.map((offer) => (
              <li
                key={offer.id}
                className={offer.is_winner ? "om-offer is-winner" : "om-offer"}
              >
                <div className="om-offer-top">
                  <div className="om-who">
                    <strong>{offer.buyer_name || `Buyer #${offer.buyer_id}`}</strong>
                    <span>{formatWhen(offer.created_at)}</span>
                  </div>
                  <strong className="om-amount">{formatPrice(offer.amount)}</strong>
                </div>

                <div className="om-badges">
                  {offer.id === highestId && (
                    <span className="om-badge">
                      <Crown size={13} aria-hidden="true" /> Highest
                    </span>
                  )}
                  {offer.is_winner && (
                    <span className="om-badge om-badge-ok">
                      <CheckCircle2 size={13} aria-hidden="true" /> Accepted
                    </span>
                  )}
                </div>

                {offer.message && <p className="om-message">“{offer.message}”</p>}

                {!offer.is_winner && status !== "closed" && (
                  <button
                    type="button"
                    className="om-accept"
                    onClick={() => setPending({ type: "accept", offer })}
                  >
                    {isSold ? "Choose this instead" : "Accept this offer"}
                  </button>
                )}
              </li>
            ))}
          </ul>

        </>
      )}

      {!loading && !error && canDecide && (
        <button
          type="button"
          className="om-close-bidding"
          onClick={() => setPending({ type: "elsewhere" })}
        >
          <CheckCircle2 size={15} aria-hidden="true" /> It sold outside the app
        </button>
      )}

      {pending && (
        <div
          className="modal-backdrop"
          onClick={() => !busy && setPending(null)}
        >
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="om-dialog-title"
            aria-describedby="om-dialog-desc"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="om-dialog-title">
              {pending.type === "accept" ? "Sell to this buyer?" : "Mark as sold?"}
            </h2>
            <p id="om-dialog-desc">
              {pending.type === "accept"
                ? `${pending.offer.buyer_name || "This buyer"} offered ${formatPrice(
                    pending.offer.amount
                  )}. The listing will be marked as sold to them and other buyers can no longer make offers.`
                : "The listing will be marked as sold without choosing a buyer from the offers. Other buyers can no longer make offers."}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                ref={cancelRef}
                onClick={() => setPending(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-confirm"
                onClick={confirmPending}
                disabled={busy}
              >
                {busy
                  ? "Working..."
                  : pending.type === "accept"
                  ? "Accept offer"
                  : "Mark as sold"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfferManager;