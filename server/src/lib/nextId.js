import { db } from "../db.js";

const stmt = db.prepare(
  "SELECT MAX(CAST(SUBSTR(id, 3) AS INTEGER)) AS maxN FROM bookings WHERE id LIKE 'B-%'"
);

const MIN_COUNTER = 2500;

export function nextBookingId() {
  const { maxN } = stmt.get() || { maxN: null };
  const n = Math.max(MIN_COUNTER, (maxN || 0) + 1);
  return `B-${n}`;
}
