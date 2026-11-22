import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Pencil, CheckCircle2 } from "lucide-react";
import { deleteListing, getListings, markListingAsSold } from "../services/listings";
import { closeListingAuction, getListingOffers } from "../services/offers";
import { getListingInquiries } from "../services/inquiries";

const money = (value) => `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value || 0)}`;

export default function MyListings({ currentUser, onNavigate }) {
  const [listings, setListings] = useState([]);
  const [offers, setOffers] = useState({});
  const [inquiries, setInquiries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(null);

  async function refresh() {
    setLoading(true); setError("");
    try {
      const all = await getListings();
      const own = all.filter((listing) => listing.user_id === currentUser?.id);
      setListings(own);
      const activityResults = await Promise.all(own.map(async (item) => {
        const [offerResult, inquiryResult] = await Promise.all([
          item.status === "active" ? getListingOffers(item.id).catch(() => null) : null,
          getListingInquiries(item.id).catch(() => null),
        ]);
        return [item.id, offerResult, inquiryResult];
      }));
      setOffers(Object.fromEntries(activityResults.map(([id, result]) => [id, result])));
      setInquiries(Object.fromEntries(activityResults.map(([id, , result]) => [id, result?.inquiries || []])));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, [currentUser?.id]);

  async function action(id, operation) {
    setWorking(id); setError("");
    try { await operation(); await refresh(); }
    catch (err) { setError(err.message); }
    finally { setWorking(null); }
  }

  return (
    <main className="market-page">
      <button className="market-back" type="button" onClick={() => onNavigate("/")}><ArrowLeft size={16} /> Back to marketplace</button>
      <div className="market-heading-row"><div><p className="market-eyebrow">YOUR CORNER OF THE MARKET</p><h1>My listings</h1><p className="market-intro">Keep track of the things you’ve shared with the neighborhood.</p></div><button className="button-primary" type="button" onClick={() => onNavigate("/listings/new")}><Plus size={16} /> List an item</button></div>
      {error && <div className="market-error" role="alert">{error}</div>}
      {loading ? <p role="status">Loading your listings…</p> : listings.length === 0 ? <div className="market-empty"><h2>Your next listing starts here.</h2><p>Give a useful thing a new home nearby.</p><button className="button-primary" onClick={() => onNavigate("/listings/new")}>Create a listing</button></div> : <div className="manage-listings">
        {listings.map((listing) => {
          const listingOffers = offers[listing.id]?.offers || [];
          const listingInquiries = inquiries[listing.id] || [];
          return <article className="manage-listing" key={listing.id}>
            <div className="manage-listing-image">{listing.image_url ? <img src={listing.image_url} alt="" /> : <span>Community find</span>}</div>
            <div className="manage-listing-info"><p className="market-eyebrow">{listing.category} · {listing.status}</p><h2>{listing.title}</h2><p>{money(listing.price)}{listing.location ? ` · ${listing.location}` : ""}</p><p>{listingOffers.length} private {listingOffers.length === 1 ? "offer" : "offers"}</p>
              {listingOffers.length > 0 && <details><summary>Review offers</summary><ul className="offer-list">{listingOffers.map((offer) => <li key={offer.id}><strong>{money(offer.amount)}</strong>{offer.message && <span> — {offer.message}</span>}</li>)}</ul></details>}
              {listingInquiries.length > 0 && <details><summary>Questions from neighbors ({listingInquiries.length})</summary><ul className="offer-list">{listingInquiries.map((inquiry) => <li key={inquiry.id}><strong>Neighbor #{inquiry.buyer_id}</strong><span> — {inquiry.message}</span></li>)}</ul></details>}
              <div className="manage-actions"><button type="button" onClick={() => onNavigate(`/listings/${listing.id}/edit`)}><Pencil size={15} /> Edit</button>{listing.status === "active" && <button type="button" disabled={working === listing.id} onClick={() => action(listing.id, () => markListingAsSold(listing.id))}><CheckCircle2 size={15} /> Mark sold</button>}{listing.status === "active" && listingOffers.length > 0 && <button type="button" disabled={working === listing.id} onClick={() => action(listing.id, () => closeListingAuction(listing.id))}>Close offers</button>}<button className="danger-action" type="button" disabled={working === listing.id} onClick={() => { if (window.confirm("Delete this listing? This cannot be undone.")) action(listing.id, () => deleteListing(listing.id)); }}><Trash2 size={15} /> Delete</button></div>
            </div>
          </article>;
        })}
      </div>}
    </main>
  );
}
