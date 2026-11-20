import { ArrowRight, Check } from "lucide-react";

export default function SellStrip({ onSell }) {
  return (
    <section className="sell-strip">
      <span className="sell-strip-icon"><Check size={18} /></span>
      <span>
        <strong>Have something good to pass along?</strong>
        <br />
        Someone nearby might be looking for just that.
      </span>
      <button type="button" onClick={onSell}>
        Make a listing <ArrowRight size={16} />
      </button>
    </section>
  );
}
