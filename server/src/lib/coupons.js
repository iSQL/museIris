import { query } from "../db.js";

const CODE_RE = /^[A-Z0-9_-]{3,32}$/;

function rowToCoupon(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    discountPercent: row.discount_percent,
    discountAmount: row.discount_amount,
    maxActivations: row.max_activations,
    activationsUsed: row.activations_used,
    expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : row.expires_at,
    active: !!row.active,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

function normalizeCode(raw) {
  return typeof raw === "string" ? raw.trim().toUpperCase() : "";
}

function validate(data, { partial = false } = {}) {
  if (data.code !== undefined) {
    const c = normalizeCode(data.code);
    if (!CODE_RE.test(c)) {
      return "Kod sme da sadrži samo velika slova, brojeve, '-' i '_' (3–32 znaka).";
    }
  }
  const hasPercent = data.discountPercent !== undefined && data.discountPercent !== null && data.discountPercent !== "";
  const hasAmount = data.discountAmount !== undefined && data.discountAmount !== null && data.discountAmount !== "";
  if (hasPercent) {
    const v = Number(data.discountPercent);
    if (!Number.isInteger(v) || v < 1 || v > 100) {
      return "Procenat popusta mora biti ceo broj između 1 i 100.";
    }
  }
  if (hasAmount) {
    const v = Number(data.discountAmount);
    if (!Number.isInteger(v) || v < 1) {
      return "Iznos popusta mora biti pozitivan ceo broj (RSD).";
    }
  }
  if (!partial && !hasPercent && !hasAmount) {
    return "Postavite procenat ili fiksni iznos popusta.";
  }
  if (hasPercent && hasAmount) {
    return "Kupon može imati procenat ili fiksni iznos — ne oboje.";
  }
  if (data.maxActivations !== undefined && data.maxActivations !== null && data.maxActivations !== "") {
    const v = Number(data.maxActivations);
    if (!Number.isInteger(v) || v < 1) {
      return "Maksimalan broj aktivacija mora biti pozitivan ceo broj.";
    }
  }
  if (data.expiresAt !== undefined && data.expiresAt !== null && data.expiresAt !== "") {
    const d = new Date(data.expiresAt);
    if (Number.isNaN(d.getTime())) return "Datum isteka nije ispravan.";
  }
  if (data.active !== undefined && typeof data.active !== "boolean") {
    return "Polje 'aktivan' mora biti boolean.";
  }
  return null;
}

export async function listCoupons() {
  const { rows } = await query(
    "SELECT * FROM coupons ORDER BY active DESC, created_at DESC"
  );
  return rows.map(rowToCoupon);
}

export async function findCouponByCode(code) {
  const c = normalizeCode(code);
  if (!c) return null;
  const { rows } = await query("SELECT * FROM coupons WHERE code = $1", [c]);
  return rowToCoupon(rows[0]);
}

export async function findCouponById(id) {
  const { rows } = await query("SELECT * FROM coupons WHERE id = $1", [id]);
  return rowToCoupon(rows[0]);
}

export async function createCoupon(input) {
  const err = validate(input);
  if (err) throw Object.assign(new Error(err), { status: 400 });
  const code = normalizeCode(input.code);
  const existing = await findCouponByCode(code);
  if (existing) throw Object.assign(new Error("Kupon sa tim kodom već postoji."), { status: 409 });

  const percent = input.discountPercent ? Number(input.discountPercent) : null;
  const amount = input.discountAmount ? Number(input.discountAmount) : null;
  const max = input.maxActivations ? Number(input.maxActivations) : null;
  const expires = input.expiresAt ? new Date(input.expiresAt) : null;

  const { rows } = await query(
    `INSERT INTO coupons
       (code, discount_percent, discount_amount, max_activations, expires_at, active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [code, percent, amount, max, expires, input.active !== false]
  );
  return rowToCoupon(rows[0]);
}

export async function updateCoupon(id, edits) {
  const err = validate(edits, { partial: true });
  if (err) throw Object.assign(new Error(err), { status: 400 });

  const existing = await findCouponById(id);
  if (!existing) throw Object.assign(new Error("Kupon ne postoji."), { status: 404 });

  // Code stays immutable — too easy to break links/snapshots otherwise.
  const sets = [];
  const params = [];
  let i = 1;

  if (edits.discountPercent !== undefined) {
    sets.push(`discount_percent = $${i++}`);
    params.push(edits.discountPercent === null || edits.discountPercent === "" ? null : Number(edits.discountPercent));
  }
  if (edits.discountAmount !== undefined) {
    sets.push(`discount_amount = $${i++}`);
    params.push(edits.discountAmount === null || edits.discountAmount === "" ? null : Number(edits.discountAmount));
  }
  if (edits.maxActivations !== undefined) {
    sets.push(`max_activations = $${i++}`);
    params.push(edits.maxActivations === null || edits.maxActivations === "" ? null : Number(edits.maxActivations));
  }
  if (edits.expiresAt !== undefined) {
    sets.push(`expires_at = $${i++}`);
    params.push(edits.expiresAt === null || edits.expiresAt === "" ? null : new Date(edits.expiresAt));
  }
  if (edits.active !== undefined) {
    sets.push(`active = $${i++}`);
    params.push(edits.active);
  }
  if (sets.length === 0) return existing;
  sets.push("updated_at = NOW()");
  params.push(id);

  const { rows } = await query(
    `UPDATE coupons SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    params
  );
  return rowToCoupon(rows[0]);
}

export async function deleteCoupon(id) {
  const existing = await findCouponById(id);
  if (!existing) throw Object.assign(new Error("Kupon ne postoji."), { status: 404 });
  if (existing.activationsUsed > 0) {
    throw Object.assign(
      new Error("Kupon je već korišćen; deaktivirajte ga umesto brisanja."),
      { status: 409 }
    );
  }
  await query("DELETE FROM coupons WHERE id = $1", [id]);
}

// Compute the resolved RSD discount for a given service price. Caps at price.
export function resolveDiscount(coupon, price) {
  if (!coupon) return 0;
  if (price <= 0) return 0;
  let off = 0;
  if (coupon.discountPercent) {
    off = Math.round((price * coupon.discountPercent) / 100);
  } else if (coupon.discountAmount) {
    off = coupon.discountAmount;
  }
  return Math.min(off, price);
}

// Pure check: does this coupon look usable right now? Returns null on success
// or a Serbian error message string. Does NOT mutate activations_used; that
// happens atomically at booking-creation time.
export function validateForRedemption(coupon) {
  if (!coupon) return "Kupon ne postoji.";
  if (!coupon.active) return "Kupon je deaktiviran.";
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return "Kupon je istekao.";
  }
  if (coupon.maxActivations != null && coupon.activationsUsed >= coupon.maxActivations) {
    return "Kupon je iskorišćen do kraja.";
  }
  return null;
}

// Atomically consume an activation. Returns the updated coupon row, or null if
// the coupon was concurrently exhausted/deactivated/expired. Caller should
// retry validation if null is returned (or surface a 409).
export async function consumeActivation(code, client) {
  const c = normalizeCode(code);
  if (!c) return null;
  const exec = client ? client.query.bind(client) : query;
  const { rows } = await exec(
    `UPDATE coupons
        SET activations_used = activations_used + 1,
            updated_at = NOW()
      WHERE code = $1
        AND active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_activations IS NULL OR activations_used < max_activations)
      RETURNING *`,
    [c]
  );
  return rowToCoupon(rows[0]);
}
