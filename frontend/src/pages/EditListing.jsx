import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { getListingById, updateListing } from "../services/listings";
import "../styles/listing-forms.css";

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

function EditListing({ listingId, currentUser, onNavigate, onNotify }) {
  const [formData, setFormData] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentUserId = currentUser?.id ?? null;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        setFormData(null);

        if (currentUserId === null) {
          throw new Error("Sign in to edit your listings.");
        }

        const listing = await getListingById(listingId);
        if (!listing) throw new Error("This listing could not be found.");

        if (Number(listing.user_id) !== Number(currentUserId)) {
          throw new Error("You can only edit your own listings.");
        }

        if (mounted) {
          setFormData({
            title: listing.title || "",
            description: listing.description || "",
            price:
              listing.price === null || listing.price === undefined
                ? ""
                : String(listing.price),
            category: listing.category || "",
            condition: listing.condition || "",
            location: listing.location || "",
            image_url: listing.image_url || "",
          });
        }
      } catch (err) {
        if (mounted) setError(err.message || "Unable to load this listing.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [listingId, currentUserId]);

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
      setSaving(true);
      await updateListing(listingId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        condition: formData.condition,
        location: formData.location.trim(),
        image_url: formData.image_url.trim(),
      });
      setSuccess("Your listing has been updated.");
      onNotify?.("Your listing has been updated");
      window.setTimeout(() => onNavigate("/my-listings"), 700);
    } catch (err) {
      setError(err.message || "Unable to update the listing.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="listing-form-page">
        <p className="listing-form-status" role="status">Loading listing...</p>
      </main>
    );
  }

  if (!formData) {
    return (
      <main className="listing-form-page">
        <button
          type="button"
          className="listing-form-back"
          onClick={() => onNavigate("/my-listings")}
        >
          <ArrowLeft size={16} /> Back to my listings
        </button>
        <p className="listing-form-alert listing-form-error" role="alert">
          {error || "Unable to load this listing."}
        </p>
      </main>
    );
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
          <p>MANAGE YOUR LISTING</p>
          <h1>Edit listing</h1>
          <span>Keep the details accurate for potential buyers.</span>
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
              <label htmlFor="edit-title">
                Listing title <span className="listing-form-required">*</span>
              </label>
              <input
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                maxLength={150}
                required
                aria-invalid={fieldErrors.title ? true : undefined}
                aria-describedby={fieldErrors.title ? "edit-title-error" : undefined}
              />
              {fieldErrors.title && <small id="edit-title-error">{fieldErrors.title}</small>}
            </div>

            <div className="listing-form-field listing-form-full">
              <label htmlFor="edit-description">
                Description <span className="listing-form-required">*</span>
              </label>
              <textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                required
                aria-invalid={fieldErrors.description ? true : undefined}
                aria-describedby={
                  fieldErrors.description ? "edit-description-error" : undefined
                }
              />
              {fieldErrors.description && (
                <small id="edit-description-error">{fieldErrors.description}</small>
              )}
            </div>

            <div className="listing-form-field">
              <label htmlFor="edit-price">
                Price (KES) <span className="listing-form-required">*</span>
              </label>
              <input
                id="edit-price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={formData.price}
                onChange={handleChange}
                required
                aria-invalid={fieldErrors.price ? true : undefined}
                aria-describedby={fieldErrors.price ? "edit-price-error" : undefined}
              />
              {fieldErrors.price && <small id="edit-price-error">{fieldErrors.price}</small>}
            </div>

            <div className="listing-form-field">
              <label htmlFor="edit-category">
                Category <span className="listing-form-required">*</span>
              </label>
              <select
                id="edit-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                aria-invalid={fieldErrors.category ? true : undefined}
                aria-describedby={fieldErrors.category ? "edit-category-error" : undefined}
              >
                <option value="">Choose a category</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              {fieldErrors.category && (
                <small id="edit-category-error">{fieldErrors.category}</small>
              )}
            </div>

            <div className="listing-form-field">
              <label htmlFor="edit-condition">Condition</label>
              <select
                id="edit-condition"
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
              <label htmlFor="edit-location">Location</label>
              <input
                id="edit-location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="listing-form-field listing-form-full">
              <label htmlFor="edit-image_url">Image URL</label>
              <input
                id="edit-image_url"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleChange}
                aria-invalid={fieldErrors.image_url ? true : undefined}
                aria-describedby={fieldErrors.image_url ? "edit-image_url-error" : undefined}
              />
              {fieldErrors.image_url && (
                <small id="edit-image_url-error">{fieldErrors.image_url}</small>
              )}
            </div>
          </div>

          <button type="submit" className="listing-form-submit" disabled={saving}>
            <Save size={17} /> {saving ? "Saving changes..." : "Save changes"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default EditListing;