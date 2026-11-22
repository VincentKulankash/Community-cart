import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Heart,
  Search,
  X,
} from "lucide-react";

import Login from "./pages/login";
import Register from "./pages/register";
import Home from "./pages/Home";
import UndergroundEntry from "./pages/UndergroundEntry";
import Announcement from "./components/Announcement";
import Navbar from "./components/Navbar";
import ListingCard from "./components/ListingCard";
import Footer from "./components/Footer";
import { getCurrentUser, logoutUser } from "./services/auth";
import { getListings } from "./services/listings";
import { addFavorite, getFavorites, removeFavorite } from "./services/favorites";
import ListingForm from "./pages/ListingForm";
import ListingDetails from "./pages/ListingDetails";
import MyListings from "./pages/MyListings";
import Favorites from "./pages/Favorites";
import Offers from "./pages/Offers";
import Inquiries from "./pages/Inquiries";


function readSavedItems() {
  const saved = window.localStorage.getItem("localloop:saved");
  return saved ? JSON.parse(saved) : [];
}

function App() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listingError, setListingError] = useState("");
  const [listingAttempt, setListingAttempt] = useState(0);
  const [savedItems, setSavedItems] = useState(readSavedItems);
  const [activeCategory, setActiveCategory] = useState("Everything");
  const [search, setSearch] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (currentPath !== "/") {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadListings() {
      try {
        const data = await getListings({});
        if (!Array.isArray(data)) {
          throw new Error("The marketplace returned an unexpected response.");
        }
        const activeListings = data.filter((listing) => listing?.status === "active");

        setListings(
          activeListings
            .map((listing) => ({
              id: listing.id,
              title: listing.title,
              category: listing.category,
              price: listing.price,
              condition: listing.condition || "Condition not specified",
              location: listing.location || "",
              image: listing.image_url || "https://placehold.co/640x480?text=Community+find",
              tint: "sand",
              note: listing.description || "",
            })),
        );
        setListingError("");
      } catch (error) {
        if (!controller.signal.aborted) {
          setListingError(
            error instanceof TypeError
              ? "Could not connect to the marketplace. Check the server and try again."
              : error instanceof Error
                ? error.message
                : "Unable to load marketplace listings.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadListings();
    return () => controller.abort();
  }, [currentPath, listingAttempt]);

  useEffect(() => {
    if (currentPath === "/underground") return undefined;

    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
    return undefined;
  }, [currentPath]);

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!currentUser) window.localStorage.setItem("localloop:saved", JSON.stringify(savedItems));
  }, [currentUser, savedItems]);

  useEffect(() => {
    if (!currentUser) return;
    getFavorites()
      .then((data) => setSavedItems((data.favorites || []).map((favorite) => favorite.listing_id)))
      .catch((error) => setToast(error.message || "Unable to load your saved finds"));
  }, [currentUser]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const appShell = document.querySelector(".app-shell");
    if (!appShell) return;

    const header = document.querySelector(".site-header");
    const progress = document.querySelector(".scroll-progress span");
    const hero = document.querySelector(".hero");

    function updateScrollEffects() {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      header?.classList.toggle("is-scrolled", scrollTop > 24);
      if (progress) {
        progress.style.transform = `scaleX(${maxScroll > 0 ? scrollTop / maxScroll : 0})`;
      }
    }

    function updateHeroPointer(event) {
      if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
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
      { threshold: 0.12, rootMargin: "0px 0px -40px" },
    );

    document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));
    const revealMutationObserver = new MutationObserver(() => {
      document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((element) => {
        revealObserver.observe(element);
      });
    });
    revealMutationObserver.observe(appShell, {
      childList: true,
      subtree: true,
    });
    updateScrollEffects();
    window.addEventListener("scroll", updateScrollEffects, { passive: true });
    hero?.addEventListener("pointermove", updateHeroPointer);
    hero?.addEventListener("pointerleave", resetHeroPointer);

    return () => {
      revealObserver.disconnect();
      revealMutationObserver.disconnect();
      window.removeEventListener("scroll", updateScrollEffects);
      hero?.removeEventListener("pointermove", updateHeroPointer);
      hero?.removeEventListener("pointerleave", resetHeroPointer);
    };
  }, [currentPath]);

  const categories = useMemo(
    () => [
      "Everything",
      ...new Set(listings.map((listing) => listing.category).filter(Boolean)),
    ],
    [listings],
  );

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

  function navigate(path) {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

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

  function toggleSaved(listing) {
    const isSaved = savedItems.includes(listing.id);
    if (currentUser) {
      (isSaved ? removeFavorite(listing.id) : addFavorite(listing.id))
        .then(() => {
          setSavedItems((current) => isSaved
            ? current.filter((id) => id !== listing.id)
            : [...current, listing.id]);
          setToast(isSaved ? "Removed from your saved finds" : "Saved for later");
        })
        .catch((error) => setToast(error.message || "Unable to update saved finds"));
      return;
    }
    setSavedItems((current) => isSaved
      ? current.filter((id) => id !== listing.id)
      : [...current, listing.id]);
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
  if (!currentUser) {
    navigate("/login");
    setToast("Please sign in before creating a listing");
    return;
  }

  navigate("/listings/new");
}
  const visibleListings = filteredListings.slice(0, visibleCount);

  function pageShell(content) {
    return (
      <div className="app-shell">
        <div className="scroll-progress" aria-hidden="true"><span /></div>
        <Announcement />
        <Navbar currentUser={currentUser} menuOpen={menuOpen} setMenuOpen={setMenuOpen} savedOnly={savedOnly} setSavedOnly={setSavedOnly} setVisibleCount={setVisibleCount} savedItems={savedItems} onNavigate={navigate} onLogout={handleLogout} onSell={openSellMessage} />
        {content}
        <Footer />
        {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
      </div>
    );
  }

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

  if (currentPath === "/underground") {
    return <UndergroundEntry onNavigate={navigate} />;
  }

  if (currentPath === "/listings/new") {
    return currentUser
      ? pageShell(<ListingForm onNavigate={navigate} onSaved={() => { navigate("/my-listings"); setToast("Your listing is live"); }} />)
      : <Login onNavigate={navigate} onAuthSuccess={setCurrentUser} />;
  }
  const editMatch = currentPath.match(/^\/listings\/(\d+)\/edit$/);
  if (editMatch) {
    return currentUser
      ? pageShell(<ListingForm listingId={editMatch[1]} onNavigate={navigate} onSaved={() => { navigate("/my-listings"); setToast("Your changes are saved"); }} />)
      : <Login onNavigate={navigate} onAuthSuccess={setCurrentUser} />;
  }
  const listingMatch = currentPath.match(/^\/listings\/(\d+)$/);
  if (listingMatch) return pageShell(<ListingDetails listingId={listingMatch[1]} currentUser={currentUser} onNavigate={navigate} onSignIn={() => navigate("/login")} />);
  if (currentPath === "/my-listings") return currentUser ? pageShell(<MyListings currentUser={currentUser} onNavigate={navigate} />) : <Login onNavigate={navigate} onAuthSuccess={setCurrentUser} />;
  if (currentPath === "/favorites") return currentUser ? pageShell(<Favorites onNavigate={navigate} />) : <Login onNavigate={navigate} onAuthSuccess={setCurrentUser} />;
  if (currentPath === "/offers") return currentUser ? pageShell(<Offers onNavigate={navigate} />) : <Login onNavigate={navigate} onAuthSuccess={setCurrentUser} />;
  if (currentPath === "/inquiries") return currentUser ? pageShell(<Inquiries onNavigate={navigate} />) : <Login onNavigate={navigate} onAuthSuccess={setCurrentUser} />;

  return (
    <div className="app-shell">
      <div className="scroll-progress" aria-hidden="true"><span /></div>
      <Announcement />
      <Navbar
        currentUser={currentUser}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        savedOnly={savedOnly}
        setSavedOnly={setSavedOnly}
        setVisibleCount={setVisibleCount}
        savedItems={savedItems}
        onNavigate={navigate}
        onLogout={handleLogout}
        onSell={openSellMessage}
      />

      <Home
        listingCount={loading || listingError ? null : listings.length}
        onExplore={showAllFinds}
        onSell={openSellMessage}
      >
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

          {loading && (
            <div className="listing-grid loading-listings" role="status" aria-label="Finding good things nearby">
              {Array.from({ length: 8 }, (_, index) => (
                <article className="listing-card listing-skeleton" key={index} aria-hidden="true">
                  <div className="listing-image-wrap skeleton-image" />
                  <div className="listing-details">
                    <span className="skeleton-line skeleton-category" />
                    <span className="skeleton-line skeleton-title" />
                    <span className="skeleton-line skeleton-location" />
                  </div>
                </article>
              ))}
              <span className="sr-only">Finding good things nearby…</span>
            </div>
          )}

          {!loading && listingError ? (
            <div className="empty-state" role="alert">
              <span className="empty-icon"><Heart size={20} /></span>
              <h3>Marketplace unavailable.</h3>
              <p>{listingError}</p>
              <button
                className="button-secondary"
                type="button"
                onClick={() => {
                  setLoading(true);
                  setListingError("");
                  setListingAttempt((attempt) => attempt + 1);
                }}
              >
                Try again
              </button>
            </div>
          ) : !loading && visibleListings.length > 0 ? (
            <div className="listing-grid">
              {visibleListings.map((listing, index) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={index}
                  isSaved={savedItems.includes(listing.id)}
                  onToggleSaved={toggleSaved}
                  onQuickView={(selectedListing) => navigate(`/listings/${selectedListing.id}`)}
                />
              ))}
            </div>
          ) : !loading ? (
            <div className="empty-state">
              <span className="empty-icon"><Heart size={20} /></span>
              <h3>
                {savedOnly
                  ? "Nothing saved just yet."
                  : listings.length === 0
                    ? "No listings yet."
                    : "No finds match that search."}
              </h3>
              <p>
                {savedOnly
                  ? "Tap the heart on anything you love and it will be waiting here."
                  : listings.length === 0
                    ? "Check back soon for items shared by the community."
                    : "Try another search or choose a different category."}
              </p>
              {savedOnly && <button className="text-link" type="button" onClick={() => setSavedOnly(false)}>Back to all finds <ArrowRight size={14} /></button>}
            </div>
          ) : null}

          {filteredListings.length > visibleCount && (
            <div className="load-more-row">
              <button className="button-secondary" type="button" onClick={() => setVisibleCount((count) => count + 8)}>
                See more good things <ArrowDown size={15} />
              </button>
            </div>
          )}
        </section>

      </Home>

      <Footer />

      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    </div>
  );
}

export default App;
