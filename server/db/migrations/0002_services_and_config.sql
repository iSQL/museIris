-- v3: admin-managed services + salon settings

CREATE TABLE services (
  id           TEXT PRIMARY KEY,
  category     TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  duration     INTEGER NOT NULL CHECK (duration > 0),
  price        INTEGER NOT NULL CHECK (price >= 0),
  featured     BOOLEAN NOT NULL DEFAULT FALSE,
  archived     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_archived ON services(archived);
CREATE INDEX idx_services_category ON services(category);

-- Seed the 9 services that previously lived as a JS const in
-- server/src/data/services.js. Must run before the FK on bookings.
INSERT INTO services (id, category, name, description, duration, price, featured, sort_order) VALUES
  ('mani-kl',       'Manikir', 'Klasični manikir',         'Oblikovanje, pažljiva nega zanoktica i lak po izboru.',          45, 1500, false, 10),
  ('mani-gel',      'Manikir', 'Trajni gel lak',           'Manikir sa gel lakom dugog trajanja, do tri nedelje sjaja.',     75, 2400, true,  20),
  ('mani-ojacanje', 'Manikir', 'Ojačavanje akril gelom',   'Diskretno ojačavanje prirodne ploče za otpornije nokte.',        90, 3200, false, 30),
  ('mani-french',   'Manikir', 'French / Baby boomer',     'Klasika i mekani prelaz, ručno crtano.',                         90, 2900, false, 40),
  ('ped-kl',        'Pedikir', 'Klasični pedikir',         'Topla kupka, piling, korekcija i lakiranje.',                    60, 2200, false, 10),
  ('ped-spa',       'Pedikir', 'Spa pedikir Iris',         'Ritual sa eteričnim uljima irisa, maska i masaža stopala.',      90, 3400, true,  20),
  ('ped-gel',       'Pedikir', 'Pedikir + trajni lak',     'Kompletna nega stopala uz dugotrajan gel lak.',                  90, 3200, false, 30),
  ('ext-skidanje',  'Dodaci',  'Skidanje trajnog laka',    'Pažljivo skidanje bez oštećenja ploče.',                         20, 600,  false, 10),
  ('ext-art',       'Dodaci',  'Nail art (po noktu)',      'Ručno crtani detalji, kamenčići, folije.',                       15, 250,  false, 20);

ALTER TABLE bookings
  ADD CONSTRAINT fk_bookings_service
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT;

CREATE TABLE salon_config (
  id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  working_hours   JSONB   NOT NULL,
  slot_step       INTEGER NOT NULL DEFAULT 30 CHECK (slot_step > 0),
  lead_time_min   INTEGER NOT NULL DEFAULT 30 CHECK (lead_time_min >= 0),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO salon_config (id, working_hours, slot_step, lead_time_min) VALUES
  (1,
   '{"0":null,"1":["09:00","19:00"],"2":["09:00","19:00"],"3":["09:00","19:00"],"4":["09:00","20:00"],"5":["09:00","20:00"],"6":["10:00","16:00"]}'::jsonb,
   30,
   30);
