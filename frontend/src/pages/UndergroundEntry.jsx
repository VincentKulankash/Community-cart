import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import {
  getUndergroundAgeVerification,
  submitUndergroundAgeVerification,
} from "../services/underground";
import UndergroundHome from "./UndergroundHome";

export default function UndergroundEntry({ onNavigate }) {
  const [verification, setVerification] = useState(null);
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    getUndergroundAgeVerification()
      .then((result) => {
        if (active) setVerification(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    const previousTitle = document.title;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const previousThemeColor = themeColor?.content;
    document.title = "Underground — Community Cart";
    themeColor?.setAttribute("content", "#171717");

    return () => {
      document.title = previousTitle;
      if (previousThemeColor) {
        themeColor?.setAttribute("content", previousThemeColor);
      }
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const enteredAge = Number(age);
    if (!Number.isInteger(enteredAge) || enteredAge < 0 || enteredAge > 130) {
      setError("Enter a whole-number age between 0 and 130.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitUndergroundAgeVerification(enteredAge);
      setVerification(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (verification?.verified) {
    return <UndergroundHome onNavigate={onNavigate} />;
  }

  return (
    <main className="underground-entry">
      <section className="underground-entry-card" aria-labelledby="underground-title">
        <p className="underground-entry-kicker">COMMUNITY CART / UNDERGROUND</p>
        <div className="underground-entry-mark" aria-hidden="true">
          <ShieldCheck size={25} />
        </div>

        {loading ? (
          <>
            <h1 id="underground-title">Checking your pass.</h1>
            <div className="underground-entry-status" role="status">
              Checking your entry status…
            </div>
          </>
        ) : error && !verification ? (
          <>
            <h1 id="underground-title">Entry check unavailable.</h1>
            <p className="underground-entry-copy" role="alert">{error}</p>
            <button
              className="underground-entry-button"
              type="button"
              onClick={() => {
                setError("");
                setLoading(true);
                setAttempt((current) => current + 1);
              }}
            >
              Try again <ArrowRight size={17} />
            </button>
          </>
        ) : (
          <>
            <h1 id="underground-title">A different kind of marketplace.</h1>
            <p className="underground-entry-copy">
              Confirm that you’re at least {verification?.minimum_age ?? 18} to
              enter this age-restricted area.
            </p>
            <form className="underground-entry-form" onSubmit={handleSubmit}>
              <label htmlFor="underground-age">Your age</label>
              <input
                id="underground-age"
                name="age"
                type="number"
                inputMode="numeric"
                min="0"
                max="130"
                step="1"
                required
                value={age}
                onChange={(event) => setAge(event.target.value)}
                aria-describedby="underground-age-note"
              />
              <p id="underground-age-note" className="underground-entry-note">
                This self-attested age check is not proof of age. We don’t ask
                for or store your birth date.
              </p>
              {error && <p className="underground-entry-error" role="alert">{error}</p>}
              <button
                className="underground-entry-button"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Checking…" : "Continue"} <ArrowRight size={17} />
              </button>
            </form>
            <button
              className="underground-entry-back"
              type="button"
              onClick={() => onNavigate("/")}
            >
              <ArrowLeft size={15} /> Leave Underground
            </button>
          </>
        )}
      </section>
    </main>
  );
}
