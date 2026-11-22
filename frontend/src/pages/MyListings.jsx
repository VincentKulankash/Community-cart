import { useEffect, useState } from "react";
import { ArrowLeft, Edit3, Plus, Trash2 } from "lucide-react";
import { deleteListing, getMyListings } from "../services/listings";
import "../styles/listing-forms.css";

function formatPrice(price) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function MyListings({ currentUser, onNavigate, onNotify }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

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

  async function handleDelete(listing) {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;

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
    }
  }

  return (
    <main className="listing-form-page my-listings-page">
      <button type="button" className="listing-form-back" onClick={() => onNavigate("/")}>
        <ArrowLeft size={16} /> Back to home
      </button>

      <div className="my-listings-heading">
        <div>
          <p>YOUR ACCOUNT</p>
          <h1>My listings</h1>
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
              <div className="my-listing-image">
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.title} />
                ) : (
                  <span>No image</span>
                )}
              </div>
              <div className="my-listing-content">
                <div className="my-listing-meta">
                  <span>{listing.category}</span>
                  <span className={`listing-status-${listing.status}`}>{listing.status}</span>
                </div>
                <h2>{listing.title}</h2>
                <strong>{formatPrice(listing.price)}</strong>
                <p>{listing.location || "Location not specified"}</p>
                <div className="my-listing-actions">
                  <button
                    type="button"
                    onClick={() => onNavigate(`/listings/${listing.id}/edit`)}
                  >
                    <Edit3 size={15} /> Edit
                  </button>
                  <button
                    type="button"
                    className="my-listing-delete"
                    onClick={() => handleDelete(listing)}
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
    </main>
  );
}

export default MyListings;