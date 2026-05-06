import { db } from "../db.js";
import { WORKING_HOURS, SLOT_STEP, LEAD_TIME_MIN, findService, SERVICES } from "../data/services.js";

const pad2 = (n) => String(n).padStart(2, "0");
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (m) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;

const takenStmt = db.prepare(
  "SELECT service_id, time FROM bookings WHERE date = ? AND status IN ('pending','approved')"
);

// Returns the array of taken minute ranges for `date` (YYYY-MM-DD).
export function takenRangesOn(date) {
  return takenStmt.all(date).map((row) => {
    const svc = SERVICES.find((s) => s.id === row.service_id);
    const start = toMin(row.time);
    return [start, start + (svc?.duration || 60)];
  });
}

// Server-mirrored equivalent of the prototype's StepTime slot generator.
// Returns [{ time: "HH:MM", taken, past }] for the (date, service) pair.
export function generateSlots(date, serviceId, ignoreBookingId = null) {
  const service = findService(serviceId);
  if (!service) return [];
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return [];

  const hours = WORKING_HOURS[d.getDay()];
  if (!hours) return [];

  const [open, close] = hours;
  const openM = toMin(open);
  const closeM = toMin(close);

  const taken = takenStmt
    .all(date)
    .filter((row) => row.id !== ignoreBookingId)
    .map((row) => {
      const svc = SERVICES.find((s) => s.id === row.service_id);
      const start = toMin(row.time);
      return [start, start + (svc?.duration || 60)];
    });

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const isToday = date === todayIso;
  const nowM = now.getHours() * 60 + now.getMinutes();

  const result = [];
  for (let t = openM; t + service.duration <= closeM; t += SLOT_STEP) {
    const overlaps = taken.some(([s, e]) => t < e && t + service.duration > s);
    const inPast = isToday && t < nowM + LEAD_TIME_MIN;
    result.push({ time: fromMin(t), taken: overlaps, past: inPast });
  }
  return result;
}

// Returns null if the slot is fine to book; an error message otherwise.
export function validateSlot(date, time, serviceId) {
  const service = findService(serviceId);
  if (!service) return "Nepoznata usluga.";

  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Neispravan datum.";
  const hours = WORKING_HOURS[d.getDay()];
  if (!hours) return "Tog dana atelje ne radi.";

  const [open, close] = hours;
  const openM = toMin(open);
  const closeM = toMin(close);
  const t = toMin(time);
  if (Number.isNaN(t)) return "Neispravno vreme.";
  if (t < openM || t + service.duration > closeM) {
    return "Termin je van radnog vremena ateljea.";
  }

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  if (date < todayIso) return "Termin je u prošlosti.";
  if (date === todayIso) {
    const nowM = now.getHours() * 60 + now.getMinutes();
    if (t < nowM + LEAD_TIME_MIN) return "Termin se zakazuje najmanje 30 minuta unapred.";
  }

  const overlaps = takenRangesOn(date).some(([s, e]) => t < e && t + service.duration > s);
  if (overlaps) return "Termin je već zauzet.";

  return null;
}
