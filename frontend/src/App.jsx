import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Listings from "./pages/Listings";
import ListingDetails from "./pages/ListingDetails";
import Favorites from "./pages/Favorites";
import MyListings from "./pages/MyListings";
import MyOffers from "./pages/MyOffers";
import Messages from "./pages/Messages";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import Login from "./pages/login";
import Register from "./pages/register";

import { getCurrentUser, logoutUser } from "./services/auth";
import { AUTH_EXPIRED_EVENT } from "./services/api";
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

  /*
   * Number the pages we push onto the history stack so "Back" can tell
   * whether there is an earlier page inside the app (idx > 0) or the
   * visitor landed here directly.
   */
  useEffect(() => {
    if (typeof window.history.state?.idx !== "number") {
      window.history.replaceState(
        { ...(window.history.state || {}), idx: 0 },
        ""
      );
    }
  }, []);

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
   * Expired or missing session: a protected request that returns 401
   * clears the user and sends them to the login page.
   */
  useEffect(() => {
    function handleAuthExpired() {
      setCurrentUser(null);
      setSavedItems([]);
      navigate("/login");
      setToast("Your session has expired. Please sign in again.");
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  /*
   * Header shadow on scroll and reveal-on-scroll animations.
   */
  useEffect(() => {
    const appShell = document.querySelector(".app-shell");

    if (!appShell) return;

    const header = document.querySelector(".site-header");

    function updateScrollEffects() {
      header?.classList.toggle("is-scrolled", window.scrollY > 24);
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

    return () => {
      revealObserver.disconnect();
      revealMutationObserver.disconnect();

      window.removeEventListener("scroll", updateScrollEffects);
    };
  }, [currentPath]);

  /*
   * Application navigation.
   */
  function navigate(path) {
    const idx = (window.history.state?.idx ?? 0) + 1;

    window.history.pushState({ idx }, "", path);

    setCurrentPath(path);

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }

  /*
   * Go back one page inside the app, or to `fallback` when there is no
   * earlier page (for example when the visitor opened a shared link).
   */
  function goBack(fallback = "/") {
    if ((window.history.state?.idx ?? 0) > 0) {
      window.history.back();
    } else {
      navigate(fallback);
    }
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
      <Navbar
        currentUser={currentUser}
        currentPath={currentPath}
        onNavigate={navigate}
        onLogout={handleLogout}
        savedCount={savedItems.length}
        onCreateListing={openSellMessage}
      />

      {selectedEditListingId ? (
        <EditListing
          listingId={selectedEditListingId}
          currentUser={currentUser}
          onNavigate={navigate}
          onBack={goBack}
          onNotify={setToast}
        />
      ) : selectedListingId ? (
        <ListingDetails
          listingId={selectedListingId}
          currentUser={currentUser}
          onNavigate={navigate}
          onBack={goBack}
          onNotify={setToast}
        />
      ) : currentPath === "/my-listings" ? (
        <MyListings
          currentUser={currentUser}
          onNavigate={navigate}
          onBack={goBack}
          onNotify={setToast}
        />
      ) : currentPath === "/my-offers" ? (
        <MyOffers
          currentUser={currentUser}
          onNavigate={navigate}
          onBack={goBack}
        />
      ) : currentPath === "/messages" ? (
        <Messages
          currentUser={currentUser}
          onNavigate={navigate}
          onBack={goBack}
          onNotify={setToast}
        />
      ) : currentPath === "/create-listing" ? (
        <CreateListing
          currentUser={currentUser}
          onNavigate={navigate}
          onBack={goBack}
          onNotify={setToast}
        />
      ) : currentPath === "/favorites" ? (
        <Favorites
          currentUser={currentUser}
          onNavigate={navigate}
          onBack={goBack}
        />
      ) : currentPath === "/listings" ? (
        <Listings
          onNavigate={navigate}
          onBack={goBack}
          savedItems={savedItems}
          onToggleSaved={toggleSaved}
        />
      ) : (
        <Home
          onShowAllFinds={showAllFinds}
          onCreateListing={openSellMessage}
          onNavigate={navigate}
          savedItems={savedItems}
          onToggleSaved={toggleSaved}
        />
      )}

      <Footer onNavigate={navigate} />

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