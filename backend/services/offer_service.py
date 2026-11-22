# OWNER: VINCENT (Scrum Master / Offers Engine)
# TASKS:
# 1. Validate an offer (deadline not passed, not owner, etc.).
# 2. Find highest offer (tie-break by earliest).
# 3. Close auction and set winner.
# 4. Trigger outbid emails via Mailtrap.
# RULES:
# - Email failures must be logged, never block the offer submission.
# - Keep pure business logic here; routes should call these functions.

import os
import smtplib
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from extensions import db
from models import Listing, Offer, User

logger = logging.getLogger(__name__)


# ---------- VALIDATION ----------
def can_user_offer(user_id, listing):
    """Return (ok, error_message)."""
    if listing.user_id == user_id:
        return False, "You cannot offer on your own listing"
    if listing.status == "sold":
        return False, "This listing has already been sold"
    if listing.status == "closed":
        return False, "This auction has already closed"
    if listing.offer_ends_at and datetime.utcnow() > listing.offer_ends_at:
        return False, "The offer deadline has passed"
    return True, None


# ---------- HIGHEST OFFER LOGIC ----------
def get_highest_offer(listing_id):
    """Return the current highest active offer (tie-break: earliest)."""
    return (
        db.session.query(Offer)
        .filter_by(listing_id=listing_id, is_active=True)
        .order_by(Offer.amount.desc(), Offer.created_at.asc())
        .first()
    )


# ---------- EMAIL (MAILTRAP) ----------
def send_outbid_email(outbid_buyer, listing, new_amount):
    """Send 'you've been outbid' email via Mailtrap. Never raises."""
    try:
        username = os.environ.get("MAILTRAP_USERNAME")
        password = os.environ.get("MAILTRAP_PASSWORD")
        server = os.environ.get("MAILTRAP_SERVER", "sandbox.smtp.mailtrap.io")
        port = int(os.environ.get("MAILTRAP_PORT", 587))

        if not username or not password:
            logger.warning("Mailtrap credentials missing; skipping outbid email")
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"You've been outbid on '{listing.title}'"
        msg["From"] = "notifications@localloop.local"
        msg["To"] = outbid_buyer.email

        body = (
            f"Hi {outbid_buyer.name},\n\n"
            f"Someone placed a higher offer on \"{listing.title}\".\n\n"
            f"You can submit a new offer before the deadline:\n"
            f"Deadline: {listing.offer_ends_at}\n\n"
            f"— LocalLoop"
        )

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(server, port) as smtp:
            smtp.starttls()
            smtp.login(username, password)
            smtp.sendmail(msg["From"], [outbid_buyer.email], msg.as_string())

        logger.info(f"Outbid email sent to {outbid_buyer.email}")
    except Exception as e:
        # Fire-and-forget: never block the offer because email failed
        logger.error(f"Failed to send outbid email: {e}")


# ---------- SUBMIT OFFER ----------
def submit_offer(user_id, listing, amount, message=None):
    """
    Create or replace the current user's active offer.
    Returns (offer, error_message).
    """
    ok, err = can_user_offer(user_id, listing)
    if not ok:
        return None, err

    # Find previous highest offer BEFORE we insert the new one
    previous_top = get_highest_offer(listing.id)

    # Deactivate any existing offer by this user on this listing
    existing = (
        db.session.query(Offer)
        .filter_by(listing_id=listing.id, buyer_id=user_id, is_active=True)
        .first()
    )
    if existing:
        existing.is_active = False

    new_offer = Offer(
        listing_id=listing.id,
        buyer_id=user_id,
        amount=amount,
        message=message,
        is_active=True,
    )
    db.session.add(new_offer)
    db.session.flush()  # get new_offer.id before commit

    if (
        previous_top
        and previous_top.buyer_id != user_id
        and new_offer.amount > previous_top.amount
    ):
        # Deactivate the previous top offer — it's no longer the best bid
        previous_top.is_active = False

        # Send the outbid email once, and only once
        if not previous_top.outbid_notified:
            outbid_buyer = db.session.get(User, previous_top.buyer_id)
            if outbid_buyer:
                send_outbid_email(outbid_buyer, listing, new_offer.amount)
                previous_top.outbid_notified = True

    if listing.status == "active":
        listing.status = "open_for_offers"

    db.session.commit()
    return new_offer, None


# ---------- CLOSE AUCTION ----------
def close_listing_auction(listing):
    """
    Determine the winning offer and mark the listing as sold.
    Idempotent: safe to call multiple times.
    Returns (winner_offer or None, did_close: bool).
    """
    if listing.status in ("sold", "closed"):
        return None, False

    winning = get_highest_offer(listing.id)

    if winning:
        winning.is_winner = True
        winning.is_active = False
        listing.winner_id = winning.buyer_id
        listing.status = "sold"
    else:
        listing.status = "closed"

    db.session.commit()
    return winning, True


# ---------- AUTO-CLOSE ON READ ----------
def auto_close_if_expired(listing):
    """If deadline has passed and status is still open, close it."""
    if (
        listing.offer_ends_at
        and datetime.utcnow() > listing.offer_ends_at
        and listing.status in ("open_for_offers", "active")
    ):
        return close_listing_auction(listing)
    return None, False