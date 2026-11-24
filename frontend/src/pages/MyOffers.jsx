import { useEffect, useState } from "react";
import { HandCoins, ImageOff } from "lucide-react";

import AccountTabs from "../components/AccountTabs";
import BackButton from "../components/BackButton";
import { getMyOffers } from "../services/offers";
import { formatDeadline, parseServerDate, timeAgo } from "../utils/dates";
import "../styles/listing-forms.css";
import "../styles/account.css";

function formatPrice(price) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

const RESULTS = {
  leading: {
    label: "You're leading",
    tone: "ok",
    note: "Yours is the highest offer so far.",
  },
  outbid: {
    label: "Outbid",
    tone: "warn",
    note: "Another buyer has offered more. You can raise your offer.",
  },
  awaiting: {
    label: "Waiting for seller",
    tone: "info",
    note: "Offers are closed and the seller is choosing.",
  },
  won: {
    label: "Offer accepted",
    tone: "win",
    note: "The seller chose your offer. Message them to arrange the sale.",
  },
  not_selected: {
    label: "Not selected",
    tone: "muted",
    note: "The seller went with a different offer.",
  },
  closed: {
    label: "Closed",
    tone: "muted",
    note: "This listing closed without a sale.",
  },
};

const IN_PROGRESS = new Set(["leading", "outbid", "awaiting"]);

function OfferCard({ item, onNavigate }) {
  const { offer, listing, result } = item;
  const info = RESULTS[result] || RESULTS.closed;
  const deadline = parseServerDate(listing.offer_ends_at);
  const stillOpen = result === "leading" || result === "outbid";
  const href = `/listings/${listing.id}`;

  function go(event) {
    event.preventDefault();
    onNavigate(href);
  }

  return (
    <article className="acct-card">
      <a className="acct-thumb" href={href} onClick={go} aria-label={`View ${listing.title}`}>
        {listing.image_url ? (
          <img src={listing.image_url} alt="" loading="lazy" />
        ) : (
          <ImageOff size={24} aria-hidden="true" />
        )}
      </a>

      <div className="acct-body">
        <div className="acct-top">
          <h2>
            <a href={href} onClick={go}>{listing.title}</a>
          </h2>
          <span className={`acct-chip tone-${info.tone}`}>{info.label}</span>
        </div>

        <p className="acct-offer">
          Your offer <strong>{formatPrice(offer.amount)}</strong>
          <span> · asking {formatPrice(listing.price)}</span>
        </p>

        <p className="acct-meta">
          {listing.seller_name ? `Seller: ${listing.seller_name} · ` : ""}
          Offered {timeAgo(parseServerDate(offer.created_at))}
          {stillOpen && deadline ? ` · closes ${formatDeadline(deadline)}` : ""}
        </p>

        <p className="acct-note">{info.note}</p>

        <div className="acct-actions">
          <a className="acct-button" href={href} onClick={go}>
            {result === "outbid" || result === "leading"
              ? "Raise your offer"
              : result === "won"
              ? "Message the seller"
              : "View listing"}
          </a>
        </div>
      </div>
    </article>
  );
}

function MyOffers({ currentUser, onNavigate, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUserId = currentUser?.id ?? null;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        if (currentUserId === null) {
          throw new Error("Sign in to see your offers.");
        }

        const data = await getMyOffers();
        if (mounted) setItems(data?.offers || []);
      } catch (err) {
        if (mounted) {
          setItems([]);
          setError(err.message || "Unable to load your offers.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  const inProgress = items.filter((item) => IN_PROGRESS.has(item.result));
  const finished = items.filter((item) => !IN_PROGRESS.has(item.result));

  return (
    <main className="listing-form-page acct-page">
      <BackButton onBack={onBack} fallback="/" className="listing-form-back" />

      <div className="my-listings-heading">
        <div>
          <p>YOUR ACCOUNT</p>
          <h1>My offers</h1>
        </div>
      </div>

      <AccountTabs current="/my-offers" onNavigate={onNavigate} />

      {loading && <p className="listing-form-status" role="status">Loading your offers...</p>}

      {!loading && error && (
        <p className="listing-form-alert listing-form-error" role="alert">{error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <section className="listing-form-empty">
          <h2>No offers yet</h2>
          <p>Offers you make on listings will show up here, so you can follow how they are doing.</p>
          <button type="button" onClick={() => onNavigate("/listings")}>
            <HandCoins size={17} /> Browse listings
          </button>
        </section>
      )}

      {!loading && !error && inProgress.length > 0 && (
        <section aria-labelledby="offers-progress">
          <h2 className="acct-section" id="offers-progress">In progress · {inProgress.length}</h2>
          <div className="acct-list">
            {inProgress.map((item) => (
              <OfferCard key={item.offer.id} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && finished.length > 0 && (
        <section aria-labelledby="offers-finished">
          <h2 className="acct-section" id="offers-finished">Finished · {finished.length}</h2>
          <div className="acct-list">
            {finished.map((item) => (
              <OfferCard key={item.offer.id} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default MyOffers;