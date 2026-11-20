
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Heart, LoaderCircle, Search } from "lucide-react";

import ListingCard from "../components/ListingCard";
import { getListings } from "../services/listings";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../services/favorites";

import "../styles/favorites.css";

export default function Favorites({
  currentUser,
  onNavigate,
  onSavedItemsChange,
}) {
  const [favorites, setFavorites] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyIds, setBusyIds] = useState([]);

  /*
   * Load favourites and available listings from the backend.
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [favoriteData, listingData] = await Promise.all([
        getFavorites(),
        getListings(),
      ]);

      const loadedFavorites = Array.isArray(favoriteData.favorites)
        ? favoriteData.favorites
        : [];

      setFavorites(loadedFavorites);

      // Synchronize saved listing IDs with App.jsx.
      onSavedItemsChange?.(
        loadedFavorites
          .map((favorite) => Number(favorite.listing_id))
          .filter((id) => Number.isFinite(id))
      );

      setListings(Array.isArray(listingData) ? listingData : []);
    } catch (err) {
      setError(err.message || "Unable to load your favourites.");
    } finally {
      setLoading(false);
    }
  }, [onSavedItemsChange]);

  /*
   * Load data when the authenticated user changes.
   */
  useEffect(() => {
    if (currentUser) {
      loadData();
    } else {
      setFavorites([]);
      setListings([]);
      setLoading(false);
      onSavedItemsChange?.([]);
    }
  }, [currentUser, loadData, onSavedItemsChange]);

  /*
   * Create a set of saved listing IDs for quick lookup.
   */
  const favoriteIds = new Set(
    favorites.map((favorite) => Number(favorite.listing_id))
  );

  /*
   * Add or remove a listing from the database favourites.
   */
  async function handleFavoriteToggle(listing) {
    const listingId = Number(listing.id);

    if (!Number.isInteger(listingId) || busyIds.includes(listingId)) {
      return;
    }

    setActionError("");
    setBusyIds((current) => [...current, listingId]);

    try {
      if (favoriteIds.has(listingId)) {
        await removeFavorite(listingId);
      } else {
        await addFavorite(listingId);
      }

      // Reload from the database and synchronize the Navbar count.
      await loadData();
    } catch (err) {
      setActionError(
        err.message || "Unable to update favourites."
      );
    } finally {
      setBusyIds((current) =>
        current.filter((id) => id !== listingId)
      );
    }
  }

  /*
   * Navigate to the selected listing.
   */
  function handleQuickView(listing) {
    onNavigate(`/listings/${listing.id}`);
  }

  /*
   * Handle users who are not signed in.
   */
  if (!currentUser) {
    return (
      <main className="favorites-page">
        <section className="favorites-message">
          <Heart size={38} />

          <h1>Your favourites belong here.</h1>

          <p>
            Please sign in to view and manage your saved listings.
          </p>

          <button
            type="button"
            onClick={() => onNavigate("/login")}
          >
            Sign in
          </button>

          <button
            className="favorites-back-button"
            type="button"
            onClick={() => onNavigate("/")}
          >
            Back to LocalLoop
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="favorites-page">
      <div className="favorites-container">

        <button
          className="favorites-back-link"
          type="button"
          onClick={() => onNavigate("/")}
        >
          <ArrowLeft size={17} />
          Back to exploring
        </button>

        <header className="favorites-heading">
          <span className="favorites-eyebrow">
            YOUR PERSONAL COLLECTION
          </span>

          <h1>
            Things you <em>love.</em>
          </h1>

          <p>
            Keep the good finds close. Your favourites are saved to your
            account, wherever you sign in.
          </p>
        </header>

        {actionError && (
          <div className="favorites-error" role="alert">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="favorites-loading" role="status">
            <LoaderCircle
              className="favorites-spinner"
              size={30}
            />

            <p>Loading your favourites...</p>
          </div>
        ) : error ? (
          <section className="favorites-message">
            <h2>We couldn't load your favourites.</h2>

            <p>{error}</p>

            <button
              type="button"
              onClick={loadData}
            >
              Try again
            </button>
          </section>
        ) : (
          <>
            {/* Saved favourites */}
            <section className="favorites-section">
              <div className="favorites-section-heading">
                <div>
                  <span className="favorites-eyebrow">
                    SAVED FOR LATER
                  </span>

                  <h2>Your favourites</h2>
                </div>

                <span className="favorites-count">
                  {favorites.length} saved
                </span>
              </div>

              {favorites.some((favorite) => favorite.listing) ? (
                <div className="favorites-grid">
                  {favorites
                    .filter((favorite) => favorite.listing)
                    .map((favorite, index) => (
                      <ListingCard
                        key={favorite.id}
                        listing={favorite.listing}
                        index={index}
                        isSaved={true}
                        onToggleSaved={handleFavoriteToggle}
                        onQuickView={handleQuickView}
                      />
                    ))}
                </div>
              ) : (
                <div className="favorites-empty">
                  <Heart size={32} />

                  <h3>No favourites yet.</h3>

                  <p>
                    Explore the listings below and tap the heart on
                    anything you would like to save.
                  </p>
                </div>
              )}
            </section>

            {/* Discover other listings */}
            <section className="favorites-section discover-section">
              <div className="favorites-section-heading">
                <div>
                  <span className="favorites-eyebrow">
                    FIND SOMETHING GOOD
                  </span>

                  <h2>Explore listings</h2>
                </div>

                <Search size={22} />
              </div>

              {listings.filter(
                (listing) =>
                  listing.status === "active" &&
                  !favoriteIds.has(Number(listing.id))
              ).length > 0 ? (
                <div className="favorites-grid">
                  {listings
                    .filter(
                      (listing) =>
                        listing.status === "active" &&
                        !favoriteIds.has(Number(listing.id))
                    )
                    .map((listing, index) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        index={index}
                        isSaved={false}
                        onToggleSaved={handleFavoriteToggle}
                        onQuickView={handleQuickView}
                      />
                    ))}
                </div>
              ) : (
                <div className="favorites-empty">
                  <p>
                    There are no other active listings to explore right now.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
