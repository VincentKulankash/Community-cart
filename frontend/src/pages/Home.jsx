
import { Leaf } from "lucide-react";

import Hero from "../components/Hero";
import Manifesto from "../components/Manifesto";
import SellStrip from "../components/SellStrip";

/*
 * DEVELOPER: Olentiki
 * RESPONSIBILITY: Homepage UI development and enhancement.
 *
 * MAIN FILES:
 * - Home.jsx: Main homepage layout and section composition.
 * - Hero.jsx: Main hero section.
 * - Manifesto.jsx: Brand introduction.
 * - SellStrip.jsx: Selling call-to-action section.
 * - ListingCard.jsx: Reusable listing display.
 * - home.css: Homepage styling.
 *
 * TASKS:
 * - Improve and expand the homepage UI.
 * - Add new homepage sections where appropriate.
 * - Arrange existing sections into a consistent layout.
 * - Reuse existing components where possible.
 * - Ensure responsive layouts on desktop and mobile.
 * - Maintain the existing application's navigation and routing.
 *
 * RULES:
 * - Keep homepage composition in Home.jsx.
 * - Keep individual section markup in its respective component.
 * - Keep homepage-specific styles in home.css.
 * - Do not introduce dummy listings.
 * - Do not duplicate existing shared components.
 * - Coordinate changes to shared components with other developers.
 */

function Home({ onShowAllFinds, onCreateListing }) {
  return (
    <main>
      <Hero onShowAllFinds={onShowAllFinds} />

      <div
        className="loop-ticker"
        aria-label="LocalLoop community highlights"
      >
        <div className="loop-ticker-track">
          <span>GOODS WITH STORIES</span>
          <Leaf size={13} />
          <span>BUY NEARBY</span>
          <Leaf size={13} />
          <span>LOVE IT LONGER</span>
          <Leaf size={13} />
          <span>PASS IT FORWARD</span>
          <Leaf size={13} />

          <span aria-hidden="true">GOODS WITH STORIES</span>
          <Leaf size={13} aria-hidden="true" />
          <span aria-hidden="true">BUY NEARBY</span>
          <Leaf size={13} aria-hidden="true" />
          <span aria-hidden="true">LOVE IT LONGER</span>
          <Leaf size={13} aria-hidden="true" />
          <span aria-hidden="true">PASS IT FORWARD</span>
          <Leaf size={13} aria-hidden="true" />
        </div>
      </div>

      {/* Backend marketplace listings will be integrated here. */}
      <section
        className="finds-section"
        id="finds"
        aria-labelledby="finds-title"
        data-reveal
      >
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> AROUND THE CORNER
            </div>

            <h2 id="finds-title">A few good finds.</h2>

            <p>
              One person's maybe is another person's absolutely.
            </p>
          </div>
        </div>
      </section>

      <Manifesto onShowAllFinds={onShowAllFinds} />

      <SellStrip onCreateListing={onCreateListing} />
    </main>
  );
}

export default Home;
