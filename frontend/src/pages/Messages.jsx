import { useCallback, useEffect, useState } from "react";
import { ImageOff, MessageCircle, Send } from "lucide-react";

import AccountTabs from "../components/AccountTabs";
import BackButton from "../components/BackButton";
import {
  getReceivedInquiries,
  getSentInquiries,
  replyToInquiry,
} from "../services/inquiries";
import { parseServerDate, timeAgo } from "../utils/dates";
import "../styles/listing-forms.css";
import "../styles/account.css";

/*
 * Messages: the questions buyers asked about your listings (Received) and
 * the questions you asked sellers (Sent), each with the seller's answer.
 * Sellers answer inline; buyers see the answer here.
 */

function Bubble({ who, text, when, mine }) {
  return (
    <div className={mine ? "msg-bubble is-mine" : "msg-bubble"}>
      <div className="msg-bubble-head">
        <strong>{who}</strong>
        <span>{timeAgo(parseServerDate(when))}</span>
      </div>
      <p>{text}</p>
    </div>
  );
}

function Conversation({ inquiry, side, onNavigate, onReplied, onNotify }) {
  const { listing } = inquiry;
  const isSeller = side === "received";
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const href = `/listings/${listing.id}`;

  async function submit(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    try {
      setSending(true);
      const data = await replyToInquiry(inquiry.id, text);
      onReplied(data?.inquiry);
      setDraft("");
      setOpen(false);
      onNotify?.("Reply sent");
    } catch (err) {
      onNotify?.(err.message || "Unable to send your reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <article className="acct-card msg-card">
      <a
        className="acct-thumb"
        href={href}
        aria-label={`View ${listing.title}`}
        onClick={(event) => {
          event.preventDefault();
          onNavigate(href);
        }}
      >
        {listing.image_url ? (
          <img src={listing.image_url} alt="" loading="lazy" />
        ) : (
          <ImageOff size={24} aria-hidden="true" />
        )}
      </a>

      <div className="acct-body">
        <div className="acct-top">
          <h2>
            <a
              href={href}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(href);
              }}
            >
              {listing.title}
            </a>
          </h2>
          {isSeller && !inquiry.reply && (
            <span className="acct-chip tone-warn">Needs reply</span>
          )}
          {!isSeller && !inquiry.reply && (
            <span className="acct-chip tone-info">Waiting for reply</span>
          )}
          {inquiry.reply && <span className="acct-chip tone-ok">Answered</span>}
        </div>

        <p className="acct-meta">
          {isSeller
            ? `From ${inquiry.buyer_name || "a buyer"}`
            : `To ${listing.seller_name || "the seller"}`}
        </p>

        <div className="msg-thread">
          <Bubble
            who={isSeller ? inquiry.buyer_name || "Buyer" : "You"}
            text={inquiry.message}
            when={inquiry.created_at}
            mine={!isSeller}
          />
          {inquiry.reply && (
            <Bubble
              who={isSeller ? "You" : listing.seller_name || "Seller"}
              text={inquiry.reply}
              when={inquiry.replied_at}
              mine={isSeller}
            />
          )}
        </div>

        {isSeller && !open && (
          <div className="acct-actions">
            <button type="button" className="acct-button" onClick={() => setOpen(true)}>
              <MessageCircle size={16} aria-hidden="true" />
              {inquiry.reply ? "Edit reply" : "Reply"}
            </button>
          </div>
        )}

        {isSeller && open && (
          <form className="msg-reply" onSubmit={submit}>
            <label htmlFor={`reply-${inquiry.id}`}>Your reply</label>
            <textarea
              id={`reply-${inquiry.id}`}
              rows={3}
              maxLength={2000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Yes, it's still available. You can collect it on..."
              autoFocus
              required
            />
            <div className="msg-reply-actions">
              <button type="button" className="acct-button is-quiet" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="acct-button is-primary" disabled={sending || !draft.trim()}>
                <Send size={15} aria-hidden="true" />
                {sending ? "Sending..." : "Send reply"}
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

function Messages({ currentUser, onNavigate, onBack, onNotify }) {
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [tab, setTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUserId = currentUser?.id ?? null;

  const load = useCallback(async () => {
    try {
      setError("");

      if (currentUserId === null) {
        throw new Error("Sign in to see your messages.");
      }

      const [inbox, outbox] = await Promise.all([
        getReceivedInquiries(),
        getSentInquiries(),
      ]);

      const inboxItems = inbox?.inquiries || [];
      setReceived(inboxItems);
      setSent(outbox?.inquiries || []);

      // Open on the side that has something waiting for you.
      setTab((current) =>
        current || (inboxItems.some((i) => !i.reply) || !(outbox?.inquiries || []).length
          ? "received"
          : "sent")
      );
    } catch (err) {
      setError(err.message || "Unable to load your messages.");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleReplied(updated) {
    if (!updated) return;
    setReceived((items) =>
      items.map((item) => (item.id === updated.id ? updated : item))
    );
  }

  const needsReply = received.filter((item) => !item.reply).length;
  const items = tab === "sent" ? sent : received;

  return (
    <main className="listing-form-page acct-page">
      <BackButton onBack={onBack} fallback="/" className="listing-form-back" />

      <div className="my-listings-heading">
        <div>
          <p>YOUR ACCOUNT</p>
          <h1>Messages</h1>
        </div>
      </div>

      <AccountTabs current="/messages" onNavigate={onNavigate} />

      {loading && <p className="listing-form-status" role="status">Loading your messages...</p>}

      {!loading && error && (
        <p className="listing-form-alert listing-form-error" role="alert">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="msg-switch" role="tablist" aria-label="Message folders">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "received"}
              className={tab === "received" ? "is-active" : ""}
              onClick={() => setTab("received")}
            >
              Received
              {needsReply > 0 && <span className="msg-count">{needsReply}</span>}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "sent"}
              className={tab === "sent" ? "is-active" : ""}
              onClick={() => setTab("sent")}
            >
              Sent
            </button>
          </div>

          {items.length === 0 ? (
            <section className="listing-form-empty">
              <h2>{tab === "sent" ? "No messages sent" : "No messages yet"}</h2>
              <p>
                {tab === "sent"
                  ? "Questions you ask sellers will appear here along with their answers."
                  : "When a buyer asks about one of your listings, their question will appear here."}
              </p>
              {tab === "sent" && (
                <button type="button" onClick={() => onNavigate("/listings")}>
                  Browse listings
                </button>
              )}
            </section>
          ) : (
            <div className="acct-list">
              {items.map((inquiry) => (
                <Conversation
                  key={inquiry.id}
                  inquiry={inquiry}
                  side={tab}
                  onNavigate={onNavigate}
                  onReplied={handleReplied}
                  onNotify={onNotify}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default Messages;