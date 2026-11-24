import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Save, X } from "lucide-react";
import { getListingById, updateListing } from "../services/listings";
import BackButton from "../components/BackButton";
import DeadlineField from "../components/DeadlineField";
import {
  localInputToServerUtc,
  parseServerDate,
  toLocalInputValue,
} from "../utils/dates";
import "../styles/listing-forms.css";

const CATEGORIES = ["Electronics", "Furniture", "Clothing", "Sports", "Books", "Home", "Other"];
const CONDITIONS = ["New", "Like new", "Good", "Fair", "For parts"];

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function uploadImageFile(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `Image is too large. Max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB.`
    );
  }

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Image uploads are not configured. Add VITE_CLOUDINARY_CLOUD_NAME and " +
      "VITE_CLOUDINARY_UPLOAD_PRESET to frontend/.env and restart the dev server."
    );
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body }
  );

  if (!res.ok) {
    let message = "Upload failed. Please try again.";
    try {
      const err = await res.json();
      if (err?.error?.message) message = err.error.message;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }

  const data = await res.json();
  if (!data?.secure_url) throw new Error("Upload failed. Please try again.");
  return data.secure_url;
}

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function validateListingForm(form, initialDeadline = "") {
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

  // Only complain about a past deadline if the seller changed it, so an
  // old deadline never blocks saving unrelated edits.
  if (form.offer_ends_at && form.offer_ends_at !== initialDeadline) {
    const deadline = new Date(form.offer_ends_at);
    if (Number.isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
      errors.offer_ends_at = "Choose a time in the future.";
    }
  }

  return errors;
}

function EditListing({ listingId, currentUser, onNavigate, onNotify, onBack }) {
  const [formData, setFormData] = useState(null);
  const [listingStatus, setListingStatus] = useState("");
  const initialDeadlineRef = useRef("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
          initialDeadlineRef.current = toLocalInputValue(
            parseServerDate(listing.offer_ends_at)
          );
          setListingStatus(listing.status || "");
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
            offer_ends_at: initialDeadlineRef.current,
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
    if (name === "image_url") setImageError("");
  }

  async function processImageFile(file) {
    setImageError("");
    try {
      setUploading(true);
      const url = await uploadImageFile(file);
      setFormData((previous) => ({ ...previous, image_url: url }));
      setFieldErrors((previous) => {
        if (!previous.image_url) return previous;
        const next = { ...previous };
        delete next.image_url;
        return next;
      });
    } catch (err) {
      setImageError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileInput(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await processImageFile(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
    if (!uploading) setIsDragging(true);
  }
  function handleDragLeave() {
    setIsDragging(false);
  }
  async function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    if (uploading) return;
    const file = event.dataTransfer.files?.[0];
    if (file) await processImageFile(file);
  }

  function removeImage() {
    setFormData((previous) => ({ ...previous, image_url: "" }));
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const nextErrors = validateListingForm(formData, initialDeadlineRef.current);
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
        offer_ends_at: localInputToServerUtc(formData.offer_ends_at),
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
        <BackButton onBack={onBack} fallback="/my-listings" className="listing-form-back" />
        <p className="listing-form-alert listing-form-error" role="alert">
          {error || "Unable to load this listing."}
        </p>
      </main>
    );
  }

  const hasImage = Boolean(formData.image_url);

  return (
    <main className="listing-form-page">
      <BackButton onBack={onBack} fallback="/my-listings" className="listing-form-back" />

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

            <div className="listing-form-field listing-form-full">
              <span className="listing-form-field-label">Photo</span>

              <input
                id="edit-image-file"
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileInput}
                hidden
              />

              {uploading ? (
                <div className="listing-image-dropzone is-uploading">
                  <Loader2 size={28} className="listing-image-spinner" />
                  <span>Uploading photo...</span>
                </div>
              ) : hasImage ? (
                <div className="listing-image-preview">
                  <img src={formData.image_url} alt="Listing preview" />
                  <div className="listing-image-actions">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <RefreshCw size={14} /> Replace
                    </button>
                    <button
                      type="button"
                      className="listing-image-remove"
                      onClick={removeImage}
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={`listing-image-dropzone${isDragging ? " is-dragging" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <ImagePlus size={28} />
                  <span>Click to upload or drag &amp; drop</span>
                  <small>PNG, JPG, WEBP or GIF · up to 5MB</small>
                </button>
              )}

              {imageError && <small className="listing-form-image-error">{imageError}</small>}
              {fieldErrors.image_url && <small>{fieldErrors.image_url}</small>}

              <details className="listing-image-url">
                <summary>{hasImage ? "Edit image URL" : "Or paste an image URL"}</summary>
                <input
                  id="edit-image_url"
                  name="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </details>
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

            <DeadlineField
              id="edit-offer-ends-at"
              value={formData.offer_ends_at}
              error={fieldErrors.offer_ends_at}
              onChange={(value) => {
                setFormData((previous) => ({ ...previous, offer_ends_at: value }));
                setFieldErrors((previous) => {
                  if (!previous.offer_ends_at) return previous;
                  const next = { ...previous };
                  delete next.offer_ends_at;
                  return next;
                });
              }}
            />

            {(listingStatus === "sold" || listingStatus === "closed") && (
              <p className="listing-form-hint listing-form-full">
                This listing is already {listingStatus}, so changing the
                deadline will not reopen it for offers.
              </p>
            )}
          </div>

          <button type="submit" className="listing-form-submit" disabled={saving || uploading}>
            <Save size={17} /> {saving ? "Saving changes..." : "Save changes"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default EditListing;