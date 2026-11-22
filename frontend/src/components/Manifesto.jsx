import { ArrowUpRight } from "lucide-react";

export default function Manifesto({ onExplore }) {
  return (
    <section className="manifesto" id="how-it-works">
      <div className="manifesto-art">
        <div className="manifesto-orbit orbit-one" />
        <div className="manifesto-orbit orbit-two" />
        <span className="manifesto-star">✳</span>
        <div className="manifesto-stamp">BUY NEARBY<br />LOVE LONGER</div>
      </div>
      <div className="manifesto-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> A NICER KIND OF LOOP
        </div>
        <h2>Less new.<br /><em>More you.</em></h2>
        <p>
          Good things deserve more than one story. Meet the neighbors behind
          the finds, give pre-loved pieces a fresh start, and make your next
          favorite thing feel like it was meant to be.
        </p>
        <button className="manifesto-link" type="button" onClick={onExplore}>
          Come on in <span><ArrowUpRight size={17} /></span>
        </button>
      </div>
      <div className="manifesto-side-note">GOOD THINGS, PASSED AROUND — SINCE ALWAYS</div>
    </section>
  );
}
