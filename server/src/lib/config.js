import { query, withTx } from "../db.js";

function rowToConfig(row) {
  if (!row) return null;
  return {
    workingHours: row.working_hours,
    slotStep: row.slot_step,
    leadTimeMin: row.lead_time_min,
    updatedAt: row.updated_at,
  };
}

const ALLOWED_SLOT_STEPS = [15, 30, 45, 60];
const TIME_RE = /^\d{2}:\d{2}$/;

function validateWorkingHours(wh) {
  if (!wh || typeof wh !== "object" || Array.isArray(wh)) {
    return "Radno vreme mora biti objekat.";
  }
  for (let d = 0; d <= 6; d++) {
    const v = wh[String(d)] ?? wh[d];
    if (v === undefined) return `Nedostaje dan ${d}.`;
    if (v === null) continue;
    if (!Array.isArray(v) || v.length !== 2) {
      return `Dan ${d}: vrednost mora biti par [otvoreno, zatvoreno] ili null.`;
    }
    const [open, close] = v;
    if (!TIME_RE.test(open) || !TIME_RE.test(close)) {
      return `Dan ${d}: vremena moraju biti u formatu HH:MM.`;
    }
    if (open >= close) {
      return `Dan ${d}: otvoreno mora biti pre zatvoreno.`;
    }
  }
  return null;
}

function validateConfig(edits) {
  if (edits.workingHours !== undefined) {
    const err = validateWorkingHours(edits.workingHours);
    if (err) return err;
  }
  if (edits.slotStep !== undefined) {
    if (!ALLOWED_SLOT_STEPS.includes(edits.slotStep)) {
      return `Korak vremena mora biti jedan od: ${ALLOWED_SLOT_STEPS.join(", ")}.`;
    }
  }
  if (edits.leadTimeMin !== undefined) {
    if (!Number.isInteger(edits.leadTimeMin) || edits.leadTimeMin < 0) {
      return "Vreme zakazivanja unapred mora biti nenegativan ceo broj.";
    }
  }
  return null;
}

// In-process snapshot of the singleton row. Loaded on first access and
// refreshed on every successful update. Single-master salon, single Node
// process — invalidation is local-only and that's fine.
let cached = null;

export async function getConfig() {
  if (cached) return cached;
  const { rows } = await query("SELECT * FROM salon_config WHERE id = 1");
  cached = rowToConfig(rows[0]);
  return cached;
}

export async function updateConfig(edits) {
  const err = validateConfig(edits);
  if (err) throw Object.assign(new Error(err), { status: 400 });

  const sets = [];
  const params = [];
  let i = 1;
  if (edits.workingHours !== undefined) {
    sets.push(`working_hours = $${i++}`);
    params.push(edits.workingHours);
  }
  if (edits.slotStep !== undefined) {
    sets.push(`slot_step = $${i++}`);
    params.push(edits.slotStep);
  }
  if (edits.leadTimeMin !== undefined) {
    sets.push(`lead_time_min = $${i++}`);
    params.push(edits.leadTimeMin);
  }
  if (sets.length === 0) return getConfig();
  sets.push(`updated_at = NOW()`);

  return withTx(async (client) => {
    const { rows } = await client.query(
      `UPDATE salon_config SET ${sets.join(", ")} WHERE id = 1 RETURNING *`,
      params
    );
    cached = rowToConfig(rows[0]);
    return cached;
  });
}
