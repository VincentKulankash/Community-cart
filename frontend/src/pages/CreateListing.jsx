import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { createListing } from "../services/listings";
import "../styles/listing-forms.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  price: "",
  category: "",
  condition: "",
  location: "",
  image_url: "",
};

const CATEGORIES = ["Electronics", "Furniture", "Clothing", "Sports", "Books", "Home", "Other"];
const CONDITIONS = ["New", "Like new", "Good", "Fair", "For parts"];

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function validateListingForm(form) {
  const errors = {};
  const title = form.title.trim();

  if (!title) errors.title = "Enter a listing title.";
  else if (title.length > 150) errors.title = "Title must be 150 characters or fewer.";

  if (!form.description.trim()) errors.description = "Enter a description.";
  if (!form.category) errors.category = "Choose a category.";

  const imageUrl = form.image_url.trim();
  if (imageUrl && !isHttpUrl(imageUrl)) {
    errors.image_url = "Enter a valid image URL starting with http:// or https://.";
  }

  const price = Number(form.price);
  if (!String(form.price).trim() || !Number.isFinite(price) || price <= 0) {
    errors.price = "Enter a price greater than 0.";
  }

  return errors;
}

function CreateListing({ onNavigate, onNotify }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => {
      if (!previous[name]) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const nextErrors = validateListingForm(formData);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setLoading(true);
      await createListing({
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        condition: formData.condition,
        location: formData.location.trim(),
        image_url: formData.image_url.trim(),
      });
      setSuccess("Your listing has been created.");
      onNotify?.("Your listing has been created");
      window.setTimeout(() => onNavigate("/my-listings"), 700);
    } catch (err) {
      setError(err.message || "Unable to create the listing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="listing-form-page">
      <button
        type="button"
        className="listing-form-back"
        onClick={() => onNavigate("/my-listings")}
      >
        <ArrowLeft size={16} /> Back to my listings
      </button>

      <section className="listing-form-card">
        <div className="listing-form-heading">
          <p>SELL ON LOCALLOOP</p>
          <h1>Create a listing</h1>
          <span>Add the details buyers need to discover and contact you.</span>
        </div>

        {error && (
          <div className="listing-form-alert listing-form-error" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="listing-form-alert listing-form-success" role="status">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="listing-form-grid">
            <div className="listing-form-field listing-form-full">
              <label htmlFor="create-title">
                Listing title <span className="listing-form-required">*</span>
              </label>
              <input
                id="create-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                maxLength={150}
                placeholder="What are you selling?"
                required
                aria-invalid={fieldErrors.title ? true : undefined}
                aria-describedby={fieldErrors.title ? "create-title-error" : undefined}
              />
              {fieldErrors.title && <small id="create-title-error">{fieldErrors.title}</small>}
            </div>

            <div className="listing-form-field listing-form-full">
              <label htmlFor="create-description">
                Description <span className="listing-form-required">*</span>
              </label>
              <textarea
                id="create-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                placeholder="Share its condition, history, and anything buyers should know."
                required
                aria-invalid={fieldErrors.description ? true : undefined}
                aria-describedby={fieldErrors.description ? "create-description-error" : undefined}
              />
              {fieldErrors.description && (
                <small id="create-description-error">{fieldErrors.description}</small>
              )}
            </div>

            <div className="listing-form-field">
              <label htmlFor="create-price">
                Price (KES) <span className="listing-form-required">*</span>
              </label>
              <input
                id="create-price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                required
                aria-invalid={fieldErrors.price ? true : undefined}
                aria-describedby={fieldErrors.price ? "create-price-error" : undefined}
              />
              {fieldErrors.price && <small id="create-price-error">{fieldErrors.price}</small>}
            </div>

            <div className="listing-form-field">
              <label htmlFor="create-category">
                Category <span className="listing-form-required">*</span>
              </label>
              <select
                id="create-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                aria-invalid={fieldErrors.category ? true : undefined}
                aria-describedby={fieldErrors.category ? "create-category-error" : undefined}
              >
                <option value="">Choose a category</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {fieldErrors.category && (
                <small id="create-category-error">{fieldErrors.category}</small>
              )}
            </div>

            <div className="listing-form-field">
              <label htmlFor="create-condition">Condition</label>
              <select
                id="create-condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
              >
                <option value="">Choose condition</option>
                {CONDITIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="listing-form-field">
              <label htmlFor="create-location">Location</label>
              <input
                id="create-location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Nairobi"
              />
            </div>

            <div className="listing-form-field listing-form-full">
              <label htmlFor="create-image_url">Image URL</label>
              <input
                id="create-image_url"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                aria-invalid={fieldErrors.image_url ? true : undefined}
                aria-describedby={fieldErrors.image_url ? "create-image_url-error" : undefined}
              />
              {fieldErrors.image_url && (
                <small id="create-image_url-error">{fieldErrors.image_url}</small>
              )}
            </div>
          </div>

          <button type="submit" className="listing-form-submit" disabled={loading}>
            <Plus size={17} /> {loading ? "Creating listing..." : "Create listing"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default CreateListing;