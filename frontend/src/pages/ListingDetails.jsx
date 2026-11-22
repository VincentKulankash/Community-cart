import { useEffect, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { getListingById } from "../services/listings";
import { sendInquiry } from "../services/inquiries";
import { getMyOffer, submitOffer } from "../services/offers";

const money = (value) => `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value || 0)}`;

export default function ListingDetails({ listingId, currentUser, onNavigate, onSignIn }) {
  const [listing, setListing] = useState(null);
  const [offer, setOffer] = useState(null);
  const [offerNote, setOfferNote] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    getListingById(listingId)
      .then((data) => active && setListing(data))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    if (currentUser) getMyOffer(listingId).then((data) => active && setOffer(data.offer)).catch(() => {});
    return () => { active = false; };
  }, [listingId, currentUser]);

  async function send(kind, event) {
    event.preventDefault();
    if (!currentUser) { onSignIn(); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      if (kind === "inquiry") {
        await sendInquiry(listingId, inquiryMessage);
        setInquiryMessage(""); setNotice("Your message was sent to the seller.");
      } else {
        const result = await submitOffer(listingId, Number(amount), offerNote || undefined);
        setOffer(result); setAmount(""); setOfferNote(""); setNotice("Your offer is in. The seller can review it privately.");
      }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="market-page"><p role="status">Loading item…</p></main>;
  if (!listing) return <main className="market-page"><p className="market-error" role="alert">{error || "This listing could not be found."}</p><button className="market-back" onClick={() => onNavigate("/")}><ArrowLeft size={16} /> Back to finds</button></main>;
  const isOwner = currentUser?.id === listing.user_id;

  return (
    <main className="market-page">
      <button className="market-back" type="button" onClick={() => onNavigate("/")}><ArrowLeft size={16} /> Back to finds</button>
      <div className="detail-layout">
        <div className="detail-image">{listing.image_url ? <img src={listing.image_url} alt={listing.title} /> : <div className="detail-image-empty">A good thing, ready for a new home.</div>}</div>
        <article className="detail-copy">
          <p className="market-eyebrow">{listing.category} · {listing.condition || "Pre-loved"}</p>
          <h1>{listing.title}</h1>
          <p className="detail-price">{money(listing.price)}</p>
          <p className="detail-description">{listing.description}</p>
          {listing.location && <p className="detail-location"><MapPin size={16} /> {listing.location}</p>}
          <p className="detail-seller">Shared by a neighbor · Seller #{listing.user_id}</p>
          {error && <div className="market-error" role="alert">{error}</div>}
          {notice && <div className="market-success" role="status">{notice}</div>}
          {isOwner ? <div className="market-panel compact"><strong>This is your listing.</strong><p>Manage it from your listings page.</p><button className="button-primary" onClick={() => onNavigate("/my-listings")}>Manage listing</button></div> : listing.status !== "active" ? <p className="market-status">This item is no longer available.</p> : currentUser && offer ? <div className="market-success">You have already made a private offer of {money(offer.amount)}.</div> : (
            <div className="detail-actions">
              <form className="market-form" onSubmit={(event) => send("offer", event)}>
                <h2>Make a private offer</h2>
                <label>Your offer (KES)<input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
                <label>Note to the seller <textarea rows={3} value={offerNote} onChange={(event) => setOfferNote(event.target.value)} placeholder="Optional pickup details" /></label>
                <button className="button-primary" disabled={busy}>{busy ? "Sending…" : "Send private offer"}</button>
              </form>
              <form className="market-form inquiry-form" onSubmit={(event) => send("inquiry", event)}>
                <h2>Ask the seller</h2>
                <label>Message<textarea rows={3} value={inquiryMessage} onChange={(event) => setInquiryMessage(event.target.value)} placeholder="Is this still available?" required /></label>
                <button className="market-outline-button" disabled={busy}>{busy ? "Sending…" : "Send a message"}</button>
              </form>
              {!currentUser && <p className="detail-seller">Sign in is required to contact a seller or make an offer.</p>}
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
