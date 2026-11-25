import { AlertTriangle, Lock, Search, WifiOff } from "lucide-react";

import "../styles/errors.css";

const VARIANTS = {
  unauthorized: {
    icon: Lock,
    title: "Please sign in",
    text: "You need to be signed in to see this.",
  },
  forbidden: {
    icon: Lock,
    title: "Not allowed",
    text: "You don't have permission to view or change this.",
  },
  notfound: {
    icon: Search,
    title: "Nothing here",
    text: "We couldn't find what you were looking for. It may have been removed.",
  },
  invalid: {
    icon: AlertTriangle,
    title: "Something isn't right",
    text: "Some of the information wasn't valid. Please check it and try again.",
  },
  unavailable: {
    icon: WifiOff,
    title: "Temporarily unavailable",
    text: "We couldn't reach the marketplace. Please check your connection and try again.",
  },
};

function variantFor(error) {
  const status = Number(error?.status);
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404 || status === 410) return "notfound";
  if (status === 400 || status === 422) return "invalid";
  return "unavailable";
}

/*
 * Props:
 * - error: an ApiError (or any Error); its status picks the variant
 * - variant (optional): force one of unauthorized, forbidden, notfound,
 *   invalid, unavailable
 * - message (optional): overrides the text
 * - onRetry, onSignIn, onBack (optional): show the matching button
 */
function ErrorState({ error, variant, message, onRetry, onSignIn, onBack }) {
  const key = variant || variantFor(error);
  const { icon: Icon, title, text } = VARIANTS[key];
  const detail =
    message || (key === "unavailable" ? text : error?.message) || text;

  return (
    <section className="er-state" role="alert">
      <span className="er-icon" aria-hidden="true">
        <Icon size={22} />
      </span>

      <h2>{title}</h2>
      <p>{detail}</p>

      <div className="er-actions">
        {key === "unauthorized" && onSignIn && (
          <button className="er-btn" type="button" onClick={onSignIn}>
            Sign in
          </button>
        )}
        {key === "unavailable" && onRetry && (
          <button className="er-btn" type="button" onClick={onRetry}>
            Try again
          </button>
        )}
        {(key === "notfound" || key === "forbidden") && onBack && (
          <button className="er-btn" type="button" onClick={onBack}>
            Go back
          </button>
        )}
      </div>
    </section>
  );
}

export default ErrorState;
