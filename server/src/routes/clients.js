import { Router } from "express";
import { query } from "../db.js";
import { listAll } from "../lib/services.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

// Aggregate clients from bookings — mirrors data.jsx aggregateClients().
// Visits = approved + completed; spent = sum(price) of completed bookings only.
// favCat = the service category appearing most often in non-rejected bookings.
router.get("/", async (_req, res, next) => {
  try {
    const [{ rows }, services] = await Promise.all([
      query("SELECT * FROM bookings ORDER BY date DESC"),
      listAll(),
    ]);
    const byId = new Map(services.map((s) => [s.id, s]));

    const map = new Map();
    for (const b of rows) {
      const key = b.client_email || b.client_phone;
      const dateStr =
        b.date instanceof Date ? b.date.toISOString().slice(0, 10) : b.date;
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
      if (!prev.lastDate || dateStr > prev.lastDate) prev.lastDate = dateStr;
      const svc = byId.get(b.service_id);
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
  } catch (err) {
    next(err);
  }
});

export default router;
