
import {
  ArrowUpRight,
  Heart,
  MapPin,
  Sparkles,
} from "lucide-react";

/*
  DEVELOPER: Vincent

  RESPONSIBILITY:
  Display an individual marketplace listing.

  NOTE:
  This component will be used when backend listings are integrated.
*/

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function ListingCard({
  listing,
  index,
  isSaved,
  onToggleSaved,
  onQuickView,
}) {
  return (
    <article
      className={`listing-card card-${listing.tint}`}
      style={{ "--card-index": index }}
      data-reveal
      onPointerMove={(event) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;

        event.currentTarget.style.setProperty("--tilt-x", `${y * -4}deg`);
        event.currentTarget.style.setProperty("--tilt-y", `${x * 4}deg`);
        event.currentTarget.style.setProperty("--spot-x", `${(x + 0.5) * 100}%`);
        event.currentTarget.style.setProperty("--spot-y", `${(y + 0.5) * 100}%`);
        event.currentTarget.style.setProperty("--image-x", `${x * -8}px`);
        event.currentTarget.style.setProperty("--image-y", `${y * -8}px`);
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--tilt-x", "0deg");
        event.currentTarget.style.setProperty("--tilt-y", "0deg");
        event.currentTarget.style.setProperty("--image-x", "0px");
        event.currentTarget.style.setProperty("--image-y", "0px");
      }}
    >
      <div className="listing-image-wrap">
        <img
          className="listing-image"
          src={listing.image}
          alt={listing.title}
          loading="lazy"
        />

        <div className="card-spotlight" aria-hidden="true" />

        {listing.id.startsWith("local-") && (
          <span className="local-tag">
            <Sparkles size={11} /> LOCAL PICK
          </span>
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
          onClick={() => onToggleSaved(listing)}
        >
          <Heart size={17} fill={isSaved ? "currentColor" : "none"} />
        </button>

        <span className="condition-tag">{listing.condition}</span>

        <button
          className="quick-view-button"
          type="button"
          onClick={() => onQuickView(listing)}
        >
          Quick view <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="listing-details">
        <div className="listing-category">
          {listing.category} <span>·</span> {listing.note}
        </div>

        <div className="listing-title-row">
          <h3>{listing.title}</h3>
          <span className="listing-price">
            {formatPrice(listing.price)}
          </span>
        </div>

        <div className="listing-location">
          <MapPin size={12} /> {listing.location}
        </div>
      </div>
    </article>
  );
}

export default ListingCard;
