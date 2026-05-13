// Tiny SQL migration runner. Reads server/db/migrations/*.sql in alphabetical
// order, runs each file inside a transaction, records applied filenames in a
// _migrations table. Idempotent.

import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pool, withTx } from "../db.js";

const here = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(here, "..", "..", "db", "migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function migrate() {
  await ensureMigrationsTable();

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const { rows: appliedRows } = await pool.query(
    "SELECT filename FROM _migrations"
  );
  const applied = new Set(appliedRows.map((r) => r.filename));

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf-8");
    await withTx(async (client) => {
      await client.query(sql);
      await client.query(
        "INSERT INTO _migrations (filename) VALUES ($1)",
        [file]
      );
    });
    console.log(`[migrate] applied ${file}`);
    ran += 1;
  }

  if (ran === 0) console.log("[migrate] schema up to date.");
  return ran;
}

// Run as a script: `npm --prefix server run migrate`
const invokedAsScript =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsScript) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error("[migrate] failed:", err);
      pool.end().finally(() => process.exit(1));
    });
}
