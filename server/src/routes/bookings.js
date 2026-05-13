import { Router } from "express";
import { query, rowToBooking } from "../db.js";
import { generateSlots, validateSlot } from "../lib/slots.js";
import { nextBookingId } from "../lib/nextId.js";
import { newAccessToken } from "../lib/tokens.js";
import { findService } from "../lib/services.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const ALLOWED_TRANSITIONS = {
  pending: new Set(["approved", "rejected"]),
  approved: new Set(["completed", "rejected"]),
  rejected: new Set(["pending"]),
  completed: new Set(),
};

// Cancellation/reschedule cutoff for customer self-service: 4h before the
// scheduled start (matches the salon's posted policy in StepDate).
const CUSTOMER_EDIT_WINDOW_MIN = 4 * 60;

function scheduledMinutesFromNow(dateStr, timeStr) {
  const target = new Date(`${dateStr}T${timeStr}:00`);
  return (target.getTime() - Date.now()) / 60_000;
}

// ─── admin endpoints (gated by requireAuth) ────────────────────────────────

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status } = req.query;
    const sql = status
      ? "SELECT * FROM bookings WHERE status = $1 ORDER BY date DESC, time DESC"
      : "SELECT * FROM bookings ORDER BY date DESC, time DESC";
    const params = status ? [status] : [];
    const { rows } = await query(sql, params);
    res.json({ bookings: rows.map((r) => rowToBooking(r)) });
  } catch (err) {
    next(err);
  }
});

// ─── public endpoints ──────────────────────────────────────────────────────

router.get("/availability", async (req, res, next) => {
  try {
    const { date, serviceId, excludeId } = req.query;
    if (!date || !serviceId) {
      return res.status(400).json({ error: "Missing date or serviceId." });
    }
    const slots = await generateSlots(
      String(date),
      String(serviceId),
      excludeId ? String(excludeId) : null
    );
    res.json({ slots });
  } catch (err) {
    next(err);
  }
});

router.get("/by-token/:token", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT * FROM bookings WHERE access_token = $1",
      [req.params.token]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found." });
    res.json({ booking: rowToBooking(rows[0], { includeAccessToken: true }) });
  } catch (err) {
    next(err);
  }
});

router.patch("/by-token/:token", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT * FROM bookings WHERE access_token = $1",
      [req.params.token]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found." });
    const row = rows[0];

    if (row.status !== "pending" && row.status !== "approved") {
      return res
        .status(409)
        .json({ error: "Termin više nije moguće izmeniti." });
    }
    const dateStr = row.date instanceof Date
      ? row.date.toISOString().slice(0, 10)
      : row.date;
    const timeStr = typeof row.time === "string" ? row.time.slice(0, 5) : row.time;
    if (scheduledMinutesFromNow(dateStr, timeStr) < CUSTOMER_EDIT_WINDOW_MIN) {
      return res.status(409).json({
        error: "Izmena nije moguća manje od 4 sata pre termina. Pozovite atelje.",
      });
    }

    const body = req.body || {};
    const newDate = body.date ?? dateStr;
    const newTime = body.time ?? timeStr;
    const noteProvided = typeof body.note === "string";
    const newNote = noteProvided ? body.note.trim() : row.note || "";

    const slotChanged = newDate !== dateStr || newTime !== timeStr;
    if (slotChanged) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate))
        return res.status(400).json({ error: "Datum nije u ispravnom formatu." });
      if (!/^\d{2}:\d{2}$/.test(newTime))
        return res.status(400).json({ error: "Vreme nije u ispravnom formatu." });
      const err = await validateSlot(newDate, newTime, row.service_id, row.id);
      if (err) return res.status(409).json({ error: err });
    }

    // Reschedule of an approved booking reverts to pending — Milena must re-confirm.
    const newStatus =
      slotChanged && row.status === "approved" ? "pending" : row.status;

    await query(
      `UPDATE bookings
         SET date = $1, time = $2, note = $3, status = $4, updated_at = NOW()
       WHERE id = $5`,
      [newDate, newTime, newNote || null, newStatus, row.id]
    );

    const { rows: out } = await query(
      "SELECT * FROM bookings WHERE id = $1",
      [row.id]
    );
    res.json({ booking: rowToBooking(out[0], { includeAccessToken: true }) });
  } catch (err) {
    next(err);
  }
});

router.post("/by-token/:token/cancel", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT * FROM bookings WHERE access_token = $1",
      [req.params.token]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found." });
    const row = rows[0];

    if (row.status !== "pending" && row.status !== "approved") {
      return res
        .status(409)
        .json({ error: "Termin više nije moguće otkazati." });
    }
    const dateStr = row.date instanceof Date
      ? row.date.toISOString().slice(0, 10)
      : row.date;
    const timeStr = typeof row.time === "string" ? row.time.slice(0, 5) : row.time;
    if (scheduledMinutesFromNow(dateStr, timeStr) < CUSTOMER_EDIT_WINDOW_MIN) {
      return res.status(409).json({
        error: "Otkazivanje nije moguće manje od 4 sata pre termina. Pozovite atelje.",
      });
    }

    await query(
      "UPDATE bookings SET status = 'rejected', updated_at = NOW() WHERE id = $1",
      [row.id]
    );
    const { rows: out } = await query(
      "SELECT * FROM bookings WHERE id = $1",
      [row.id]
    );
    res.json({ booking: rowToBooking(out[0], { includeAccessToken: true }) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM bookings WHERE id = $1", [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found." });
    res.json({ booking: rowToBooking(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
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
    const svc = serviceId ? await findService(serviceId) : null;
    if (!svc || svc.archived)
      return res.status(400).json({ error: "Usluga nije važeća." });
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return res.status(400).json({ error: "Datum nije u ispravnom formatu." });
    if (!time || !/^\d{2}:\d{2}$/.test(time))
      return res.status(400).json({ error: "Vreme nije u ispravnom formatu." });

    const slotErr = await validateSlot(date, time, serviceId);
    if (slotErr) return res.status(409).json({ error: slotErr });

    const id = await nextBookingId();
    const accessToken = newAccessToken();

    await query(
      `INSERT INTO bookings
         (id, service_id, date, time, status, client_name, client_phone,
          client_email, note, access_token)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9)`,
      [id, serviceId, date, time, name, phone, email || null, note || null, accessToken]
    );

    const { rows } = await query("SELECT * FROM bookings WHERE id = $1", [id]);
    res.status(201).json({
      booking: rowToBooking(rows[0]),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: "Missing status." });

    const { rows } = await query("SELECT * FROM bookings WHERE id = $1", [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found." });
    const row = rows[0];

    const allowed = ALLOWED_TRANSITIONS[row.status];
    if (!allowed || !allowed.has(status)) {
      return res
        .status(409)
        .json({ error: `Nedozvoljen prelaz statusa: ${row.status} → ${status}.` });
    }

    await query(
      "UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2",
      [status, row.id]
    );
    const { rows: out } = await query(
      "SELECT * FROM bookings WHERE id = $1",
      [row.id]
    );
    res.json({ booking: rowToBooking(out[0]) });
  } catch (err) {
    next(err);
  }
});

export default router;
