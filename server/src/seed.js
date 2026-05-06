import { db } from "./db.js";

const pad2 = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// Mirrors makeMockBookings() in data.jsx: 9 demo bookings anchored to today.
function makeSeed() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = (days, h, m = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return { date: isoDate(d), time: `${pad2(h)}:${pad2(m)}` };
  };

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
      created_at: "pre 12 minuta",
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
      created_at: "pre 38 minuta",
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
      created_at: "pre 1 sat",
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
      created_at: "juče",
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
      created_at: "juče",
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
      created_at: "pre 2 dana",
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
      created_at: "pre 5 dana",
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
      created_at: "pre 6 dana",
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
      created_at: "pre 2 dana",
    },
  ];
}

export function seed() {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO bookings
       (id, service_id, date, time, status, client_name, client_phone, client_email, note, created_at)
     VALUES
       (@id, @service_id, @date, @time, @status, @client_name, @client_phone, @client_email, @note, @created_at)`
  );
  const rows = makeSeed();
  const tx = db.transaction((items) => {
    let inserted = 0;
    for (const r of items) {
      const info = insert.run(r);
      inserted += info.changes;
    }
    return inserted;
  });
  return tx(rows);
}

export function runSeedIfEmpty() {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM bookings").get();
  if (n === 0) {
    const inserted = seed();
    console.log(`[seed] inserted ${inserted} demo bookings.`);
  }
}

// Run as a script: `node src/seed.js`
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const inserted = seed();
  console.log(`[seed] inserted/ignored ${inserted} demo bookings.`);
  process.exit(0);
}
