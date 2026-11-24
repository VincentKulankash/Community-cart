import { useEffect, useState } from "react";

import Hero from "../components/Hero";
import Manifesto from "../components/Manifesto";
import SellStrip from "../components/SellStrip";
import ListingCard from "../components/ListingCard";
import { getListings } from "../services/listings";

const HOMEPAGE_LISTING_LIMIT = 8;

function Home({
  onShowAllFinds,
  onCreateListing,
  onNavigate,
  savedItems = [],
  onToggleSaved,
}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadListings() {
      try {
        setLoading(true);
        setError("");

        const data = await getListings();

        if (!Array.isArray(data)) {
          throw new Error("Unexpected response from the listings server.");
        }

        if (isMounted) {
          setListings(data.filter((listing) => listing.status === "active"));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load listings.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayedListings = listings.slice(0, HOMEPAGE_LISTING_LIMIT);

  // Prefer listings that have a photo for the hero collage.
  const featured = [
    ...listings.filter((listing) => listing.image_url),
    ...listings.filter((listing) => !listing.image_url),
  ].slice(0, 3);

  return (
    <main>
      <Hero
        onShowAllFinds={onShowAllFinds}
        onCreateListing={onCreateListing}
        featured={featured}
      />

      <section
        className="finds-section"
        id="finds"
        aria-labelledby="finds-title"
      >
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> Around the corner
            </div>

            <h2 id="finds-title">A few good finds.</h2>

            <p>One person's maybe is another person's absolutely.</p>
          </div>
        </div>

        {loading && (
          <p className="finds-message" role="status">
            Finding good things near you...
          </p>
        )}

        {!loading && error && (
          <p className="finds-message finds-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && listings.length === 0 && (
          <p className="finds-message">
            No active listings available right now. Check back soon!
          </p>
        )}

        {!loading && !error && listings.length > 0 && (
          <>
            <div className="listing-grid">
              {displayedListings.map((listing, index) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={index}
                  isSaved={savedItems.includes(Number(listing.id))}
                  onToggleSaved={onToggleSaved}
                  onQuickView={(selectedListing) =>
                    onNavigate(`/listings/${selectedListing.id}`)
                  }
                />
              ))}
            </div>

            {listings.length > HOMEPAGE_LISTING_LIMIT && (
              <div className="finds-more">
                <button
                  type="button"
                  className="finds-more-button"
                  onClick={onShowAllFinds}
                >
                  Show more finds
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Manifesto onShowAllFinds={onShowAllFinds} />

      <SellStrip onCreateListing={onCreateListing} />
    </main>
  );
}

export default Home;