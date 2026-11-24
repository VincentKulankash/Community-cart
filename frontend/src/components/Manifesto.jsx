import { ArrowRight } from "lucide-react";

/*
 * DEVELOPER: Olentiki
 * RESPONSIBILITY: Homepage "how it works" section.
 */

const STEPS = [
  {
    title: "Browse nearby finds",
    body: "Search by keyword or category and see what people around you are passing on.",
  },
  {
    title: "Ask or make an offer",
    body: "Message the seller with a question, or send a private offer they alone can see.",
  },
  {
    title: "List what you don't need",
    body: "Add a photo, a price and a few details. Buyers can reach you straight away.",
  },
];

function Manifesto({ onShowAllFinds }) {
  return (
    <section className="how-section" id="how-it-works" data-reveal>
      <div className="eyebrow">
        <span className="eyebrow-dot" /> How it works
      </div>

      <div className="section-heading">
        <div>
          <h2>Simple, local, a little less new.</h2>
        </div>
      </div>

      <div className="how-steps">
        {STEPS.map((step, index) => (
          <div className="how-step" key={step.title}>
            <div className="how-step-number">{index + 1}</div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        ))}
      </div>

      <div className="how-cta">
        <button
          className="button-secondary"
          type="button"
          onClick={onShowAllFinds}
        >
          Start browsing <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export default Manifesto;