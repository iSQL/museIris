import { query } from "../db.js";
import { findService } from "./services.js";
import { getConfig } from "./config.js";

const pad2 = (n) => String(n).padStart(2, "0");
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (m) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;

// Fetch service durations for the given booking rows in one shot, to avoid
// N+1 queries when computing taken ranges.
async function loadDurationsFor(serviceIds) {
  if (serviceIds.length === 0) return new Map();
  const unique = [...new Set(serviceIds)];
  const { rows } = await query(
    "SELECT id, duration FROM services WHERE id = ANY($1)",
    [unique]
  );
  return new Map(rows.map((r) => [r.id, r.duration]));
}

async function fetchTaken(date, ignoreBookingId = null) {
  const params = [date];
  let sql =
    "SELECT id, service_id, time FROM bookings WHERE date = $1 AND status IN ('pending','approved')";
  if (ignoreBookingId) {
    params.push(ignoreBookingId);
    sql += " AND id <> $2";
  }
  const { rows } = await query(sql, params);
  const durations = await loadDurationsFor(rows.map((r) => r.service_id));
  return rows.map((row) => {
    const t = typeof row.time === "string" ? row.time.slice(0, 5) : row.time;
    const start = toMin(t);
    const dur = durations.get(row.service_id) ?? 60;
    return [start, start + dur];
  });
}

export async function takenRangesOn(date, ignoreBookingId = null) {
  return fetchTaken(date, ignoreBookingId);
}

// Server-mirrored equivalent of the prototype's StepTime slot generator.
// Returns [{ time: "HH:MM", taken, past }] for the (date, service) pair.
export async function generateSlots(date, serviceId, ignoreBookingId = null) {
  const service = await findService(serviceId);
  if (!service) return [];
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return [];

  const config = await getConfig();
  const hours = config.workingHours?.[String(d.getDay())];
  if (!hours) return [];

  const [open, close] = hours;
  const openM = toMin(open);
  const closeM = toMin(close);

  const taken = await fetchTaken(date, ignoreBookingId);

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
    now.getDate()
  )}`;
  const isToday = date === todayIso;
  const nowM = now.getHours() * 60 + now.getMinutes();

  const result = [];
  for (let t = openM; t + service.duration <= closeM; t += config.slotStep) {
    const overlaps = taken.some(([s, e]) => t < e && t + service.duration > s);
    const inPast = isToday && t < nowM + config.leadTimeMin;
    result.push({ time: fromMin(t), taken: overlaps, past: inPast });
  }
  return result;
}

// Returns null if the slot is fine to book; an error message otherwise.
// `ignoreBookingId` lets reschedule exclude the booking being moved.
export async function validateSlot(date, time, serviceId, ignoreBookingId = null) {
  const service = await findService(serviceId);
  if (!service) return "Nepoznata usluga.";
  if (service.archived) return "Usluga više nije dostupna.";

  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Neispravan datum.";

  const config = await getConfig();
  const hours = config.workingHours?.[String(d.getDay())];
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
  const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
    now.getDate()
  )}`;
  if (date < todayIso) return "Termin je u prošlosti.";
  if (date === todayIso) {
    const nowM = now.getHours() * 60 + now.getMinutes();
    if (t < nowM + config.leadTimeMin) {
      return `Termin se zakazuje najmanje ${config.leadTimeMin} minuta unapred.`;
    }
  }

  const taken = await fetchTaken(date, ignoreBookingId);
  const overlaps = taken.some(([s, e]) => t < e && t + service.duration > s);
  if (overlaps) return "Termin je već zauzet.";

  return null;
}
