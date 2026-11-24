import { ArrowRight, Tag } from "lucide-react";

/*
 * DEVELOPER: Olentiki
 * RESPONSIBILITY: Homepage selling call-to-action section.
 */

function SellStrip({ onCreateListing }) {
  return (
    <section className="sell-strip" aria-label="Sell an item">
      <span className="sell-strip-icon">
        <Tag size={20} aria-hidden="true" />
      </span>

      <div className="sell-strip-text">
        <strong>Have something good to pass along?</strong>
        <span>Someone nearby might be looking for just that.</span>
      </div>

      <button type="button" onClick={onCreateListing}>
        Make a listing <ArrowRight size={17} aria-hidden="true" />
      </button>
    </section>
  );
}

export default SellStrip;