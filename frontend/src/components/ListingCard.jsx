
import {
  ArrowUpRight,
  Heart,
  MapPin,
} from "lucide-react";

function formatPrice(price) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function ListingCard({
  listing,
  index = 0,
  isSaved = false,
  onToggleSaved,
  onQuickView,
}) {
  return (
    <article
      className="listing-card"
      style={{ "--card-index": index }}
      data-reveal
    >
      <div className="listing-image-wrap">
        {listing.image_url ? (
          <img
            className="listing-image"
            src={listing.image_url}
            alt={listing.title}
            loading="lazy"
          />
        ) : (
          <div
            className="listing-image-placeholder"
            role="img"
            aria-label={`No image available for ${listing.title}`}
          >
            No image available
          </div>
        )}

        <button
          className={isSaved ? "save-button is-saved" : "save-button"}
          type="button"
          aria-label={
            isSaved
              ? `Remove ${listing.title} from saved`
              : `Save ${listing.title}`
          }
          aria-pressed={isSaved}
          onClick={() => onToggleSaved?.(listing)}
        >
          <Heart size={17} fill={isSaved ? "currentColor" : "none"} />
        </button>

        {listing.condition && (
          <span className="condition-tag">
            {listing.condition}
          </span>
        )}

        <button
          className="quick-view-button"
          type="button"
          onClick={() => onQuickView?.(listing)}
        >
          View details <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="listing-details">
        <div className="listing-category">
          {listing.category}
        </div>

        <div className="listing-title-row">
          <h3>{listing.title}</h3>

          <span className="listing-price">
            {formatPrice(listing.price)}
          </span>
        </div>

        <div className="listing-location">
          <MapPin size={12} />
          {listing.location || "Location not specified"}
        </div>
      </div>
    </article>
  );
}

export default ListingCard;
