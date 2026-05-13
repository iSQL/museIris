// localStorage cache of the customer's booking access tokens. The server is
// the source of truth for everything else — this just remembers which bookings
// belong to "me" so the My Bookings page can fetch them by token.

const KEY = "museIris:bookings";
const STALE_DAYS = 30;

function read() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* quota / disabled */
  }
}

export function listEntries() {
  return read();
}

export function addEntry({ id, accessToken }) {
  if (!id || !accessToken) return;
  const now = new Date().toISOString();
  const cur = read().filter((e) => e.id !== id);
  cur.unshift({ id, accessToken, createdAt: now });
  write(cur);
}

export function removeEntry(id) {
  write(read().filter((e) => e.id !== id));
}

// Drop entries whose stored booking date is more than STALE_DAYS in the past.
// Caller passes the booking record (or null on 404) keyed by id.
export function pruneStale(byId) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALE_DAYS);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const kept = read().filter((e) => {
    const b = byId.get(e.id);
    if (b === null) return false; // 404 → drop
    if (b && b.date && b.date < cutoffIso) return false; // long past
    return true;
  });
  if (kept.length !== read().length) write(kept);
}
