
import { ArrowRight, Check } from "lucide-react";

/*
 * DEVELOPER: Olentiki
 * RESPONSIBILITY: Homepage selling call-to-action section.
 *
 * TASKS:
 * - Improve the selling/promotion section.
 * - Ensure its call-to-action connects to the existing application flow.
 * - Make the section responsive.
 *
 * STYLING: src/styles/home.css
 */

function SellStrip({ onCreateListing }) {
  return (
    <section className="sell-strip">
      <span className="sell-strip-icon">
        <Check size={18} />
      </span>

      <span>
        <strong>Have something good to pass along?</strong>
        <br />
        Someone nearby might be looking for just that.
      </span>

      <button type="button" onClick={onCreateListing}>
        Make a listing <ArrowRight size={16} />
      </button>
    </section>
  );
}

export default SellStrip;
