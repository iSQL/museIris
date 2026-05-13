// The catalogue itself lives in the `services` Postgres table (see
// server/src/lib/services.js). Category list stays as a static enum — the
// admin form uses it as a dropdown, and validation rejects unknown values.

export const CATEGORIES = ["Manikir", "Pedikir", "Dodaci"];
