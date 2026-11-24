import {
  ArrowRight,
  HandCoins,
  MapPin,
  Plus,
  Tag,
} from "lucide-react";

import "../styles/hero-atom.css";

/*
 * DEVELOPER: Olentiki
 * RESPONSIBILITY: Homepage hero section.
 *
 * The floating atom is the hero's signature visual. It is pure CSS
 * (see styles/hero-atom.css) and deliberately shows no marketplace data.
 */

function Hero({ onShowAllFinds, onCreateListing }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> The neighbourhood marketplace
          </div>

          <h1 id="hero-title">
            Good things find{" "}
            <span className="hero-highlight">new homes.</span>
          </h1>

          <p className="hero-description">
            Second-hand finds from people near you. Ask the seller a
            question, make a private offer, or list something of your own.
          </p>

          <div className="hero-actions">
            <button
              className="button-primary"
              type="button"
              onClick={onShowAllFinds}
            >
              Browse finds <ArrowRight size={18} aria-hidden="true" />
            </button>

            <button
              className="button-secondary"
              type="button"
              onClick={onCreateListing}
            >
              <Plus size={18} aria-hidden="true" /> List an item
            </button>
          </div>

          <ul className="hero-points">
            <li>
              <span className="hero-point-icon">
                <MapPin size={18} aria-hidden="true" />
              </span>
              Buy from people nearby
            </li>
            <li>
              <span className="hero-point-icon">
                <HandCoins size={18} aria-hidden="true" />
              </span>
              Private, sealed offers
            </li>
            <li>
              <span className="hero-point-icon">
                <Tag size={18} aria-hidden="true" />
              </span>
              List in a couple of minutes
            </li>
          </ul>
        </div>

        <div className="hero-atom" aria-hidden="true">
          <div className="atom-stage">
            <div className="atom-grid" />
            <div className="atom-glow" />

            <div className="atom-rig">
              <span className="atom-orbit orbit-a" />
              <span className="atom-orbit orbit-b" />
              <span className="atom-orbit orbit-c" />
              <div className="atom-core" />
            </div>

            <div className="atom-pulse" />

          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;