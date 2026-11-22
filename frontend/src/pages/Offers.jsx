import { useEffect, useState } from "react";
import { ArrowLeft, Tag } from "lucide-react";
import { getListings } from "../services/listings";
import { getMyOffer } from "../services/offers";

const money = (value) => `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value || 0)}`;

export default function Offers({ onNavigate }) {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const listings = await getListings();
        const results = await Promise.all(listings.map(async (listing) => { try { const result = await getMyOffer(listing.id); return result.offer ? { listing, offer: result.offer, outbid: result.is_outbid } : null; } catch { return null; } }));
        if (active) setItems(results.filter(Boolean));
      } catch (err) { if (active) setError(err.message); }
      finally { if (active) setLoading(false); }
    }
    load(); return () => { active = false; };
  }, []);
  return <main className="market-page"><button className="market-back" onClick={() => onNavigate("/")}><ArrowLeft size={16} /> Back to marketplace</button><p className="market-eyebrow">PRIVATE OFFERS</p><h1>Your offers</h1><p className="market-intro">Only you and the seller can see the amount you offered.</p>{error && <div className="market-error" role="alert">{error}</div>}{loading ? <p role="status">Loading offers…</p> : items.length ? <div className="activity-list">{items.map(({ listing, offer, outbid }) => <article className="activity-card" key={offer.id}><Tag size={19} /><div><strong>{listing.title} · {money(offer.amount)}</strong><p>{offer.message || "Private offer"}</p><small>{outbid ? "Another buyer has made a higher offer" : offer.is_winner ? "You were selected" : listing.status === "active" ? "Waiting for the seller" : "Listing closed"}</small></div><button onClick={() => onNavigate(`/listings/${listing.id}`)}>View item</button></article>)}</div> : <div className="market-empty"><Tag size={24} /><h2>No offers made yet.</h2><p>Find an item you like and make a private offer to the seller.</p><button className="button-primary" onClick={() => onNavigate("/")}>Explore listings</button></div>}</main>;
}
