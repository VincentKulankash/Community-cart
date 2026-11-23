import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import UndergroundProductCard from "../components/UndergroundProductCard";
import UndergroundProductModal from "../components/UndergroundProductModal";
import { getImageProxyUrl } from "../utils/productImage";
import {
  getUndergroundCategories,
  getUndergroundProducts,
} from "../services/underground";

const PAGE_SIZE = 12;
const UNDERGROUND_TAGLINES = [
  "#UNDERGROUNDLIFE",
  "NO MAP. JUST MAIN QUEST ENERGY.",
  "MOVE QUIET. LEAVE A MARK.",
  "MAKE YOUR OWN LORE.",
  "NEXT LEVEL AFTER DARK.",
  "THE CITY IS YOUR PLAYGROUND.",
];

function createFilters() {
  return {
    q: "",
    category: "",
    min_price: "",
    max_price: "",
    availability: "",
    sort: "newest",
  };
}

export default function UndergroundHome({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(createFilters);
  const [searchText, setSearchText] = useState("");
  const [priceDraft, setPriceDraft] = useState({ min: "", max: "" });
  const [priceError, setPriceError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryAttempt, setCategoryAttempt] = useState(0);

  useEffect(() => {
    const targets = document.querySelectorAll("#underground-top [data-scroll-reveal]");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-revealed"));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [products.length, categories.length]);

  useEffect(() => {
    const controller = new AbortController();

    getUndergroundCategories({ signal: controller.signal })
      .then((result) => {
        setCategories(result.items);
        setCategoriesError("");
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setCategoriesError(requestError.message);
        }
      });

    return () => controller.abort();
  }, [categoryAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    getUndergroundProducts(
      { ...filters, page, per_page: PAGE_SIZE },
      { signal: controller.signal },
    )
      .then((result) => {
        setProducts((current) =>
          page === 1 ? result.items : [...current, ...result.items],
        );
        setPagination({ total: result.total, pages: result.pages });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filters, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const query = searchText.trim();
      setPage(1);
      setFilters((current) => current.q === query ? current : { ...current, q: query });
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [searchText]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyPriceFilter(event) {
    event.preventDefault();
    const min = priceDraft.min.trim();
    const max = priceDraft.max.trim();
    const minValue = min === "" ? null : Number(min);
    const maxValue = max === "" ? null : Number(max);

    if (
      (minValue !== null && (!Number.isFinite(minValue) || minValue < 0)) ||
      (maxValue !== null && (!Number.isFinite(maxValue) || maxValue < 0)) ||
      (minValue !== null && maxValue !== null && minValue > maxValue)
    ) {
      setPriceError("Enter valid non-negative prices, with the minimum below the maximum.");
      return;
    }

    setPriceError("");
    setPage(1);
    setFilters((current) => ({
      ...current,
      min_price: min,
      max_price: max,
    }));
  }

  function resetFilters() {
    setSearchText("");
    setPriceDraft({ min: "", max: "" });
    setPriceError("");
    setPage(1);
    setFilters(createFilters());
  }

  function scrollToFinds() {
    document.getElementById("underground-drops")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function moveHeroArt(event) {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const art = event.currentTarget.querySelector(".underground-hero-art");
    if (!art) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    art.style.setProperty("--pointer-x", `${x * 16}px`);
    art.style.setProperty("--pointer-y", `${y * 14}px`);
  }

  function resetHeroArt(event) {
    const art = event.currentTarget.querySelector(".underground-hero-art");
    art?.style.removeProperty("--pointer-x");
    art?.style.removeProperty("--pointer-y");
  }

  const hasActiveFilters = Boolean(
    filters.q ||
    filters.category ||
    filters.min_price ||
    filters.max_price ||
    filters.availability,
  );

  return (
    <div className="underground-app" id="underground-top">
      <header className="underground-topbar">
        <button
          className="underground-brand"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Underground home"
        >
          <span className="underground-brand-mark" aria-hidden="true">
            <span />
          </span>
          <span className="underground-brand-name">
            COMMUNITY CART <b>/</b> UNDERGROUND
          </span>
        </button>
        <nav className="underground-site-nav" aria-label="Underground navigation">
          <a href="#underground-drops">The drop</a>
          <a href="#underground-code">The code</a>
        </nav>
        <div className="underground-top-actions">
          <span className="underground-verified">
            <ShieldCheck size={15} aria-hidden="true" />
            18+ ACCESS CHECK
          </span>
          <button
            className="underground-exit"
            type="button"
            onClick={() => onNavigate("/")}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Community Cart
          </button>
        </div>
      </header>

      <main>
        <section
          className="underground-hero"
          data-scroll-reveal
          aria-labelledby="underground-hero-title"
          onPointerMove={moveHeroArt}
          onPointerLeave={resetHeroArt}
        >
          <div className="underground-hero-grid" aria-hidden="true" />
          <div className="underground-hero-copy">
            <p className="underground-kicker">
              <span className="underground-live-dot" />
              COMMUNITY CART / AFTER HOURS
            </p>
            <h1 id="underground-hero-title">
              BREAK
              <br />
              THE <em>GRID.</em>
            </h1>
            <p className="underground-hero-description">
              Wear it loud. Find the rare thing. Step into an after-hours mix
              of streetwear, analog culture, nightlife and adult style.
            </p>
            <div className="underground-hero-actions">
              <button
                className="underground-primary-button"
                type="button"
                onClick={scrollToFinds}
              >
                Explore the drop <ArrowRight size={17} aria-hidden="true" />
              </button>
              <a className="underground-text-link" href="#underground-code">
              Enter the catalogue <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
            <div className="underground-hero-footnote">
              <span>01</span>
              <span className="underground-hero-rule" />
              <span>CURATED FINDS · 18+ SPACE · NO CHECKOUT</span>
            </div>
          </div>

          <div className="underground-hero-art" aria-hidden="true">
            <div className="underground-collage-sheet underground-collage-sheet-back" />
            <div className="underground-collage-sheet underground-collage-sheet-front">
              <img
                src="https://images.unsplash.com/photo-1644508047668-9210042f8eaa?fm=jpg&ixlib=rb-4.1.0&q=82&w=1500"
                alt=""
                onError={(event) => {
                  if (!event.currentTarget.dataset.proxyAttempted) {
                    event.currentTarget.dataset.proxyAttempted = "true";
                    event.currentTarget.src = getImageProxyUrl(event.currentTarget.src);
                  } else {
                    event.currentTarget.hidden = true;
                  }
                }}
              />
              <span className="underground-collage-caption">ANCIENT FORM / NEW FREQUENCY</span>
            </div>
            <div className="underground-collage-tape underground-collage-tape-one" />
            <div className="underground-collage-tape underground-collage-tape-two" />
            <span className="underground-graffiti-word">NO<br />RULES</span>
            <svg className="underground-graffiti-mark" viewBox="0 0 260 150" fill="none">
              <path d="M18 100C59 28 83 121 123 61C150 19 174 23 181 57C190 101 215 79 243 33M29 128C66 94 87 137 126 100C160 68 193 118 233 91" />
              <path d="M185 20l12 24 26-3-18 20 12 22-27-13-18 18 5-27-24-13 28-3z" />
            </svg>
            <span className="underground-art-coordinate">CC—UG / 001</span>
            <span className="underground-art-caption">BREAK THE FRAME</span>
          </div>
          <div className="underground-hero-side-label" aria-hidden="true">
            UNDERGROUND / AGE-RESTRICTED ACCESS
          </div>
        </section>

        <div className="underground-ticker underground-category-band" aria-label="Underground taglines">
          <div className="underground-island-track" aria-label="Underground taglines">
            <div className="underground-island-marquee">
              {[0, 1].map((group) => (
                <div className="underground-tagline-loop" key={group} aria-hidden={group === 1}>
                  {UNDERGROUND_TAGLINES.map((tagline) => (
                    <span className="underground-tagline-item" key={`${group}-${tagline}`}>
                      <i aria-hidden="true">✳</i>{tagline}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="underground-drops" id="underground-drops" data-scroll-reveal aria-labelledby="underground-drops-title">
          <div className="underground-section-heading" data-scroll-reveal>
            <div>
              <p className="underground-section-index">SELECTED FINDS / 001</p>
              <h2 id="underground-drops-title">Finds that <em>break through.</em></h2>
              <p className="underground-section-intro">
                Streetwear, analog treasures, night plans and age-gated goods.
              </p>
            </div>
            <div className="underground-total">
              <span>{loading && products.length === 0 ? "—" : pagination.total}</span>
              <small>FINDS IN THE DROP</small>
            </div>
          </div>

          <div className="underground-toolbar">
            <label className="underground-search">
              <Search size={17} aria-hidden="true" />
              <span className="sr-only">Search Underground products</span>
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search the Underground..."
              />
              {searchText && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchText("")}
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <label className="underground-sort">
              <SlidersHorizontal size={15} aria-hidden="true" />
              <span className="sr-only">Sort products</span>
              <select
                value={filters.sort}
                onChange={(event) => updateFilter("sort", event.target.value)}
              >
                <option value="newest">Latest finds</option>
                <option value="rating">Top rated</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </label>
          </div>

          <div className="underground-category-row">
            <div
              className="underground-categories"
              role="group"
              aria-label="Filter by category"
            >
              <button
                className={!filters.category ? "underground-category-chip is-active" : "underground-category-chip"}
                type="button"
                aria-pressed={!filters.category}
                onClick={() => updateFilter("category", "")}
              >
                All finds
              </button>
              {categories.map((category) => (
                <button
                  className={filters.category === category ? "underground-category-chip is-active" : "underground-category-chip"}
                  type="button"
                  key={category}
                  aria-pressed={filters.category === category}
                  onClick={() => updateFilter("category", category)}
                >
                  {category}
                </button>
              ))}
            </div>
            {categoriesError && (
              <button
                className="underground-retry-inline"
                type="button"
                onClick={() => setCategoryAttempt((current) => current + 1)}
              >
                Categories unavailable · Retry
              </button>
            )}
          </div>

          <div className="underground-filter-panel">
            <form className="underground-price-filter" onSubmit={applyPriceFilter}>
              <span className="underground-filter-label">PRICE RANGE (KES)</span>
              <label>
                <span className="sr-only">Minimum price</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={priceDraft.min}
                  onChange={(event) => setPriceDraft((current) => ({ ...current, min: event.target.value }))}
                  placeholder="Min"
                />
              </label>
              <span className="underground-price-divider">—</span>
              <label>
                <span className="sr-only">Maximum price</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={priceDraft.max}
                  onChange={(event) => setPriceDraft((current) => ({ ...current, max: event.target.value }))}
                  placeholder="Max"
                />
              </label>
              <button className="underground-apply-filter" type="submit">Apply</button>
            </form>
            <label className="underground-available-filter">
              <input
                type="checkbox"
                checked={filters.availability === "true"}
                onChange={(event) => updateFilter("availability", event.target.checked ? "true" : "")}
              />
              <span className="underground-checkmark"><Check size={12} aria-hidden="true" /></span>
              Available only
            </label>
            {hasActiveFilters && (
              <button className="underground-reset" type="button" onClick={resetFilters}>
                Reset filters <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>
          {priceError && <p className="underground-filter-error" role="alert">{priceError}</p>}

          {loading && products.length === 0 ? (
            <div className="underground-products-grid" aria-label="Loading Underground products" aria-busy="true">
              {Array.from({ length: 8 }, (_, index) => (
                <div className="underground-product-skeleton" key={index}>
                  <span />
                  <i />
                  <b />
                </div>
              ))}
            </div>
          ) : error && products.length === 0 ? (
            <div className="underground-state-card" role="alert">
              <div className="underground-state-mark"><X size={20} /></div>
              <p className="underground-section-index">SIGNAL INTERRUPTED</p>
              <h3>The drop is out of reach.</h3>
              <p>{error}</p>
              <button
                className="underground-primary-button"
                type="button"
                onClick={() => {
                  setPage(1);
                  setFilters((current) => ({ ...current }));
                }}
              >
                Try again <ArrowRight size={16} />
              </button>
            </div>
          ) : error ? (
            <p className="underground-inline-error" role="alert">{error}</p>
          ) : products.length > 0 ? (
            <div className="underground-products-grid">
              {products.map((product, index) => (
                <UndergroundProductCard
                  key={product.id}
                  product={product}
                  layoutIndex={index}
                  onSelect={setSelectedProduct}
                  revealDelay={index % PAGE_SIZE}
                />
              ))}
            </div>
          ) : (
            <div className="underground-state-card underground-empty-state">
              <div className="underground-state-mark"><Search size={20} /></div>
              <p className="underground-section-index">NO MATCHES / YET</p>
              <h3>Nothing on this frequency.</h3>
              <p>
                {hasActiveFilters
                  ? "Try changing the search or clearing a filter to find another signal."
                  : "The catalogue is quiet for now. Check back when new finds arrive."}
              </p>
              {hasActiveFilters && (
                <button className="underground-text-button" type="button" onClick={resetFilters}>
                  Clear all filters <ArrowRight size={15} />
                </button>
              )}
            </div>
          )}

          {page < pagination.pages && !error && (
            <div className="underground-load-more">
              <button
                className="underground-more-button"
                type="button"
                disabled={loading}
                onClick={() => setPage((current) => current + 1)}
              >
                {loading ? "Tuning in…" : "Load more finds"}
                <ArrowDown size={16} aria-hidden="true" />
              </button>
              <span>{products.length} OF {pagination.total} FINDS</span>
            </div>
          )}
        </section>

        <section className="underground-code" id="underground-code" data-scroll-reveal aria-labelledby="underground-code-title">
          <div className="underground-code-symbol" aria-hidden="true">
            <span>U</span>
          </div>
          <div className="underground-code-copy">
              <p className="underground-section-index">NO ALGORITHM / JUST TASTE</p>
              <h2 id="underground-code-title">Style is a signal.<br /><em>Make noise.</em></h2>
            <p>
              Underground is a visual catalogue for alternative culture, adult
              style and late-night discoveries. Listings are concept previews;
              confirm stock, prices and bookings directly with each seller.
            </p>
          </div>
          <div className="underground-code-stamp">
            <ShieldCheck size={18} />
            <span>CATALOGUE<br />PREVIEW</span>
          </div>
        </section>
      </main>

      <footer className="underground-footer" data-scroll-reveal>
        <button className="underground-brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="underground-brand-mark" aria-hidden="true"><span /></span>
          <span className="underground-brand-name">COMMUNITY CART <b>/</b> UNDERGROUND</span>
        </button>
        <span>CATALOGUE PREVIEW · NO CHECKOUT</span>
        <button className="underground-footer-link" type="button" onClick={() => onNavigate("/")}>
          Back to Community Cart <ArrowUpRight size={14} />
        </button>
      </footer>

      {selectedProduct && (
        <UndergroundProductModal
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
