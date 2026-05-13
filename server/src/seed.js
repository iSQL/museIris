import "dotenv/config";
import { pathToFileURL } from "node:url";
import { pool, query, withTx } from "./db.js";
import { newAccessToken } from "./lib/tokens.js";

const pad2 = (n) => String(n).padStart(2, "0");
const isoDate = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// 9 demo bookings anchored to today.
function makeSeed() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = (days, h, m = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return { date: isoDate(d), time: `${pad2(h)}:${pad2(m)}` };
  };

  // Created_at is interpreted server-side as actual timestamps; the v1 "pre 12
  // minuta" strings are produced for display by the client formatter instead.
  const now = new Date();
  const minutesAgo = (m) => new Date(now.getTime() - m * 60_000).toISOString();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60_000).toISOString();

  return [
    {
      id: "B-2401",
      status: "pending",
      ...offset(0, 14, 0),
      service_id: "mani-gel",
      client_name: "Jovana Petrović",
      client_phone: "+381 64 123 4567",
      client_email: "jovana.p@example.rs",
      note: "Volela bih nežne nude tonove, eventualno mat finiš.",
      created_at: minutesAgo(12),
    },
    {
      id: "B-2402",
      status: "pending",
      ...offset(1, 11, 30),
      service_id: "ped-spa",
      client_name: "Milica Đorđević",
      client_phone: "+381 65 987 6543",
      client_email: "milica.dj@example.rs",
      note: "",
      created_at: minutesAgo(38),
    },
    {
      id: "B-2403",
      status: "pending",
      ...offset(2, 17, 0),
      service_id: "mani-french",
      client_name: "Ana Stanković",
      client_phone: "+381 60 555 8821",
      client_email: "ana.s@example.rs",
      note: "Babyboomer, tanji oblik kvadrata.",
      created_at: minutesAgo(60),
    },
    {
      id: "B-2390",
      status: "approved",
      ...offset(0, 17, 0),
      service_id: "mani-kl",
      client_name: "Tijana Marković",
      client_phone: "+381 63 200 1144",
      client_email: "tijana@example.rs",
      note: "",
      created_at: daysAgo(1),
    },
    {
      id: "B-2391",
      status: "approved",
      ...offset(1, 9, 30),
      service_id: "ped-kl",
      client_name: "Sanja Ilić",
      client_phone: "+381 62 334 9911",
      client_email: "sanja.ilic@example.rs",
      note: "",
      created_at: daysAgo(1),
    },
    {
      id: "B-2392",
      status: "approved",
      ...offset(3, 12, 0),
      service_id: "mani-gel",
      client_name: "Katarina Pavlović",
      client_phone: "+381 64 877 2210",
      client_email: "kat.pavlovic@example.rs",
      note: "",
      created_at: daysAgo(2),
    },
    {
      id: "B-2380",
      status: "completed",
      ...offset(-2, 15, 0),
      service_id: "ped-spa",
      client_name: "Jelena Nikolić",
      client_phone: "+381 65 110 4422",
      client_email: "jelena.n@example.rs",
      note: "",
      created_at: daysAgo(5),
    },
    {
      id: "B-2378",
      status: "completed",
      ...offset(-3, 11, 0),
      service_id: "mani-gel",
      client_name: "Tijana Marković",
      client_phone: "+381 63 200 1144",
      client_email: "tijana@example.rs",
      note: "",
      created_at: daysAgo(6),
    },
    {
      id: "B-2375",
      status: "rejected",
      ...offset(-1, 18, 30),
      service_id: "mani-ojacanje",
      client_name: "Marina Vasić",
      client_phone: "+381 60 221 7788",
      client_email: "marina.v@example.rs",
      note: "Termin nije odgovarao salonu.",
      created_at: daysAgo(2),
    },
  ];
}

export async function seed() {
  const rows = makeSeed();
  return withTx(async (client) => {
    let inserted = 0;
    for (const r of rows) {
      const { rowCount } = await client.query(
        `INSERT INTO bookings
           (id, service_id, date, time, status, client_name, client_phone,
            client_email, note, access_token, created_at, updated_at)
         VALUES
           ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          r.id,
          r.service_id,
          r.date,
          r.time,
          r.status,
          r.client_name,
          r.client_phone,
          r.client_email,
          r.note || null,
          newAccessToken(),
          r.created_at,
        ]
      );
      inserted += rowCount;
    }
    return inserted;
  });
}

export async function runSeedIfEmpty() {
  // Opt out by setting SEED_DEMO=false in env. Defaults on so local dev gets
  // the 9 demo rows automatically; production typically wants an empty table.
  if (process.env.SEED_DEMO === "false") {
    console.log("[seed] SEED_DEMO=false — skipping demo seed.");
    return;
  }
  const { rows } = await query("SELECT COUNT(*)::int AS n FROM bookings");
  const n = rows[0]?.n ?? 0;
  if (n === 0) {
    const inserted = await seed();
    console.log(`[seed] inserted ${inserted} demo bookings.`);
  }
}

const invokedAsScript =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsScript) {
  seed()
    .then((n) => {
      console.log(`[seed] inserted/ignored ${n} demo bookings.`);
      return pool.end();
    })
    .catch((err) => {
      console.error("[seed] failed:", err);
      pool.end().finally(() => process.exit(1));
    });
}
