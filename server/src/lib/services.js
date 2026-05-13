import { query } from "../db.js";
import { CATEGORIES } from "../data/services.js";

// Map a services row → API shape. Keeps the v2 client-facing keys (cat / desc)
// so the rest of the codebase doesn't need to learn new field names.
function rowToService(row) {
  if (!row) return null;
  return {
    id: row.id,
    cat: row.category,
    name: row.name,
    desc: row.description,
    duration: row.duration,
    price: row.price,
    featured: !!row.featured,
    archived: !!row.archived,
    sortOrder: row.sort_order,
  };
}

export async function listActive() {
  const { rows } = await query(
    `SELECT * FROM services
       WHERE archived = false
       ORDER BY category, sort_order, created_at`
  );
  return rows.map(rowToService);
}

export async function listAll() {
  const { rows } = await query(
    `SELECT * FROM services
       ORDER BY archived, category, sort_order, created_at`
  );
  return rows.map(rowToService);
}

export async function findService(id) {
  if (!id) return null;
  const { rows } = await query(
    "SELECT * FROM services WHERE id = $1",
    [id]
  );
  return rowToService(rows[0]);
}

export async function isReferenced(id) {
  const { rows } = await query(
    "SELECT EXISTS(SELECT 1 FROM bookings WHERE service_id = $1) AS used",
    [id]
  );
  return !!rows[0]?.used;
}

const ID_RE = /^[a-z0-9-]{2,32}$/;

function validate(data, { partial = false } = {}) {
  if (data.id !== undefined && !ID_RE.test(data.id)) {
    return "ID mora sadržati 2–32 znaka (mala slova, brojevi, crtica).";
  }
  if (data.category !== undefined && !CATEGORIES.includes(data.category)) {
    return `Nepoznata kategorija: ${data.category}.`;
  }
  if (data.name !== undefined && (typeof data.name !== "string" || data.name.trim().length === 0)) {
    return "Naziv je obavezan.";
  }
  if (data.description !== undefined && typeof data.description !== "string") {
    return "Opis mora biti tekst.";
  }
  if (data.duration !== undefined) {
    if (!Number.isInteger(data.duration) || data.duration <= 0) {
      return "Trajanje mora biti pozitivan broj minuta.";
    }
  }
  if (data.price !== undefined) {
    if (!Number.isInteger(data.price) || data.price < 0) {
      return "Cena mora biti nenegativan ceo broj.";
    }
  }
  if (data.featured !== undefined && typeof data.featured !== "boolean") {
    return "Polje 'preporuka' mora biti boolean.";
  }
  if (data.archived !== undefined && typeof data.archived !== "boolean") {
    return "Polje 'arhivirano' mora biti boolean.";
  }
  if (data.sortOrder !== undefined && !Number.isInteger(data.sortOrder)) {
    return "Redosled mora biti ceo broj.";
  }
  if (!partial) {
    for (const k of ["id", "category", "name", "description", "duration", "price"]) {
      if (data[k] === undefined) return `Polje '${k}' je obavezno.`;
    }
  }
  return null;
}

export async function createService(input) {
  const err = validate(input);
  if (err) throw Object.assign(new Error(err), { status: 400 });

  const exists = await findService(input.id);
  if (exists) throw Object.assign(new Error("ID već postoji."), { status: 409 });

  const { rows } = await query(
    `INSERT INTO services
       (id, category, name, description, duration, price, featured, archived, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      input.id,
      input.category,
      input.name.trim(),
      input.description || "",
      input.duration,
      input.price,
      !!input.featured,
      !!input.archived,
      input.sortOrder ?? 0,
    ]
  );
  return rowToService(rows[0]);
}

export async function updateService(id, edits) {
  const err = validate(edits, { partial: true });
  if (err) throw Object.assign(new Error(err), { status: 400 });

  // ID is immutable — strip it from edits silently if passed.
  const allowed = ["category", "name", "description", "duration", "price", "featured", "archived"];
  const colMap = { sortOrder: "sort_order" };
  const sets = [];
  const params = [];
  let i = 1;
  for (const key of allowed) {
    if (edits[key] === undefined) continue;
    sets.push(`${key} = $${i++}`);
    params.push(key === "name" ? edits[key].trim() : edits[key]);
  }
  if (edits.sortOrder !== undefined) {
    sets.push(`${colMap.sortOrder} = $${i++}`);
    params.push(edits.sortOrder);
  }
  if (sets.length === 0) {
    return findService(id);
  }
  sets.push(`updated_at = NOW()`);
  params.push(id);
  const { rows } = await query(
    `UPDATE services SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    params
  );
  return rowToService(rows[0]);
}

export async function deleteService(id) {
  if (await isReferenced(id)) {
    throw Object.assign(
      new Error("Usluga je u upotrebi; arhivirajte je umesto brisanja."),
      { status: 409 }
    );
  }
  await query("DELETE FROM services WHERE id = $1", [id]);
}
