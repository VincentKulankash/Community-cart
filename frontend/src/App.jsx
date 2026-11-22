
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import Announcement from "./components/Announcement";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Listings from "./pages/Listings";
import ListingDetails from "./pages/ListingDetails";
import Favorites from "./pages/Favorites";
import MyListings from "./pages/MyListings";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import Login from "./pages/login";
import Register from "./pages/register";

import { getCurrentUser, logoutUser } from "./services/auth";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "./services/favorites";

/*
  DEVELOPER: Vincent

  RESPONSIBILITY:
  Main application coordinator.
  Manages navigation, authentication, favourites and listing management.
*/

function App() {
  const [savedItems, setSavedItems] = useState([]);
  const [toast, setToast] = useState("");

  const [currentPath, setCurrentPath] = useState(
    window.location.pathname
  );

  const [currentUser, setCurrentUser] = useState(null);

  /*
   * Get the currently logged-in user.
   */
  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  /*
   * Fetch the logged-in user's favourites from the database.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      if (!currentUser) {
        setSavedItems([]);
        return;
      }

      try {
        const response = await getFavorites();

        if (cancelled) return;

        const favorites = response?.favorites || [];

        const favoriteIds = favorites
          .map((favorite) => Number(favorite.listing_id))
          .filter((id) => Number.isFinite(id));

        setSavedItems(favoriteIds);
      } catch (error) {
        if (!cancelled) {
          setSavedItems([]);
          setToast(error.message || "Unable to load saved listings");
        }
      }
    }

    loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  /*
   * Handle browser back and forward navigation.
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
   * Automatically dismiss toast notifications.
   */
  useEffect(() => {
    if (!toast) return undefined;

    const timer = window.setTimeout(() => {
      setToast("");
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [toast]);

  /*
   * Global scroll, hero pointer and reveal animations.
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
   * Application navigation.
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
   * Logout.
   */
  async function handleLogout() {
    try {
      await logoutUser();

      setCurrentUser(null);
      setSavedItems([]);

      navigate("/");

      setToast("You have been signed out");
    } catch (error) {
      setToast(error.message || "Unable to sign out");
    }
  }

  /*
   * Add or remove a favourite through the backend.
   */
  async function toggleSaved(listing) {
    if (!currentUser) {
      navigate("/login");
      setToast("Please sign in to save listings");
      return;
    }

    const listingId = Number(listing.id);

    if (!Number.isFinite(listingId)) {
      setToast("Invalid listing");
      return;
    }

    const isSaved = savedItems.includes(listingId);

    try {
      if (isSaved) {
        await removeFavorite(listingId);

        setSavedItems((current) =>
          current.filter((id) => id !== listingId)
        );

        setToast("Removed from your saved finds");
      } else {
        await addFavorite(listingId);

        setSavedItems((current) =>
          current.includes(listingId)
            ? current
            : [...current, listingId]
        );

        setToast("Saved for later");
      }
    } catch (error) {
      setToast(error.message || "Unable to update saved listings");
    }
  }

  /*
   * Homepage actions.
   */
  function showAllFinds() {
    navigate("/listings");
  }

  function openSellMessage() {
    if (!currentUser) {
      navigate("/login");
      setToast("Please sign in before creating a listing");
      return;
    }

    navigate("/create-listing");
  }

  /*
   * Listing route matching.
   */
  const editListingMatch = currentPath.match(
    /^\/listings\/(\d+)\/edit$/
  );

  const listingDetailsMatch = currentPath.match(
    /^\/listings\/(\d+)$/
  );

  const selectedEditListingId = editListingMatch
    ? editListingMatch[1]
    : null;

  const selectedListingId = listingDetailsMatch
    ? listingDetailsMatch[1]
    : null;

  /*
   * Authentication pages.
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
   * Main application layout.
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
        savedOnly={currentPath === "/favorites"}
        savedCount={savedItems.length}
        onToggleSaved={() => navigate("/favorites")}
        onCreateListing={openSellMessage}
      />

      {selectedEditListingId ? (
        <EditListing
          listingId={selectedEditListingId}
          currentUser={currentUser}
          onNavigate={navigate}
          onNotify={setToast}
        />
      ) : selectedListingId ? (
        <ListingDetails
          listingId={selectedListingId}
          currentUser={currentUser}
          onNavigate={navigate}
          onNotify={setToast}
        />
      ) : currentPath === "/my-listings" ? (
        <MyListings
          currentUser={currentUser}
          onNavigate={navigate}
          onNotify={setToast}
        />
      ) : currentPath === "/create-listing" ? (
        <CreateListing
          currentUser={currentUser}
          onNavigate={navigate}
          onNotify={setToast}
        />
      ) : currentPath === "/favorites" ? (
        <Favorites
          currentUser={currentUser}
          onNavigate={navigate}
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
        isMarketplace={
          currentPath === "/listings" ||
          currentPath === "/favorites" ||
          currentPath === "/my-listings"
        }
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
