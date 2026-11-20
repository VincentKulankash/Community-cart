import { Heart, Menu, X } from "lucide-react";

export default function Navbar({
  currentUser,
  menuOpen,
  setMenuOpen,
  savedOnly,
  setSavedOnly,
  setVisibleCount,
  savedItems,
  onNavigate,
  onLogout,
  onSell,
}) {
  function toggleSavedView() {
    setSavedOnly((current) => !current);
    setVisibleCount(8);
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <a className="wordmark" href="#" aria-label="Community-Cart home">
        <span className="wordmark-symbol"><span /><span /></span>
        <span>Community-cart<span className="wordmark-light"></span></span>
      </a>
      <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
        <a href="#finds" onClick={() => setMenuOpen(false)}>Explore</a>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        <button
          className={savedOnly ? "nav-saved active" : "nav-saved"}
          type="button"
          onClick={toggleSavedView}
        >
          <Heart size={16} fill={savedOnly ? "currentColor" : "none"} />
          Saved
          {savedItems.length > 0 && (
            <span className="saved-count">{savedItems.length}</span>
          )}
        </button>
      </nav>
      <div className="header-actions">
        {currentUser ? (
          <>
            <span className="header-user">Hi, {currentUser.name}</span>
            <button className="auth-header-button" type="button" onClick={onLogout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <button
              className="auth-header-button"
              type="button"
              onClick={() => onNavigate("/login")}
            >
              Sign in
            </button>
            <button
              className="sell-button"
              type="button"
              onClick={() => onNavigate("/register")}
            >
              Create account
            </button>
          </>
        )}
        <button className="sell-button" type="button" onClick={onSell}>
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
