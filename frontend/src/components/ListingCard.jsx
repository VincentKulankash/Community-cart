import { Heart, ImageOff, MapPin } from "lucide-react";

function formatPrice(price) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

/*
 * The whole card is one tap target: the title is a real link whose
 * ::after stretches over the card (see .listing-link in styles.css).
 * The save button sits above it, so tapping the heart never navigates.
 */
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
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="listing-image-placeholder" aria-hidden="true">
            <ImageOff size={26} />
            No photo
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
          <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>

        {listing.condition && (
          <span className="condition-tag">{listing.condition}</span>
        )}
      </div>

      <div className="listing-details">
        {listing.category && (
          <div className="listing-category">{listing.category}</div>
        )}

        <h3 className="listing-title">
          <a
            className="listing-link"
            href={`/listings/${listing.id}`}
            onClick={(event) => {
              event.preventDefault();
              onQuickView?.(listing);
            }}
          >
            {listing.title}
          </a>
        </h3>

        <div className="listing-price">{formatPrice(listing.price)}</div>

        <div className="listing-location">
          <MapPin size={13} aria-hidden="true" />
          {listing.location || "Location not specified"}
        </div>
      </div>
    </article>
  );
}

export default ListingCard;