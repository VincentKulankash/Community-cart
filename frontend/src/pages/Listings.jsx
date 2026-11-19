
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";

import ListingCard from "../components/ListingCard";
import { getListings } from "../services/listings";

function Listings({ onNavigate, savedItems = [], onToggleSaved }) {
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

  return (
    <main className="marketplace-page">
      <section className="finds-section marketplace-section">
        <button
          type="button"
          className="marketplace-back"
          onClick={() => onNavigate("/")}
        >
          <ArrowLeft size={16} />
          Back to home
        </button>

        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              THE LOCAL MARKETPLACE
            </div>

            <h2>Find something good.</h2>

            <p>
              Discover things worth giving a second home.
            </p>
          </div>
        </div>

        <div className="marketplace-controls">
          <div className="marketplace-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search for something..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
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
            <p className="marketplace-count">
              {filteredListings.length}{" "}
              {filteredListings.length === 1 ? "find" : "finds"} available
            </p>

            {filteredListings.length > 0 ? (
              <div className="listing-grid">
                {filteredListings.map((listing, index) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    index={index}
                    isSaved={savedItems.includes(listing.id)}
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
