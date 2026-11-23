import { useEffect, useState } from "react";
import { ArrowUpRight, ImageOff, X } from "lucide-react";
import { getUndergroundProduct } from "../services/underground";
import { getImageProxyUrl } from "../utils/productImage";

function formatPrice(price) {
  return `KES ${new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(price || 0)}`;
}

export default function UndergroundProductModal({ product, onClose }) {
  const [details, setDetails] = useState(product);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const imageUrl = details.image || product.image;
  const isDirectoryEstimate = ["Nightlife & Entertainment", "Motorsports"].includes(details.category);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  function handlePhoneSubmit(event) {
    event.preventDefault();
    if (!/^0\d{9}$/.test(phoneNumber)) {
      setPhoneError("Enter 10 digits starting with 0.");
      return;
    }

    setPhoneError("");
    setPhoneNumber("");
    setWelcomeOpen(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    getUndergroundProduct(product.id, { signal: controller.signal })
      .then((result) => {
        if (active) {
          setDetails(result);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active && !controller.signal.aborted) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [product.id, attempt]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (welcomeOpen) setWelcomeOpen(false);
        else onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, welcomeOpen]);

  return (
    <div className="underground-modal-backdrop" onMouseDown={onClose}>
      <section
        className="underground-product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="underground-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="underground-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close product details"
        >
          <X size={20} />
        </button>
        <div className="underground-modal-image">
          {imageUrl && !imageError ? (
            <img
              key={imageUrl}
              src={imageUrl}
              alt={details.name}
              onError={(event) => {
                if (!event.currentTarget.dataset.proxyAttempted) {
                  event.currentTarget.dataset.proxyAttempted = "true";
                  event.currentTarget.src = getImageProxyUrl(imageUrl);
                  return;
                }
                setImageError(true);
              }}
            />
          ) : (
            <div className="underground-modal-image-fallback">
              <ImageOff size={28} />
              <span>NO SIGNAL</span>
            </div>
          )}
          <span className="underground-modal-stamp">UNDERGROUND / FIND</span>
        </div>
        <div className="underground-modal-content">
          <p className="underground-kicker">{details.category}</p>
          <h2 id="underground-detail-title">{details.name}</h2>
          <p className="underground-modal-description">{details.description}</p>
          <div className="underground-modal-price-row">
            <strong>{formatPrice(details.price)}{isDirectoryEstimate ? " / person" : ""}</strong>
            <span className="is-available">Available</span>
          </div>
          {loading && (
            <p className="underground-modal-status" role="status">
              Loading full details…
            </p>
          )}
          {error && (
            <div className="underground-modal-error" role="alert">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setAttempt((current) => current + 1);
                }}
              >
                Retry <ArrowUpRight size={14} />
              </button>
            </div>
          )}
          <form className="underground-phone-form" onSubmit={handlePhoneSubmit} noValidate>
              <label htmlFor="underground-kenyan-phone">Kindly confirm order</label>
              <input
                id="underground-kenyan-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phoneNumber}
                onChange={(event) => {
                  setPhoneNumber(event.target.value.replace(/\D/g, "").slice(0, 10));
                  setPhoneError("");
                }}
                placeholder="07XXXXXXXX"
                maxLength={10}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? "underground-phone-error" : "underground-phone-help"}
              />
              {phoneError ? (
                <span className="underground-phone-error" id="underground-phone-error" role="alert">
                  {phoneError}
                </span>
              ) : (
                <span className="underground-phone-help" id="underground-phone-help">
                  10 digits, starting with 0.
                </span>
              )}
              <button className="underground-phone-submit" type="submit">
                Submit number
              </button>
          </form>
        </div>
      </section>
      {welcomeOpen && (
        <div
          className="underground-welcome-backdrop"
          onMouseDown={(event) => {
            event.stopPropagation();
            setWelcomeOpen(false);
          }}
        >
          <section
            className="underground-welcome-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="underground-welcome-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="underground-welcome-mark" aria-hidden="true">U</span>
            <p className="underground-kicker">SIGNAL RECEIVED</p>
            <h2 id="underground-welcome-title">Welcome to the Underground</h2>
            <button
              type="button"
              onClick={() => {
                setWelcomeOpen(false);
                onClose();
              }}
            >
              Continue browsing
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
