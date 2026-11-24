import { ArrowLeft } from "lucide-react";

/*
 * "Go back one page" button.
 *
 * `onBack` comes from App.goBack, which steps back through the app's own
 * history and falls back to `fallback` when the page was opened directly
 * (for example from a shared link), so the button always has somewhere to go.
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