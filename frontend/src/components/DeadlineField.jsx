import { CalendarClock } from "lucide-react";
import { toLocalInputValue } from "../utils/dates";

const PRESETS = [
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "1 week", hours: 168 },
];

/*
 * Optional "offers close at" field for the create and edit listing forms.
 * Value is the raw datetime-local string ("YYYY-MM-DDTHH:mm", local time).
 */
function DeadlineField({ id, value, onChange, error, min }) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function applyPreset(hours) {
    onChange(toLocalInputValue(new Date(Date.now() + hours * 60 * 60 * 1000)));
  }

  return (
    <div className="listing-form-field listing-form-full">
      <label htmlFor={id}>
        <CalendarClock size={15} aria-hidden="true" /> Offers close at{" "}
        <span className="listing-form-optional">(optional)</span>
      </label>

      <input
        id={id}
        name="offer_ends_at"
        type="datetime-local"
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint`}
      />

      <div className="deadline-presets" role="group" aria-label="Quick deadline">
        {PRESETS.map((preset) => (
          <button
            type="button"
            key={preset.label}
            onClick={() => applyPreset(preset.hours)}
          >
            {preset.label}
          </button>
        ))}
        {value && (
          <button type="button" className="deadline-clear" onClick={() => onChange("")}>
            No deadline
          </button>
        )}
      </div>

      {error && <small>{error}</small>}

      <p className="listing-form-hint" id={`${id}-hint`}>
        Buyers can send private offers until this time. Leave it empty to
        keep offers open until you choose one. Times are in your local time
        ({timeZone}).
      </p>
    </div>
  );
}

export default DeadlineField;