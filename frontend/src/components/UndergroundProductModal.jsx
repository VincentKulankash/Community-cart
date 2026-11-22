import { useEffect, useState } from "react";
import { ArrowUpRight, ImageOff, X } from "lucide-react";
import { getUndergroundProduct } from "../services/underground";

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
  const isDirectoryEstimate = ["Nightlife & Entertainment", "Motorsports"].includes(details.category);

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
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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
          {details.image && !imageError ? (
            <img
              src={details.image}
              alt={details.name}
              onError={() => setImageError(true)}
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
          <p className="underground-kicker">{details.category} / {details.subcategory}</p>
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
          <p className="underground-demo-note">
            Please confirm product stock, prices, and venue availability directly
            before arranging a purchase or reservation.
          </p>
        </div>
      </section>
    </div>
  );
}
