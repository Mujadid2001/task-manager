/**
 * Date formatting helpers.
 *
 * The locale is pinned so the output does not depend on the visitor's
 * browser settings, which also keeps the server and the client in agreement.
 */

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formats an ISO timestamp as a short date, e.g. `21 Oct 2026`. */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);

  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : dateFormatter.format(date);
}

/** Formats an ISO timestamp as a date and time, e.g. `21 Oct 2026, 17:54`. */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);

  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : dateTimeFormatter.format(date);
}
