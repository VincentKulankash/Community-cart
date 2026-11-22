import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { createListing, getListingById, updateListing } from "../services/listings";

const emptyForm = { title: "", description: "", price: "", category: "", condition: "Good", image_url: "", location: "" };

export default function ListingForm({ listingId, onNavigate, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(listingId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!listingId) return;
    let active = true;
    getListingById(listingId)
      .then((listing) => {
        if (active) setForm({ ...emptyForm, ...listing, price: String(listing.price) });
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [listingId]);

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price of zero or more.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, price };
      const listing = listingId ? await updateListing(listingId, payload) : await createListing(payload);
      onSaved(listing);
    } catch (err) {
      setError(err.message || "Unable to save this listing.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="market-page"><p role="status">Loading your listing…</p></main>;

  return (
    <main className="market-page">
      <button className="market-back" type="button" onClick={() => onNavigate("/my-listings")}><ArrowLeft size={16} /> Back to my listings</button>
      <section className="market-panel">
        <p className="market-eyebrow">PASS IT FORWARD</p>
        <h1>{listingId ? "Make an update." : "Give it a new home."}</h1>
        <p className="market-intro">Add the details a nearby buyer needs to know.</p>
        {error && <div className="market-error" role="alert">{error}</div>}
        <form className="market-form" onSubmit={submit}>
          <label>Item title<input name="title" value={form.title} onChange={change} maxLength={150} required /></label>
          <label>Description<textarea name="description" value={form.description} onChange={change} rows={5} required /></label>
          <div className="market-form-row">
            <label>Price (KES)<input name="price" type="number" min="0" step="1" value={form.price} onChange={change} required /></label>
            <label>Category<input name="category" value={form.category} onChange={change} maxLength={100} placeholder="Furniture, books…" required /></label>
          </div>
          <div className="market-form-row">
            <label>Condition<select name="condition" value={form.condition} onChange={change}><option>Like New</option><option>Good</option><option>Fair</option><option>For parts</option></select></label>
            <label>Pickup area<input name="location" value={form.location} onChange={change} maxLength={150} placeholder="Neighborhood or city" /></label>
          </div>
          <label><span className="market-label-icon"><ImagePlus size={16} /> Image URL (optional)</span><input name="image_url" type="url" value={form.image_url || ""} onChange={change} placeholder="https://…" /></label>
          <div className="market-form-actions"><button className="button-primary" disabled={saving}>{saving ? "Saving…" : listingId ? "Save changes" : "Publish listing"}</button><button className="market-cancel" type="button" onClick={() => onNavigate("/my-listings")}>Cancel</button></div>
        </form>
      </section>
    </main>
  );
}
