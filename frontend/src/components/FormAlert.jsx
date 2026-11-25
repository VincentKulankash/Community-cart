import "../styles/errors.css";

// Message for one field, e.g. getFieldError(error, "price").
export function getFieldError(error, field) {
  return error?.fieldErrors?.[field] || "";
}

function labelize(field) {
  return field.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/*
 * Form-level alert. Pass the caught error (or a string):
 *   <FormAlert error={error} />
 * Lists any per-field messages the backend returned.
 */
function FormAlert({ error }) {
  if (!error) return null;

  const message = typeof error === "string" ? error : error.message;
  const entries =
    typeof error === "object" ? Object.entries(error.fieldErrors || {}) : [];

  return (
    <div className="er-alert" role="alert">
      <p>{message}</p>
      {entries.length > 0 && (
        <ul>
          {entries.map(([field, text]) => (
            <li key={field}>
              <strong>{labelize(field)}:</strong> {text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FormAlert;
