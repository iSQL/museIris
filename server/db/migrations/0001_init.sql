CREATE TABLE IF NOT EXISTS bookings (
  id            TEXT PRIMARY KEY,
  service_id    TEXT NOT NULL,
  date          DATE NOT NULL,
  time          TIME NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('pending','approved','completed','rejected')),
  client_name   TEXT NOT NULL,
  client_phone  TEXT NOT NULL,
  client_email  TEXT,
  note          TEXT,
  access_token  TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_access_token ON bookings(access_token);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(client_phone);
