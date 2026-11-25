import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import BackButton from "../components/BackButton";
import ErrorState from "../components/ErrorState";
import Pagination from "../components/Pagination";
import ListingCard from "../components/ListingCard";
import { getListings } from "../services/listings";
import { normalizePage } from "../services/pagination";
import { isOpenStatus } from "../utils/listings";

const PER_PAGE = 12;
const ALL = "All categories";

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function mergeCategories(previous, items) {
  const set = new Set(previous);
  items.forEach((item) => {
    if (item?.category) set.add(item.category);
  });
  return [...set].sort((a, b) => a.localeCompare(b));
}

function Listings({ onNavigate, onBack, savedItems = [], onToggleSaved }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const debouncedSearch = useDebounced(search.trim(), 350);

  // The page number resets to 1 automatically whenever the filters change.
  const filtersKey = `${debouncedSearch}|${category}`;
  const [pageState, setPageState] = useState({ key: filtersKey, page: 1 });
  const page = pageState.key === filtersKey ? pageState.page : 1;

  const [result, setResult] = useState(null);
  const [knownCategories, setKnownCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const sectionRef = useRef(null);

  // Category chips come from an unfiltered request, so they stay visible
  // while a category or search is active.
  useEffect(() => {
    let cancelled = false;

    getListings({ per_page: 100 })
      .then((data) => {
        if (cancelled) return;
        setKnownCategories((prev) =>
          mergeCategories(prev, normalizePage(data).items)
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadListings() {
      setLoading(true);
      setError(null);

      try {
        const data = await getListings({
          page,
          per_page: PER_PAGE,
          q: debouncedSearch,
          category: category === ALL ? "" : category,
        });

        if (cancelled) return;

        const normalized = normalizePage(data);
        setResult(normalized);
        setKnownCategories((prev) => mergeCategories(prev, normalized.items));
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, category, reloadKey]);

  const categories = useMemo(
    () => [
      ALL,
      ...new Set([
        ...knownCategories,
        ...(category !== ALL ? [category] : []),
      ]),
    ],
    [knownCategories, category]
  );

  // Works with both response styles: a paginated object from the backend,
  // or a plain array that we slice into pages here.
  const view = useMemo(() => {
    if (!result) return { items: [], pages: 1, total: 0, page: 1 };

    const open = result.items.filter((listing) =>
      isOpenStatus(listing.status)
    );

    if (result.paginated) {
      return {
        items: open,
        pages: result.pages,
        total: result.total,
        page: result.page,
      };
    }

    const pages = Math.max(1, Math.ceil(open.length / PER_PAGE));
    const current = Math.min(page, pages);

    return {
      items: open.slice((current - 1) * PER_PAGE, current * PER_PAGE),
      pages,
      total: open.length,
      page: current,
    };
  }, [result, page]);

  const hasFilters = category !== ALL || search.trim() !== "";

  function clearFilters() {
    setSearch("");
    setCategory(ALL);
  }

  function handlePageChange(next) {
    setPageState({ key: filtersKey, page: next });
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const initialLoading = loading && !result;

  return (
    <main className="marketplace-page">
      <section
        className="finds-section marketplace-section"
        ref={sectionRef}
      >
        <BackButton onBack={onBack} fallback="/" className="marketplace-back" />

        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              The local marketplace
            </div>

            <h1>Find something good.</h1>

            <p>Discover things worth giving a second home.</p>
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

        {initialLoading && (
          <p className="finds-message" role="status">
            Loading marketplace listings...
          </p>
        )}

        {!loading && error && (
          <ErrorState
            error={error}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        )}

        {!error && result && (
          <>
            <div className="marketplace-results-bar">
              <p className="marketplace-count" role="status">
                {view.total} {view.total === 1 ? "find" : "finds"} available
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

            {view.items.length > 0 ? (
              <div className="listing-grid" aria-busy={loading}>
                {view.items.map((listing, index) => (
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
              !loading && (
                <p className="finds-message">
                  No listings match your search. Try another keyword or
                  category.
                </p>
              )
            )}

            <Pagination
              page={view.page}
              pages={view.pages}
              total={view.total}
              onPageChange={handlePageChange}
              disabled={loading}
            />
          </>
        )}
      </section>
    </main>
  );
}

export default Listings;
