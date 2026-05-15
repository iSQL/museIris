import "dotenv/config";
import pg from "pg";

const { Pool, types } = pg;

// Keep DATE and TIME as plain strings ("YYYY-MM-DD" and "HH:MM:SS"). The
// defaults convert DATE to a JS Date at local-midnight, which a tz-aware
// toISOString() then shifts back a day for any host in a positive UTC offset
// (e.g. Europe/Belgrade). Wall-clock at the salon is the source of truth here,
// so strings are the cleaner shape.
types.setTypeParser(types.builtins.DATE, (val) => val);
types.setTypeParser(types.builtins.TIME, (val) => val);

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://museiris:museiris_dev@localhost:5432/museiris";

export const pool = new Pool({
  connectionString,
  // Keep the pool small for a single-master salon — most days will see <100
  // requests; this header keeps idle resources from piling up on Coolify.
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  console.error("[db] unexpected pool error:", err);
});

// Thin Pool.query wrapper for one-off statements.
export const query = (text, params) => pool.query(text, params);

// Convenience for transactional ops; passes a checked-out client to fn.
export async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

// Map a bookings row (snake_case) to the API shape (camelCase + nested client).
// Dates come back as JS Date for `date` and as `HH:MM:SS` string for `time` —
// normalize both to the wall-clock strings the UI/seed already use.
export function rowToBooking(row, { includeAccessToken = false } = {}) {
  if (!row) return null;
  const date =
    row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date;
  const time = typeof row.time === "string" ? row.time.slice(0, 5) : row.time;
  const out = {
    id: row.id,
    service: row.service_id,
    date,
    time,
    status: row.status,
    client: {
      name: row.client_name,
      phone: row.client_phone,
      email: row.client_email || "",
    },
    note: row.note || "",
    coupon: row.coupon_code
      ? { code: row.coupon_code, discount: row.coupon_discount || 0 }
      : null,
    created: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
  if (includeAccessToken) out.accessToken = row.access_token;
  return out;
}
