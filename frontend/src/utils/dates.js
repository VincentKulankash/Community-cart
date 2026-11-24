/*
 * Date helpers shared by the listing pages.
 *
 * The API stores and returns deadlines as naive UTC timestamps (no "Z"),
 * and the backend compares them against utcnow(). These helpers convert
 * between that format and the viewer's local time so the time a seller
 * picks is the time buyers see and the server enforces.
 */

// "2026-11-20T11:17:00.123456" (UTC, no zone) -> Date
export function parseServerDate(value) {
  if (!value) return null;

  const text = String(value).replace(/(\.\d{3})\d+/, "$1");
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(text);
  const date = new Date(hasZone ? text : `${text}Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

// Date -> "Fri, 20 Nov, 2:17 pm" in the viewer's local time
export function formatDeadline(date) {
  return date.toLocaleString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Date -> "YYYY-MM-DDTHH:mm" in LOCAL time, for <input type="datetime-local">
export function toLocalInputValue(date) {
  if (!date) return "";

  const pad = (n) => String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

// "YYYY-MM-DDTHH:mm" (local) -> "YYYY-MM-DDTHH:mm:ss" (naive UTC) for the API
export function localInputToServerUtc(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 19);
}

// Date -> "just now", "5m ago", "3h ago", "2d ago", or "12 Oct"
export function timeAgo(date) {
  if (!date) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}