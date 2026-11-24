import { ArrowLeft } from "lucide-react";

/*
 * "Go back one page" button.
 *
 */
function BackButton({ onBack, fallback = "/", label = "Back", className = "page-back" }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => onBack(fallback)}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

export default BackButton;