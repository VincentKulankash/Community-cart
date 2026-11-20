import { Heart, MapPin } from "lucide-react";

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

export default function ListingCard({
  listing,
  isFavorite = false,
  onFavoriteToggle,
  favoriteLoading = false,
}) {
  if (!listing) return null;

  const image = listing.image_url;

  return (
    <article className="listing-card favorite-listing-card">
      <div className="listing-image-wrap">
        {image ? (
          <img
            className="listing-image"
            src={image}
            alt={listing.title}
            loading="lazy"
          />
        ) : (
          <div className="listing-image-placeholder">
            <span>No image available</span>
          </div>
        )}

        <button
          className={`save-button ${isFavorite ? "is-saved" : ""}`}
          type="button"
          onClick={() => onFavoriteToggle?.(listing)}
          disabled={favoriteLoading || !onFavoriteToggle}
          aria-label={
            isFavorite
              ? `Remove ${listing.title} from favourites`
              : `Add ${listing.title} to favourites`
          }
          aria-pressed={isFavorite}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </button>

        {listing.condition && (
          <span className="condition-tag">{listing.condition}</span>
        )}
      </div>

      <div className="listing-details">
        <div className="listing-title-row">
          <h3>{listing.title}</h3>
          <span className="listing-price">{formatPrice(listing.price)}</span>
        </div>

        <p className="favorite-listing-category">
          {listing.category || "General"}
        </p>

        <p className="listing-location">
          <MapPin size={14} />
          {listing.location || "Location not specified"}
        </p>

        {listing.description && (
          <p className="favorite-listing-description">
            {listing.description}
          </p>
        )}
      </div>
    </article>
  );
}
