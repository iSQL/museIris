import { Router } from "express";
import { db } from "../db.js";
import { SERVICES } from "../data/services.js";

const router = Router();

// Aggregate clients from bookings — mirrors data.jsx aggregateClients().
// Visits = approved + completed; spent = sum(price) of completed bookings only.
// favCat = the service category appearing most often in non-rejected bookings.
router.get("/", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM bookings ORDER BY date DESC")
    .all();

  const map = new Map();
  for (const b of rows) {
    const key = b.client_email || b.client_phone;
    const prev = map.get(key) || {
      name: b.client_name,
      phone: b.client_phone,
      email: b.client_email || "",
      visits: 0,
      lastDate: "",
      spent: 0,
      _cats: {},
    };
    if (b.status === "completed" || b.status === "approved") prev.visits += 1;
    if (!prev.lastDate || b.date > prev.lastDate) prev.lastDate = b.date;
    const svc = SERVICES.find((s) => s.id === b.service_id);
    if (svc && b.status !== "rejected") {
      if (b.status === "completed") prev.spent += svc.price;
      prev._cats[svc.cat] = (prev._cats[svc.cat] || 0) + 1;
    }
    map.set(key, prev);
  }

  const clients = [...map.values()]
    .map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email,
      visits: c.visits,
      lastDate: c.lastDate,
      spent: c.spent,
      favCat:
        Object.entries(c._cats).sort((a, b) => b[1] - a[1])[0]?.[0] || "—",
    }))
    .sort((a, b) => (b.lastDate || "").localeCompare(a.lastDate || ""));

  res.json({ clients });
});

export default router;
