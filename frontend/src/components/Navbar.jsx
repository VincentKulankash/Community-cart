
import { useState } from "react";
import { Heart, Menu, X } from "lucide-react";

/*
  DEVELOPER: Olentiki

  RESPONSIBILITY:
  Main website navigation and header.

  INTEGRATION:
  Navigation and authentication actions are handled by App.jsx.
*/

function Navbar({
  currentUser,
  onNavigate,
  onLogout,
  savedOnly,
  savedCount,
  onToggleSaved,
  onCreateListing,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNavigate(path) {
    setMenuOpen(false);
    onNavigate(path);
  }

  return (
    <header className="site-header">
      <a
        className="wordmark"
        href="/"
        aria-label="LocalLoop home"
        onClick={(event) => {
          event.preventDefault();
          handleNavigate("/");
        }}
      >
        <span className="wordmark-symbol">
          <span />
          <span />
        </span>
        <span>
          local<span className="wordmark-light">loop</span>
        </span>
      </a>

      <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
        <a href="#finds" onClick={() => setMenuOpen(false)}>
          Explore
        </a>

        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
          How it works
        </a>

        <button
          className={savedOnly ? "nav-saved active" : "nav-saved"}
          type="button"
          onClick={() => {
            onToggleSaved();
            setMenuOpen(false);
          }}
        >
          <Heart size={16} fill={savedOnly ? "currentColor" : "none"} />
          Saved
          {savedCount > 0 && (
            <span className="saved-count">{savedCount}</span>
          )}
        </button>
      </nav>

      <div className="header-actions">
        {currentUser ? (
          <>
            <span className="header-user">
              Hi, {currentUser.name}
            </span>

            <button
              className="auth-header-button"
              type="button"
              onClick={() => handleNavigate("/my-listings")}
            >
              My listings
            </button>

            <button
              className="auth-header-button"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <button
              className="auth-header-button"
              type="button"
              onClick={() => handleNavigate("/login")}
            >
              Sign in
            </button>

            <button
              className="sell-button"
              type="button"
              onClick={() => handleNavigate("/register")}
            >
              Create account
            </button>
          </>
        )}

        <button
          className="sell-button"
          type="button"
          onClick={() => {
            setMenuOpen(false);
            onCreateListing();
          }}
        >
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
  );
}

export default Navbar;
