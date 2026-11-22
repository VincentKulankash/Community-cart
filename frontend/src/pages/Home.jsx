import { Leaf } from "lucide-react";
import Hero from "../components/Hero";
import Manifesto from "../components/Manifesto";
import SellStrip from "../components/SellStrip";

export default function Home({ listingCount, onExplore, onSell, children }) {
  return (
    <main>
      <Hero listingCount={listingCount} onExplore={onExplore} />

      <div className="loop-ticker" aria-label="Community-cart community highlights">
        <div className="loop-ticker-track">
          <span>GOODS WITH STORIES</span><Leaf size={13} />
          <span>BUY NEARBY</span><Leaf size={13} />
          <span>LOVE IT LONGER</span><Leaf size={13} />
          <span>PASS IT FORWARD</span><Leaf size={13} />
          <span aria-hidden="true">GOODS WITH STORIES</span><Leaf size={13} aria-hidden="true" />
          <span aria-hidden="true">BUY NEARBY</span><Leaf size={13} aria-hidden="true" />
          <span aria-hidden="true">LOVE IT LONGER</span><Leaf size={13} aria-hidden="true" />
          <span aria-hidden="true">PASS IT FORWARD</span><Leaf size={13} aria-hidden="true" />
        </div>
      </div>

      {children}
      <Manifesto onExplore={onExplore} />
      <SellStrip onSell={onSell} />
    </main>
  );
}
