import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  LoaderCircle,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import {
  getCart,
  removeFromCart,
  clearCart,
} from "../services/cart";

import "../styles/cart.css";

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);
}

function formatDeadline(value) {
  if (!value) return "No expiry date set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Deadline unavailable";
  }

  return date.toLocaleString();
}

export default function Cart({ currentUser, onNavigate }) {
  const [cart, setCart] = useState({
    items: [],
    item_count: 0,
    subtotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyIds, setBusyIds] = useState([]);
  const [clearing, setClearing] = useState(false);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getCart();

      setCart({
        items: Array.isArray(data.items) ? data.items : [],
        item_count: data.item_count || 0,
        subtotal: data.subtotal || 0,
      });
    } catch (err) {
      setError(err.message || "Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [currentUser, loadCart]);

  async function handleRemove(listingId) {
    if (busyIds.includes(listingId)) return;

    setActionError("");
    setBusyIds((current) => [...current, listingId]);

    try {
      await removeFromCart(listingId);
      await loadCart();
    } catch (err) {
      setActionError(err.message || "Unable to remove this item.");
    } finally {
      setBusyIds((current) =>
        current.filter((id) => id !== listingId)
      );
    }
  }

  async function handleClearCart() {
    if (!cart.items.length || clearing) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove every item from your cart?"
    );

    if (!confirmed) return;

    setActionError("");
    setClearing(true);

    try {
      await clearCart();
      setCart({
        items: [],
        item_count: 0,
        subtotal: 0,
      });
    } catch (err) {
      setActionError(err.message || "Unable to clear your cart.");
    } finally {
      setClearing(false);
    }
  }

  if (!currentUser) {
    return (
      <main className="cart-page">
        <section className="cart-message">
          <ShoppingCart size={40} />
          <h1>Your cart is waiting.</h1>
          <p>Please sign in to view and manage your saved cart items.</p>
          <button type="button" onClick={() => onNavigate("/login")}>
            Sign in
          </button>
          <button
            className="cart-back-button"
            type="button"
            onClick={() => onNavigate("/")}
          >
            Back to LocalLoop
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-container">
        <button
          className="cart-back-link"
          type="button"
          onClick={() => onNavigate("/")}
        >
          <ArrowLeft size={17} />
          Back to exploring
        </button>

        <header className="cart-heading">
          <span className="cart-eyebrow">YOUR LOCAL FINDS</span>
          <h1>Your shopping <em>cart.</em></h1>
          <p>
            Keep your finds together. Items stay here until you remove them,
            even when a seller's listing deadline has passed.
          </p>
        </header>

        {actionError && (
          <div className="cart-error" role="alert">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="cart-loading" role="status">
            <LoaderCircle className="cart-spinner" size={30} />
            <p>Loading your cart...</p>
          </div>
        ) : error ? (
          <section className="cart-message">
            <h2>We couldn't load your cart.</h2>
            <p>{error}</p>
            <button type="button" onClick={loadCart}>
              Try again
            </button>
          </section>
        ) : (
          <>
            <div className="cart-section-heading">
              <div>
                <span className="cart-eyebrow">SAVED ITEMS</span>
                <h2>Your cart items</h2>
              </div>

              {cart.items.length > 0 && (
                <button
                  className="cart-clear-button"
                  type="button"
                  onClick={handleClearCart}
                  disabled={clearing}
                >
                  <Trash2 size={15} />
                  {clearing ? "Clearing..." : "Clear cart"}
                </button>
              )}
            </div>

            {cart.items.length > 0 ? (
              <>
                <div className="cart-layout">
                  <section className="cart-items">
                    {cart.items.map((item) => {
                      const listing = item.listing;

                      if (!listing) return null;

                      return (
                        <article
                          className={`cart-item ${
                            item.available ? "" : "cart-item-unavailable"
                          }`}
                          key={item.id}
                        >
                          <div className="cart-item-image">
                            {listing.image_url ? (
                              <img
                                src={listing.image_url}
                                alt={listing.title}
                              />
                            ) : (
                              <div className="cart-no-image">
                                No image available
                              </div>
                            )}
                          </div>

                          <div className="cart-item-details">
                            <span className="cart-item-category">
                              {listing.category || "General"}
                            </span>

                            <h3>{listing.title}</h3>

                            <p className="cart-item-location">
                              {listing.location || "Location not specified"}
                            </p>

                            <p className="cart-item-price">
                              {formatPrice(listing.price)}
                            </p>

                            <p className="cart-deadline">
                              <Clock3 size={14} />
                              Seller deadline:{" "}
                              {formatDeadline(listing.offer_ends_at)}
                            </p>

                            {item.available ? (
                              <span className="cart-available">
                                Available
                              </span>
                            ) : (
                              <span className="cart-unavailable">
                                Unavailable —{" "}
                                {item.unavailable_reason ||
                                  "This listing is no longer available."}
                              </span>
                            )}
                          </div>

                          <div className="cart-item-actions">
                            {item.available && (
                              <strong>
                                {formatPrice(item.subtotal)}
                              </strong>
                            )}

                            <button
                              type="button"
                              className="cart-remove-button"
                              onClick={() => handleRemove(item.listing_id)}
                              disabled={busyIds.includes(item.listing_id)}
                            >
                              <Trash2 size={15} />
                              {busyIds.includes(item.listing_id)
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </section>

                  <aside className="cart-summary">
                    <span className="cart-eyebrow">CART SUMMARY</span>
                    <h2>Order overview</h2>

                    <div className="cart-summary-row">
                      <span>Available items</span>
                      <strong>{cart.item_count}</strong>
                    </div>

                    <div className="cart-summary-row">
                      <span>Unavailable items</span>
                      <strong>
                        {cart.items.filter((item) => !item.available).length}
                      </strong>
                    </div>

                    <div className="cart-summary-total">
                      <span>Subtotal</span>
                      <strong>{formatPrice(cart.subtotal)}</strong>
                    </div>

                    <p className="cart-summary-note">
                      Unavailable listings are kept in your cart for reference
                      but are excluded from your subtotal. Checkout is not
                      available yet.
                    </p>

                    <button
                      className="cart-continue-button"
                      type="button"
                      onClick={() => onNavigate("/")}
                    >
                      Continue exploring
                    </button>
                  </aside>
                </div>
              </>
            ) : (
              <section className="cart-empty">
                <ShoppingCart size={38} />
                <h3>Your cart is empty.</h3>
                <p>
                  Explore the marketplace and add a listing to keep it here.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("/")}
                >
                  Explore listings
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
