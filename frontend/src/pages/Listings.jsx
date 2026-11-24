import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import BackButton from "../components/BackButton";

import ListingCard from "../components/ListingCard";
import { getListings } from "../services/listings";

function Listings({ onNavigate, onBack, savedItems = [], onToggleSaved }) {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
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
          throw new Error("Unexpected response from the server.");
        }

        if (isMounted) {
          setListings(
            data.filter((listing) => listing.status === "active")
          );
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

  const categories = useMemo(
    () => [
      "All categories",
      ...new Set(
        listings.map((listing) => listing.category).filter(Boolean)
      ),
    ],
    [listings]
  );

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesCategory =
        category === "All categories" ||
        listing.category === category;

      const matchesSearch =
        !query ||
        [
          listing.title,
          listing.description,
          listing.location,
          listing.category,
        ].some((value) => value?.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [listings, search, category]);

  const hasFilters = category !== "All categories" || search.trim() !== "";

  function clearFilters() {
    setSearch("");
    setCategory("All categories");
  }

  return (
    <main className="marketplace-page">
      <section className="finds-section marketplace-section">
        <BackButton onBack={onBack} fallback="/" className="marketplace-back" />

        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              The local marketplace
            </div>

            <h1>Find something good.</h1>

            <p>
              Discover things worth giving a second home.
            </p>
          </div>
        </div>

        <div className="marketplace-controls">
          <div className="marketplace-search">
            <Search size={18} aria-hidden="true" />

            <input
              type="search"
              placeholder="Search for something..."
              aria-label="Search listings"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div
            className="category-chips"
            role="group"
            aria-label="Filter by category"
          >
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={item === category ? "chip selected" : "chip"}
                aria-pressed={item === category}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <p className="finds-message" role="status">
            Loading marketplace listings...
          </p>
        )}

        {!loading && error && (
          <p className="finds-message finds-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="marketplace-results-bar">
              <p className="marketplace-count" role="status">
                {filteredListings.length}{" "}
                {filteredListings.length === 1 ? "find" : "finds"} available
              </p>

              {hasFilters && (
                <button
                  type="button"
                  className="marketplace-clear"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>

            {filteredListings.length > 0 ? (
              <div className="listing-grid">
                {filteredListings.map((listing, index) => (
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
            ) : (
              <p className="finds-message">
                No listings match your search. Try another keyword or
                category.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default Listings;