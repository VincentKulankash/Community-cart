import {
  Heart,
  House,
  LayoutList,
  LogOut,
  Plus,
  Search,
  User,
} from "lucide-react";

/*
  DEVELOPER: Olentiki

  RESPONSIBILITY:
  Main website navigation.
  - Desktop (900px and up): sticky top bar with links and actions.
  - Mobile and tablet: slim top bar plus a bottom tab bar for the
    primary destinations, reachable with one thumb.

  INTEGRATION:
  Navigation and authentication actions are handled by App.jsx.
*/

function Navbar({
  currentUser,
  currentPath = "/",
  onNavigate,
  onLogout,
  savedCount = 0,
  onCreateListing,
}) {
  const isBrowse =
    currentPath === "/listings" || /^\/listings\/\d+/.test(currentPath);
  const isSaved = currentPath === "/favorites";
  const isMine =
    currentPath === "/my-listings" || currentPath === "/create-listing";
  const isHome = currentPath === "/";

  function go(event, path) {
    event.preventDefault();
    onNavigate(path);
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <a
            className="wordmark"
            href="/"
            aria-label="Community Cart home"
            onClick={(event) => go(event, "/")}
          >
            <span className="wordmark-symbol" aria-hidden="true" />
            <span>Community Cart</span>
          </a>

          <nav className="main-nav" aria-label="Main">
            <a
              className={isBrowse ? "nav-link active" : "nav-link"}
              href="/listings"
              aria-current={isBrowse ? "page" : undefined}
              onClick={(event) => go(event, "/listings")}
            >
              Browse
            </a>

            <a
              className={isSaved ? "nav-link active" : "nav-link"}
              href="/favorites"
              aria-current={isSaved ? "page" : undefined}
              onClick={(event) => go(event, "/favorites")}
            >
              Saved
              {savedCount > 0 && (
                <span className="saved-count">{savedCount}</span>
              )}
            </a>

            {currentUser && (
              <a
                className={isMine ? "nav-link active" : "nav-link"}
                href="/my-listings"
                aria-current={isMine ? "page" : undefined}
                onClick={(event) => go(event, "/my-listings")}
              >
                My listings
              </a>
            )}
          </nav>

          <div className="header-actions">
            {currentUser ? (
              <>
                <span className="header-user">Hi, {currentUser.name}</span>

                <button
                  className="auth-header-button"
                  type="button"
                  onClick={onLogout}
                >
                  <LogOut size={16} aria-hidden="true" />
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
                  className="auth-header-button header-desktop-only"
                  type="button"
                  onClick={() => onNavigate("/register")}
                >
                  Create account
                </button>
              </>
            )}

            <button
              className="sell-button header-desktop-only"
              type="button"
              onClick={onCreateListing}
            >
              <Plus size={17} aria-hidden="true" />
              List an item
            </button>
          </div>
        </div>
      </header>

      <nav className="tab-bar" aria-label="Primary">
        <a
          className={isHome ? "tab-link active" : "tab-link"}
          href="/"
          aria-current={isHome ? "page" : undefined}
          onClick={(event) => go(event, "/")}
        >
          <House size={22} aria-hidden="true" />
          Home
        </a>

        <a
          className={isBrowse ? "tab-link active" : "tab-link"}
          href="/listings"
          aria-current={isBrowse ? "page" : undefined}
          onClick={(event) => go(event, "/listings")}
        >
          <Search size={22} aria-hidden="true" />
          Browse
        </a>

        <button
          className="tab-link tab-sell"
          type="button"
          onClick={onCreateListing}
        >
          <span className="tab-sell-icon">
            <Plus size={22} strokeWidth={2.6} aria-hidden="true" />
          </span>
          Sell
        </button>

        <a
          className={isSaved ? "tab-link active" : "tab-link"}
          href="/favorites"
          aria-current={isSaved ? "page" : undefined}
          onClick={(event) => go(event, "/favorites")}
        >
          <Heart
            size={22}
            fill={isSaved ? "currentColor" : "none"}
            aria-hidden="true"
          />
          Saved
          {savedCount > 0 && (
            <span className="saved-count">{savedCount}</span>
          )}
        </a>

        {currentUser ? (
          <a
            className={isMine ? "tab-link active" : "tab-link"}
            href="/my-listings"
            aria-current={isMine ? "page" : undefined}
            onClick={(event) => go(event, "/my-listings")}
          >
            <LayoutList size={22} aria-hidden="true" />
            Mine
          </a>
        ) : (
          <a
            className="tab-link"
            href="/login"
            onClick={(event) => go(event, "/login")}
          >
            <User size={22} aria-hidden="true" />
            Sign in
          </a>
        )}
      </nav>
    </>
  );
}

export default Navbar;