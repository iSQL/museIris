import { query } from "../db.js";

const MIN_COUNTER = 2500;

export async function nextBookingId() {
  const { rows } = await query(
    "SELECT MAX(CAST(SUBSTRING(id FROM 3) AS INTEGER)) AS max_n FROM bookings WHERE id LIKE 'B-%'"
  );
  const maxN = rows[0]?.max_n ?? null;
  const n = Math.max(MIN_COUNTER, (maxN || 0) + 1);
  return `B-${n}`;
}
