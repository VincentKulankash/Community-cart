<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  Leaf,
  LoaderCircle,
  MapPin,
  Menu,
  Search,
  Sparkles,
  X,
} from "lucide-react";

const demoListings = [
  {
    id: "local-1",
    title: "Lounge chair, teak & cane",
    category: "Home",
    price: 145,
    condition: "Like new",
    location: "Silver Lake",
    image:
      "https://images.unsplash.com/photo-1598300056393-4aac492f4344?auto=format&fit=crop&w=960&q=85",
    tint: "sand",
    note: "A little Sunday reading spot",
  },
  {
    id: "local-2",
    title: "35mm film camera",
    category: "Tech",
    price: 88,
    condition: "Good",
    location: "Echo Park",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=960&q=85",
    tint: "blue",
    note: "Ready for its next roll",
  },
  {
    id: "local-3",
    title: "Hand-thrown stoneware set",
    category: "Home",
    price: 42,
    condition: "Like new",
    location: "Los Feliz",
    image:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=960&q=85",
    tint: "rose",
    note: "Made by a local potter",
  },
  {
    id: "local-4",
    title: "Everyday leather tote",
    category: "Style",
    price: 54,
    condition: "Good",
    location: "Atwater Village",
    image:
      "https://images.unsplash.com/photo-1590875512994-7f6f2e3b2e8d?auto=format&fit=crop&w=960&q=85",
    tint: "green",
    note: "Room for all the little things",
  },
  {
    id: "local-5",
    title: "Vintage side table",
    category: "Home",
    price: 70,
    condition: "Well loved",
    location: "Highland Park",
    image:
      "https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=960&q=85",
    tint: "blue",
    note: "Solid wood, lovely patina",
  },
  {
    id: "local-6",
    title: "Trail-ready daypack",
    category: "Outdoors",
    price: 36,
    condition: "Like new",
    location: "Glassell Park",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=960&q=85",
    tint: "sand",
    note: "A good excuse to get outside",
  },
  {
    id: "local-7",
    title: "Soft cotton throw",
    category: "Home",
    price: 28,
    condition: "Good",
    location: "Silver Lake",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=960&q=85",
    tint: "rose",
    note: "Cozy nights, sorted",
  },
  {
    id: "local-8",
    title: "Weekend market basket",
    category: "Style",
    price: 24,
    condition: "Like new",
    location: "Los Feliz",
    image:
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=960&q=85",
    tint: "green",
    note: "Woven by hand",
  },
];

const categories = ["Everything", "Home", "Style", "Tech", "Outdoors"];
const productFeedUrl = "https://dummyjson.com/products?limit=194";

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function readSavedItems() {
  const saved = window.localStorage.getItem("localloop:saved");
  return saved ? JSON.parse(saved) : [];
}

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [savedItems, setSavedItems] = useState(readSavedItems);
  const [activeCategory, setActiveCategory] = useState("Everything");
  const [search, setSearch] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch(productFeedUrl, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Product catalog request failed (${response.status})`);
        }
        const data = await response.json();
        if (!Array.isArray(data.products)) {
          throw new Error("The product catalog returned an unexpected response.");
        }
        setProducts(data.products);
        setFeedError("");
      } catch (error) {
        if (error.name !== "AbortError") {
          setFeedError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    window.localStorage.setItem("localloop:saved", JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
=======

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import Announcement from "./components/Announcement";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/login";
import Register from "./pages/register";

import { getCurrentUser, logoutUser } from "./services/auth";

/*
  DEVELOPER: Vincent

  RESPONSIBILITY:
  Main application coordinator.

  TASKS:
  - Manage authentication state.
  - Manage application navigation.
  - Coordinate shared components.
  - Manage global notifications.
  - Preserve global scroll and reveal effects.

  NOTES:
  - Marketplace listings will be integrated with the backend later.
  - Do not introduce demo listing data.
  - Page-specific functionality belongs in its respective component.
*/

function readSavedItems() {
  try {
    const saved = window.localStorage.getItem("localloop:saved");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function App() {
  const [savedItems, setSavedItems] = useState(readSavedItems);
  const [savedOnly, setSavedOnly] = useState(false);

  const [toast, setToast] = useState("");

  const [currentPath, setCurrentPath] = useState(
    window.location.pathname
  );

  const [currentUser, setCurrentUser] = useState(null);

  /*
   * Authentication session check
   */
  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  /*
   * Browser back and forward navigation
   */
  useEffect(() => {
    function handlePopState() {
      setCurrentPath(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  /*
   * Persist saved items
   */
  useEffect(() => {
    window.localStorage.setItem(
      "localloop:saved",
      JSON.stringify(savedItems)
    );
  }, [savedItems]);

  /*
   * Toast notification timeout
   */
  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => {
      setToast("");
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [toast]);

  /*
   * Global scroll, hero pointer and reveal animations
   */
  useEffect(() => {
    const appShell = document.querySelector(".app-shell");

    if (!appShell) return;

>>>>>>> 219016811c07d4782eaffa9640eb32161413b8ad
    const header = document.querySelector(".site-header");
    const progress = document.querySelector(".scroll-progress span");
    const hero = document.querySelector(".hero");

    function updateScrollEffects() {
      const scrollTop = window.scrollY;
<<<<<<< HEAD
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      header?.classList.toggle("is-scrolled", scrollTop > 24);
      if (progress) {
        progress.style.transform = `scaleX(${maxScroll > 0 ? scrollTop / maxScroll : 0})`;
=======

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      header?.classList.toggle("is-scrolled", scrollTop > 24);

      if (progress) {
        progress.style.transform = `scaleX(${
          maxScroll > 0 ? scrollTop / maxScroll : 0
        })`;
>>>>>>> 219016811c07d4782eaffa9640eb32161413b8ad
      }
    }

    function updateHeroPointer(event) {
<<<<<<< HEAD
      if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
=======
      if (
        !hero ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      const bounds = hero.getBoundingClientRect();

      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

>>>>>>> 219016811c07d4782eaffa9640eb32161413b8ad
      hero.style.setProperty("--pointer-x", `${x * 12}px`);
      hero.style.setProperty("--pointer-y", `${y * 8}px`);
    }

    function resetHeroPointer() {
      hero?.style.setProperty("--pointer-x", "0px");
      hero?.style.setProperty("--pointer-y", "0px");
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
<<<<<<< HEAD
      { threshold: 0.12, rootMargin: "0px 0px -40px" },
    );

    document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));
    const revealMutationObserver = new MutationObserver(() => {
      document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((element) => {
        revealObserver.observe(element);
      });
    });
    revealMutationObserver.observe(document.querySelector(".app-shell"), {
      childList: true,
      subtree: true,
    });
    updateScrollEffects();
    window.addEventListener("scroll", updateScrollEffects, { passive: true });
=======
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px",
      }
    );

    document
      .querySelectorAll("[data-reveal]")
      .forEach((element) => revealObserver.observe(element));

    const revealMutationObserver = new MutationObserver(() => {
      document
        .querySelectorAll("[data-reveal]:not(.is-visible)")
        .forEach((element) => revealObserver.observe(element));
    });

    revealMutationObserver.observe(appShell, {
      childList: true,
      subtree: true,
    });

    updateScrollEffects();

    window.addEventListener("scroll", updateScrollEffects, {
      passive: true,
    });

>>>>>>> 219016811c07d4782eaffa9640eb32161413b8ad
    hero?.addEventListener("pointermove", updateHeroPointer);
    hero?.addEventListener("pointerleave", resetHeroPointer);

    return () => {
      revealObserver.disconnect();
      revealMutationObserver.disconnect();
<<<<<<< HEAD
      window.removeEventListener("scroll", updateScrollEffects);
      hero?.removeEventListener("pointermove", updateHeroPointer);
      hero?.removeEventListener("pointerleave", resetHeroPointer);
    };
  }, []);

  const listings = useMemo(() => {
    const remoteListings = products.map((product) => ({
      id: `product-${product.id}`,
      title: product.title,
      category: product.category === "furniture" ? "Home" : "Finds",
      price: product.price,
      condition: "Good",
      location: "Near you",
      image: product.thumbnail || product.images?.[0],
      tint: "sand",
      note: product.brand || "A good find, ready to go around",
    }));

    return [...demoListings, ...remoteListings];
  }, [products]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return listings.filter((listing) => {
      const matchesCategory =
        activeCategory === "Everything" ||
        listing.category.toLowerCase() === activeCategory.toLowerCase();
      const matchesSaved = !savedOnly || savedItems.includes(listing.id);
      const matchesSearch =
        !query ||
        `${listing.title} ${listing.category} ${listing.location}`
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesSaved && matchesSearch;
    });
  }, [activeCategory, listings, savedItems, savedOnly, search]);

  function toggleSaved(listing) {
    const isSaved = savedItems.includes(listing.id);
    setSavedItems((current) =>
      isSaved
        ? current.filter((id) => id !== listing.id)
        : [...current, listing.id],
    );
    setToast(isSaved ? "Removed from your saved finds" : "Saved for later");
  }

  function showAllFinds() {
    setSavedOnly(false);
    setActiveCategory("Everything");
    setSearch("");
    setVisibleCount(8);
    document.getElementById("finds")?.scrollIntoView({ behavior: "smooth" });
  }

  function openSellMessage() {
    setToast("Listing tools are coming soon");
  }

  const visibleListings = filteredListings.slice(0, visibleCount);

  return (
    <div className="app-shell">
      <div className="scroll-progress" aria-hidden="true"><span /></div>
      <div className="announcement">
        <span className="announcement-mark"><Leaf size={14} /></span>
        Good things go around. Find your next favorite nearby.
        <a href="#finds">Explore the loop <ArrowRight size={13} /></a>
      </div>

      <header className="site-header">
        <a className="wordmark" href="#" aria-label="LocalLoop home">
          <span className="wordmark-symbol"><span /><span /></span>
          <span>local<span className="wordmark-light">loop</span></span>
        </a>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
          <a href="#finds" onClick={() => setMenuOpen(false)}>Explore</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <button
            className={savedOnly ? "nav-saved active" : "nav-saved"}
            type="button"
            onClick={() => {
              setSavedOnly((current) => !current);
              setVisibleCount(8);
              setMenuOpen(false);
            }}
          >
            <Heart size={16} fill={savedOnly ? "currentColor" : "none"} />
            Saved
            {savedItems.length > 0 && <span className="saved-count">{savedItems.length}</span>}
          </button>
        </nav>
        <div className="header-actions">
          <button className="sell-button" type="button" onClick={openSellMessage}>
            <span>+</span> List an item
          </button>
          <button
            className="mobile-menu"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> THE NEIGHBORHOOD MARKETPLACE</div>
            <h1 id="hero-title">Good things<br />find <em>new homes.</em></h1>
            <p className="hero-description">
              Lovely secondhand things, from people just around the corner.
              Find a little something and keep good stuff going.
            </p>
            <div className="hero-actions">
              <button className="button-primary" type="button" onClick={showAllFinds}>
                Find your next favorite <ArrowRight size={17} />
              </button>
              <a className="text-link" href="#how-it-works">A better way to shop <ArrowDown size={14} /></a>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                <span>J</span><span>M</span><span>A</span><span>+</span>
              </div>
              <span><strong>Good finds, close by.</strong><br />A little more local. A little less new.</span>
            </div>
          </div>

          <div className="hero-art" aria-label="A collection of preloved home and lifestyle finds">
            <div className="hero-sun" />
            <div className="hero-art-label"><Sparkles size={14} /> THE GOOD STUFF, CIRCULATING</div>
            <div className="hero-stage">
              <div className="stage-grid" />
              <div className="stage-glow" />
              <div className="stage-rig">
                <div className="stage-orbit orbit-a" />
                <div className="stage-orbit orbit-b" />
                <div className="stage-orbit orbit-c" />
                <div className="stage-core">
                  <span className="core-shard shard-a" />
                  <span className="core-shard shard-b" />
                  <span className="core-shard shard-c" />
                  <span className="core-inner" />
                </div>
              </div>
              <div className="stage-card stage-card-top">
                <span>COMMUNITY LOOP</span>
                <strong>LIVE</strong>
              </div>
              <div className="stage-card stage-card-side">
                <span>Nearby finds</span>
                <strong>202</strong>
              </div>
              <div className="stage-pulse" />
            </div>
            <div className="hero-index">LOCAL FINDS<br /><span>LOS ANGELES, CA</span></div>
          </div>
          <div className="hero-bottomline"><span>01 — 04</span><span>Scroll to wander</span><span className="line" /></div>
        </section>

        <div className="loop-ticker" aria-label="LocalLoop community highlights">
          <div className="loop-ticker-track">
            <span>GOODS WITH STORIES</span><Leaf size={13} />
            <span>BUY NEARBY</span><Leaf size={13} />
            <span>LOVE IT LONGER</span><Leaf size={13} />
            <span>PASS IT FORWARD</span><Leaf size={13} />
            <span aria-hidden="true">GOODS WITH STORIES</span><Leaf size={13} aria-hidden="true" />
            <span aria-hidden="true">BUY NEARBY</span><Leaf size={13} aria-hidden="true" />
            <span aria-hidden="true">LOVE IT LONGER</span><Leaf size={13} aria-hidden="true" />
            <span aria-hidden="true">PASS IT FORWARD</span><Leaf size={13} aria-hidden="true" />
          </div>
        </div>

        <section className="finds-section" id="finds" aria-labelledby="finds-title" data-reveal>
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> AROUND THE CORNER</div>
              <h2 id="finds-title">{savedOnly ? "Your saved finds" : "A few good finds."}</h2>
              <p>{savedOnly ? "The things you want to come back to." : "One person's maybe is another person's absolutely."}</p>
            </div>
            {!savedOnly && <span className="result-count">{filteredListings.length} lovely things <span>↗</span></span>}
          </div>

          <div className="browse-tools">
            <div className="category-list" role="group" aria-label="Filter by category">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={activeCategory === category ? "category-chip selected" : "category-chip"}
                  onClick={() => {
                    setActiveCategory(category);
                    setVisibleCount(8);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
            <label className="search-field">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search local finds</span>
              <input
                type="search"
                placeholder="Try “chair” or “camera”"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisibleCount(8);
                }}
              />
              {search && (
                <button type="button" aria-label="Clear search" onClick={() => setSearch("")}>
                  <X size={15} />
                </button>
              )}
            </label>
          </div>

          {feedError && (
            <div className="feed-notice" role="status">
              <span>Showing local picks while the wider catalog is unavailable.</span>
              <span className="feed-error">{feedError}</span>
            </div>
          )}

          {loading && products.length === 0 && (
            <div className="loading-state"><LoaderCircle size={18} className="spin" /> Finding good things nearby…</div>
          )}

          {visibleListings.length > 0 ? (
            <div className="listing-grid">
              {visibleListings.map((listing, index) => (
                <article
                  className={`listing-card card-${listing.tint}`}
                  key={listing.id}
                  style={{ "--card-index": index }}
                  data-reveal
                  onPointerMove={(event) => {
                    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
                    const bounds = event.currentTarget.getBoundingClientRect();
                    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
                    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
                    event.currentTarget.style.setProperty("--tilt-x", `${y * -4}deg`);
                    event.currentTarget.style.setProperty("--tilt-y", `${x * 4}deg`);
                    event.currentTarget.style.setProperty("--spot-x", `${(x + 0.5) * 100}%`);
                    event.currentTarget.style.setProperty("--spot-y", `${(y + 0.5) * 100}%`);
                    event.currentTarget.style.setProperty("--image-x", `${x * -8}px`);
                    event.currentTarget.style.setProperty("--image-y", `${y * -8}px`);
                  }}
                  onPointerLeave={(event) => {
                    event.currentTarget.style.setProperty("--tilt-x", "0deg");
                    event.currentTarget.style.setProperty("--tilt-y", "0deg");
                    event.currentTarget.style.setProperty("--image-x", "0px");
                    event.currentTarget.style.setProperty("--image-y", "0px");
                  }}
                >
                  <div className="listing-image-wrap">
                    <img className="listing-image" src={listing.image} alt={listing.title} loading="lazy" />
                    <div className="card-spotlight" aria-hidden="true" />
                    {listing.id.startsWith("local-") && <span className="local-tag"><Sparkles size={11} /> LOCAL PICK</span>}
                    <button
                      className={savedItems.includes(listing.id) ? "save-button is-saved" : "save-button"}
                      type="button"
                      aria-label={savedItems.includes(listing.id) ? `Remove ${listing.title} from saved` : `Save ${listing.title}`}
                      aria-pressed={savedItems.includes(listing.id)}
                      onClick={() => toggleSaved(listing)}
                    >
                      <Heart size={17} fill={savedItems.includes(listing.id) ? "currentColor" : "none"} />
                    </button>
                    <span className="condition-tag">{listing.condition}</span>
                    <button
                      className="quick-view-button"
                      type="button"
                      onClick={() => setToast(`Previewing ${listing.title}`)}
                    >
                      Quick view <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div className="listing-details">
                    <div className="listing-category">{listing.category} <span>·</span> {listing.note}</div>
                    <div className="listing-title-row">
                      <h3>{listing.title}</h3>
                      <span className="listing-price">{formatPrice(listing.price)}</span>
                    </div>
                    <div className="listing-location"><MapPin size={12} /> {listing.location}</div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon"><Heart size={20} /></span>
              <h3>{savedOnly ? "Nothing saved just yet." : "No finds match that search."}</h3>
              <p>{savedOnly ? "Tap the heart on anything you love and it will be waiting here." : "Try another search or choose a different category."}</p>
              {savedOnly && <button className="text-link" type="button" onClick={() => setSavedOnly(false)}>Back to all finds <ArrowRight size={14} /></button>}
            </div>
          )}

          {filteredListings.length > visibleCount && (
            <div className="load-more-row">
              <button className="button-secondary" type="button" onClick={() => setVisibleCount((count) => count + 8)}>
                See more good things <ArrowDown size={15} />
              </button>
            </div>
          )}
        </section>

        <section className="manifesto" id="how-it-works">
          <div className="manifesto-art">
            <div className="manifesto-orbit orbit-one" />
            <div className="manifesto-orbit orbit-two" />
            <span className="manifesto-star">✳</span>
            <div className="manifesto-stamp">BUY NEARBY<br />LOVE LONGER</div>
          </div>
          <div className="manifesto-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> A NICER KIND OF LOOP</div>
            <h2>Less new.<br /><em>More you.</em></h2>
            <p>
              Good things deserve more than one story. Meet the neighbors behind
              the finds, give pre-loved pieces a fresh start, and make your next
              favorite thing feel like it was meant to be.
            </p>
            <button className="manifesto-link" type="button" onClick={showAllFinds}>
              Come on in <span><ArrowUpRight size={17} /></span>
            </button>
          </div>
          <div className="manifesto-side-note">GOOD THINGS, PASSED AROUND — SINCE ALWAYS</div>
        </section>

        <section className="sell-strip">
          <span className="sell-strip-icon"><Check size={18} /></span>
          <span><strong>Have something good to pass along?</strong><br />Someone nearby might be looking for just that.</span>
          <button type="button" onClick={openSellMessage}>Make a listing <ArrowRight size={16} /></button>
        </section>
      </main>

      <footer className="site-footer">
        <a className="wordmark footer-wordmark" href="#" aria-label="LocalLoop home">
          <span className="wordmark-symbol"><span /><span /></span>
          <span>local<span className="wordmark-light">loop</span></span>
        </a>
        <span>Good things go around. © 2025 LocalLoop</span>
        <a href="#finds">Back to the good stuff ↑</a>
      </footer>

      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
=======

      window.removeEventListener("scroll", updateScrollEffects);

      hero?.removeEventListener("pointermove", updateHeroPointer);
      hero?.removeEventListener("pointerleave", resetHeroPointer);
    };
  }, [currentPath]);

  /*
   * Application navigation
   */
  function navigate(path) {
    window.history.pushState({}, "", path);

    setCurrentPath(path);

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }

  /*
   * Logout
   */
  async function handleLogout() {
    try {
      await logoutUser();

      setCurrentUser(null);

      navigate("/");

      setToast("You have been signed out");
    } catch (error) {
      setToast(error.message || "Unable to sign out");
    }
  }

  /*
   * Saved items
   */
  function toggleSaved(listing) {
    const isSaved = savedItems.includes(listing.id);

    setSavedItems((current) =>
      isSaved
        ? current.filter((id) => id !== listing.id)
        : [...current, listing.id]
    );

    setToast(
      isSaved
        ? "Removed from your saved finds"
        : "Saved for later"
    );
  }

  /*
   * Homepage actions
   */
  function showAllFinds() {
    setSavedOnly(false);

    document
      .getElementById("finds")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function openSellMessage() {
    if (!currentUser) {
      navigate("/login");

      setToast("Please sign in before creating a listing");

      return;
    }

    setToast("Listing tools are coming soon");
  }

  /*
   * Authentication pages
   */
  if (currentPath === "/login") {
    return (
      <Login
        onNavigate={navigate}
        onAuthSuccess={setCurrentUser}
      />
    );
  }

  if (currentPath === "/register") {
    return <Register onNavigate={navigate} />;
  }

  /*
   * Main application layout
   */
  return (
    <div className="app-shell">
      <div className="scroll-progress" aria-hidden="true">
        <span />
      </div>

      <Announcement />

      <Navbar
        currentUser={currentUser}
        onNavigate={navigate}
        onLogout={handleLogout}
        savedOnly={savedOnly}
        savedCount={savedItems.length}
        onToggleSaved={() => setSavedOnly((current) => !current)}
        onCreateListing={openSellMessage}
      />

      <Home
        onShowAllFinds={showAllFinds}
        onCreateListing={openSellMessage}
      />

      <Footer onNavigate={navigate} />

      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
>>>>>>> 219016811c07d4782eaffa9640eb32161413b8ad
    </div>
  );
}

export default App;
