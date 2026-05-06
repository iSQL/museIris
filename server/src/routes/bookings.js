import { Router } from "express";
import { db, rowToBooking } from "../db.js";
import { generateSlots, validateSlot } from "../lib/slots.js";
import { nextBookingId } from "../lib/nextId.js";
import { findService } from "../data/services.js";

const router = Router();

const ALLOWED_TRANSITIONS = {
  pending: new Set(["approved", "rejected"]),
  approved: new Set(["completed", "rejected"]),
  rejected: new Set(["pending"]),
  completed: new Set(),
};

router.get("/", (req, res) => {
  const { status } = req.query;
  let rows;
  if (status) {
    rows = db
      .prepare("SELECT * FROM bookings WHERE status = ? ORDER BY date DESC, time DESC")
      .all(status);
  } else {
    rows = db.prepare("SELECT * FROM bookings ORDER BY date DESC, time DESC").all();
  }
  res.json({ bookings: rows.map(rowToBooking) });
});

router.get("/availability", (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !serviceId) {
    return res.status(400).json({ error: "Missing date or serviceId." });
  }
  const slots = generateSlots(String(date), String(serviceId));
  res.json({ slots });
});

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found." });
  res.json({ booking: rowToBooking(row) });
});

router.post("/", (req, res) => {
  const body = req.body || {};
  const name = (body.client?.name || "").trim();
  const phone = (body.client?.phone || "").trim();
  const email = (body.client?.email || "").trim();
  const note = (body.note || "").trim();
  const serviceId = body.service;
  const date = body.date;
  const time = body.time;

  if (!name) return res.status(400).json({ error: "Ime je obavezno." });
  if (!phone) return res.status(400).json({ error: "Telefon je obavezan." });
  if (!serviceId || !findService(serviceId)) return res.status(400).json({ error: "Usluga nije važeća." });
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "Datum nije u ispravnom formatu." });
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return res.status(400).json({ error: "Vreme nije u ispravnom formatu." });

  const slotErr = validateSlot(date, time, serviceId);
  if (slotErr) return res.status(409).json({ error: slotErr });

  const id = nextBookingId();
  // Matches the prototype's "upravo" (just now) string. Admin renders it verbatim.
  const created = "upravo";

  db.prepare(
    `INSERT INTO bookings (id, service_id, date, time, status, client_name, client_phone, client_email, note, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`
  ).run(id, serviceId, date, time, name, phone, email || null, note || null, created);

  const row = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
  res.status(201).json({ booking: rowToBooking(row) });
});

router.patch("/:id", (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: "Missing status." });

  const row = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found." });

  const allowed = ALLOWED_TRANSITIONS[row.status];
  if (!allowed || !allowed.has(status)) {
    return res
      .status(409)
      .json({ error: `Nedozvoljen prelaz statusa: ${row.status} → ${status}.` });
  }

  db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, row.id);
  const updated = db.prepare("SELECT * FROM bookings WHERE id = ?").get(row.id);
  res.json({ booking: rowToBooking(updated) });
});

export default router;
