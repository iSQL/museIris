import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(here, "..", "data.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id            TEXT PRIMARY KEY,
    service_id    TEXT NOT NULL,
    date          TEXT NOT NULL,
    time          TEXT NOT NULL,
    status        TEXT NOT NULL CHECK (status IN ('pending','approved','completed','rejected')),
    client_name   TEXT NOT NULL,
    client_phone  TEXT NOT NULL,
    client_email  TEXT,
    note          TEXT,
    created_at    TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
`);

export function rowToBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    service: row.service_id,
    date: row.date,
    time: row.time,
    status: row.status,
    client: {
      name: row.client_name,
      phone: row.client_phone,
      email: row.client_email || "",
    },
    note: row.note || "",
    created: row.created_at,
  };
}
