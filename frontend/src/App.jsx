
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import Announcement from "./components/Announcement";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Listings from "./pages/Listings";
import ListingDetails from "./pages/ListingDetails";
import Login from "./pages/login";
import Register from "./pages/register";

import { getCurrentUser, logoutUser } from "./services/auth";

/*
  DEVELOPER: Vincent

  RESPONSIBILITY:
  Main application coordinator.
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

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "localloop:saved",
      JSON.stringify(savedItems)
    );
  }, [savedItems]);

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

    const header = document.querySelector(".site-header");
    const progress = document.querySelector(".scroll-progress span");
    const hero = document.querySelector(".hero");

    function updateScrollEffects() {
      const scrollTop = window.scrollY;

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      header?.classList.toggle("is-scrolled", scrollTop > 24);

      if (progress) {
        progress.style.transform = `scaleX(${
          maxScroll > 0 ? scrollTop / maxScroll : 0
        })`;
      }
    }

    function updateHeroPointer(event) {
      if (
        !hero ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

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
    navigate("/listings");
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
   * Listing details route
   */
  const listingDetailsMatch = currentPath.match(
    /^\/listings\/(\d+)$/
  );

  const selectedListingId = listingDetailsMatch
    ? listingDetailsMatch[1]
    : null;

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

      {selectedListingId ? (
        <ListingDetails
          listingId={selectedListingId}
          currentUser={currentUser}
          onNavigate={navigate}
          onNotify={setToast}
        />
      ) : currentPath === "/listings" ? (
        <Listings
          onNavigate={navigate}
          savedItems={savedItems}
          onToggleSaved={toggleSaved}
        />
      ) : (
        <Home
          onShowAllFinds={showAllFinds}
          onCreateListing={openSellMessage}
          onNavigate={navigate}
        />
      )}

      <Footer
        onNavigate={navigate}
        isMarketplace={currentPath === "/listings"}
      />

      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
