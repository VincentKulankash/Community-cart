import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";

export default function Hero({ listingCount, onExplore }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> THE NEIGHBORHOOD MARKETPLACE
        </div>
        <h1 id="hero-title">
          Good things
          <br />
          find <em>new homes.</em>
        </h1>
        <p className="hero-description">
          Lovely secondhand things, from people just around the corner.
          Find a little something and keep good stuff going.
        </p>
        <div className="hero-actions">
          <button className="button-primary" type="button" onClick={onExplore}>
            Find your next favorite <ArrowRight size={17} />
          </button>
          <a className="text-link" href="#how-it-works">
            A better way to shop <ArrowDown size={14} />
          </a>
        </div>
        <div className="hero-proof">
          <div className="avatar-stack" aria-hidden="true">
            <span>J</span><span>M</span><span>A</span><span>+</span>
          </div>
          <span>
            <strong>Good finds, close by.</strong>
            <br />
            A little more local. A little less new.
          </span>
        </div>
      </div>

      <div className="hero-art" aria-label="A collection of preloved home and lifestyle finds">
        <div className="hero-sun" />
        <div className="hero-art-label">
          <Sparkles size={14} /> THE GOOD STUFF, CIRCULATING
        </div>
        <div className="hero-stage">
          <div className="stage-grid" />
          <div className="stage-glow" />
          <div className="stage-rig">
            <div className="stage-orbit orbit-a" />
            <div className="stage-orbit orbit-b" />
            <div className="stage-orbit orbit-c" />
            <div className="stage-core">
              <span className="core-shard shard-a" />
              <span className="core-shard shard-b" />
              <span className="core-shard shard-c" />
              <span className="core-inner" />
            </div>
          </div>
          <div className="stage-card stage-card-top">
            <span>COMMUNITY LOOP</span>
            <strong>LOCAL</strong>
          </div>
          <div className="stage-card stage-card-side">
            <span>Active listings</span>
            <strong>{listingCount ?? "—"}</strong>
          </div>
          <div className="stage-pulse" />
        </div>
        <div className="hero-index">
          COMMUNITY FINDS
          <br />
          <span>SHARED BY OUR COMMUNITY</span>
        </div>
      </div>
      <div className="hero-bottomline">
        <span>01 — 04</span>
        <span>Scroll to wander</span>
        <span className="line" />
      </div>
    </section>
  );
}
