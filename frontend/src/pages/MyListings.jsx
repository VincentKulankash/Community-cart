import { useEffect, useRef, useState } from "react";
import { Edit3, HandCoins, Plus, Trash2 } from "lucide-react";
import BackButton from "../components/BackButton";
import { deleteListing, getMyListings } from "../services/listings";
import "../styles/listing-forms.css";

function formatPrice(price) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function statusLabel(status) {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function MyListings({ currentUser, onNavigate, onNotify, onBack }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const cancelButtonRef = useRef(null);

  const currentUserId = currentUser?.id ?? null;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        if (currentUserId === null) {
          throw new Error("Sign in to see your listings.");
        }

        const data = await getMyListings();
        if (!mounted) return;

        setListings(
          Array.isArray(data)
            ? data.filter((listing) => Number(listing.user_id) === Number(currentUserId))
            : []
        );
      } catch (err) {
        if (mounted) {
          setListings([]);
          setError(err.message || "Unable to load your listings.");
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

  // Confirm dialog: focus the safe action and close on Escape.
  useEffect(() => {
    if (!pendingDelete) return undefined;

    cancelButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && deletingId === null) {
        setPendingDelete(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingDelete, deletingId]);

  async function confirmDelete() {
    const listing = pendingDelete;
    if (!listing) return;

    try {
      setDeletingId(listing.id);
      setError("");
      setSuccess("");
      await deleteListing(listing.id);
      setListings((previous) => previous.filter((item) => item.id !== listing.id));
      setSuccess("Listing deleted.");
      onNotify?.("Listing deleted");
    } catch (err) {
      setError(err.message || "Unable to delete the listing.");
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  return (
    <main className="listing-form-page my-listings-page">
      <BackButton onBack={onBack} fallback="/" className="listing-form-back" />

      <div className="my-listings-heading">
        <div>
          <p>YOUR ACCOUNT</p>
          <h1>My listings</h1>
          {!loading && !error && listings.length > 0 && (
            <span className="my-listings-count">
              {listings.length} {listings.length === 1 ? "listing" : "listings"}
            </span>
          )}
        </div>
        <button type="button" onClick={() => onNavigate("/create-listing")}>
          <Plus size={17} /> Create listing
        </button>
      </div>

      {loading && (
        <p className="listing-form-status" role="status">Loading your listings...</p>
      )}
      {!loading && success && (
        <p className="listing-form-alert listing-form-success" role="status">{success}</p>
      )}
      {!loading && error && (
        <p className="listing-form-alert listing-form-error" role="alert">{error}</p>
      )}
      {!loading && !error && listings.length === 0 && (
        <section className="listing-form-empty">
          <h2>No listings yet</h2>
          <p>Create your first listing and share it with the community.</p>
          <button type="button" onClick={() => onNavigate("/create-listing")}>
            <Plus size={17} /> Create a listing
          </button>
        </section>
      )}
      {!loading && !error && listings.length > 0 && (
        <div className="my-listings-grid">
          {listings.map((listing) => (
            <article className="my-listing-card" key={listing.id}>
              <a
                className="my-listing-image"
                href={`/listings/${listing.id}`}
                aria-label={`View ${listing.title}`}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(`/listings/${listing.id}`);
                }}
              >
                {listing.image_url ? (
                  <img src={listing.image_url} alt="" loading="lazy" />
                ) : (
                  <span>No photo</span>
                )}
              </a>
              <div className="my-listing-content">
                <div className="my-listing-meta">
                  <span>{listing.category}</span>
                  <span className={`listing-status-${listing.status}`}>
                    {statusLabel(listing.status)}
                  </span>
                </div>
                <h2>{listing.title}</h2>
                <strong>{formatPrice(listing.price)}</strong>
                <p>{listing.location || "Location not specified"}</p>
                <div className="my-listing-actions">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/listings/${listing.id}`)}
                  >
                    <HandCoins size={15} /> Offers
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/listings/${listing.id}/edit`)}
                  >
                    <Edit3 size={15} /> Edit
                  </button>
                  <button
                    type="button"
                    className="my-listing-delete"
                    onClick={() => setPendingDelete(listing)}
                    disabled={deletingId === listing.id}
                  >
                    <Trash2 size={15} />{" "}
                    {deletingId === listing.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {pendingDelete && (
        <div
          className="modal-backdrop"
          onClick={() => deletingId === null && setPendingDelete(null)}
        >
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-desc"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-title">Delete this listing?</h2>
            <p id="delete-desc">
              “{pendingDelete.title}” will be removed for good. This cannot
              be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                ref={cancelButtonRef}
                onClick={() => setPendingDelete(null)}
                disabled={deletingId !== null}
              >
                Keep listing
              </button>
              <button
                type="button"
                className="modal-danger"
                onClick={confirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? "Deleting..." : "Delete listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default MyListings;