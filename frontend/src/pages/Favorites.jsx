import { useEffect, useState } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { getFavorites, removeFavorite } from "../services/favorites";

const money = (value) => `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value || 0)}`;

export default function Favorites({ onNavigate }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function refresh() {
    setLoading(true); setError("");
    try { const data = await getFavorites(); setListings((data.favorites || []).map((favorite) => favorite.listing)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  async function remove(id) {
    try { await removeFavorite(id); setListings((items) => items.filter((item) => item.id !== id)); }
    catch (err) { setError(err.message); }
  }
  return <main className="market-page"><button className="market-back" onClick={() => onNavigate("/")}><ArrowLeft size={16} /> Back to marketplace</button><p className="market-eyebrow">A LITTLE SOMETHING TO COME BACK TO</p><h1>Saved finds</h1><p className="market-intro">Items you’ve saved from your neighborhood.</p>{error && <div className="market-error" role="alert">{error}</div>}{loading ? <p role="status">Loading saved finds…</p> : listings.length === 0 ? <div className="market-empty"><Heart size={24} /><h2>No saved finds yet.</h2><p>Tap the heart on a listing and it’ll be waiting here.</p><button className="button-primary" onClick={() => onNavigate("/")}>Explore listings</button></div> : <div className="market-card-grid">{listings.map((item) => <article className="market-item-card" key={item.id}><button className="market-card-image" onClick={() => onNavigate(`/listings/${item.id}`)} aria-label={`View ${item.title}`}>{item.image_url ? <img src={item.image_url} alt="" /> : <span>Community find</span>}</button><div><p className="market-eyebrow">{item.category}</p><h2>{item.title}</h2><p>{money(item.price)} · {item.location || "Nearby"}</p><div className="manage-actions"><button onClick={() => onNavigate(`/listings/${item.id}`)}>View item</button><button className="danger-action" onClick={() => remove(item.id)}><Heart size={15} /> Remove</button></div></div></article>)}</div>}</main>;
}
