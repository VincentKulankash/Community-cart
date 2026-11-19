import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Inbox, LoaderCircle, Send } from "lucide-react";

import {
  getListingInquiries,
  getSentInquiries,
  sendInquiry,
} from "../services/inquiries";
import "../styles/inquiries.css";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Inquiries
 *
 * Props:
 * - listingId: listing to submit/view inquiries for
 * - listingOwnerId / listing: owner information
 * - currentUserId / currentUser: authenticated user
 * - sentOnly: force the user's sent-inquiries view
 */
export default function Inquiries({
  listingId = null,
  listing = null,
  listingOwnerId = listing?.user_id ?? null,
  currentUser = null,
  currentUserId = currentUser?.id ?? null,
  sentOnly = false,
}) {
  const [inquiries, setInquiries] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const ownerView = Boolean(
    listingId &&
      currentUserId != null &&
      listingOwnerId != null &&
      Number(currentUserId) === Number(listingOwnerId)
  );

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = sentOnly || !listingId
        ? await getSentInquiries()
        : ownerView
          ? await getListingInquiries(listingId)
          : null;

      if (data) setInquiries(data.inquiries || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load inquiries.");
    } finally {
      setLoading(false);
    }
  }, [listingId, ownerView, sentOnly]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Please enter a message.");
      setSuccess("");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await sendInquiry(listingId, trimmedMessage);
      setMessage("");
      setSuccess("Inquiry sent successfully.");
      await loadInquiries();
    } catch (requestError) {
      setError(requestError.message || "Unable to send your inquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  const isListingForm = Boolean(listingId) && !ownerView;

  return (
    <section className="inquiries-panel" aria-label="Inquiries">
      {isListingForm && (
        <form className="inquiry-form" onSubmit={handleSubmit}>
          <div>
            <span className="inquiries-eyebrow">CONTACT THE SELLER</span>
            <h2>Ask a question</h2>
          </div>

          <label htmlFor="inquiry-message">Message</label>
          <textarea
            id="inquiry-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Is this still available?"
            maxLength={1000}
            disabled={submitting}
          />

          <button className="inquiries-primary-button" type="submit" disabled={submitting}>
            {submitting ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}
            {submitting ? "Sending..." : "Send inquiry"}
          </button>
        </form>
      )}

      {success && (
        <div className="inquiries-message inquiries-success" role="status">
          <CheckCircle2 size={17} /> {success}
        </div>
      )}

      {error && (
        <div className="inquiries-message inquiries-error" role="alert">
          <AlertCircle size={17} /> {error}
        </div>
      )}

      {!isListingForm && (
        <div className="inquiries-list-header">
          <div>
            <span className="inquiries-eyebrow">
              {ownerView ? "INQUIRIES RECEIVED" : "INQUIRIES SENT"}
            </span>
            <h2>{ownerView ? "Buyer questions" : "Your questions"}</h2>
          </div>
          {!loading && <span className="inquiries-count">{inquiries.length}</span>}
        </div>
      )}

      {!isListingForm && loading && (
        <div className="inquiries-loading" role="status">
          <LoaderCircle className="spin" size={20} /> Loading inquiries...
        </div>
      )}

      {!isListingForm && !loading && inquiries.length === 0 && (
        <div className="inquiries-empty">
          <Inbox size={28} />
          <h3>No inquiries yet</h3>
          <p>
            {ownerView
              ? "Buyer questions about this listing will appear here."
              : "Questions you send to sellers will appear here."}
          </p>
        </div>
      )}

      {!isListingForm && !loading && inquiries.length > 0 && (
        <div className="inquiries-list">
          {inquiries.map((inquiry) => (
            <article className="inquiry-card" key={inquiry.id}>
              <div className="inquiry-card-meta">
                <span>Inquiry #{inquiry.id}</span>
                {formatDate(inquiry.created_at) && <time>{formatDate(inquiry.created_at)}</time>}
              </div>
              <p>{inquiry.message}</p>
              <span className="inquiry-listing-id">Listing #{inquiry.listing_id}</span>
            </article>
          ))}
        </div>
      )}

      {!loading && isListingForm && inquiries.length === 0 && (
        <p className="inquiries-help">Your sent inquiry will be visible to the listing owner.</p>
      )}
    </section>
  );
}
