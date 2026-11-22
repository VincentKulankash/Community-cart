import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { getSentInquiries } from "../services/inquiries";

export default function Inquiries({ onNavigate }) {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let active = true; getSentInquiries().then((data) => active && setItems(data.inquiries || [])).catch((err) => active && setError(err.message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, []);
  return <main className="market-page"><button className="market-back" onClick={() => onNavigate("/")}><ArrowLeft size={16} /> Back to marketplace</button><p className="market-eyebrow">YOUR CONVERSATIONS</p><h1>Messages sent</h1><p className="market-intro">Keep up with questions you’ve sent to neighbors.</p>{error && <div className="market-error" role="alert">{error}</div>}{loading ? <p role="status">Loading messages…</p> : items.length ? <div className="activity-list">{items.map((item) => <article className="activity-card" key={item.id}><MessageCircle size={19} /><div><p>{item.message}</p><small>Listing #{item.listing_id} · {item.created_at ? new Date(item.created_at).toLocaleString() : "Recently"}</small></div><button onClick={() => onNavigate(`/listings/${item.listing_id}`)}>View item</button></article>)}</div> : <div className="market-empty"><MessageCircle size={24} /><h2>No messages sent yet.</h2><p>Ask a seller about an item to start a conversation.</p><button className="button-primary" onClick={() => onNavigate("/")}>Explore listings</button></div>}</main>;
}
