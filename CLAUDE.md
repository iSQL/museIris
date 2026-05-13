# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Muse Iris — Serbian-language (`sr-Latn`) booking web app for a one-master manicure/pedicure atelier in Žabari (master: Milena). See [README.md](README.md) for the user-facing feature list, project layout, full API table, and deploy checklist. This file covers the things you can't pick up from a `Glob`.

## Commands

```sh
# Local dev (Postgres in Docker, app on the host with HMR)
docker compose up -d                     # Postgres only on :5432
cp server/.env.example server/.env       # one-time; fill ADMIN_PASSWORD_HASH + JWT_SECRET
npm run install:all                      # root + client + server
npm --prefix server run migrate          # apply pending SQL migrations
npm run dev                              # both servers via concurrently

# Build / verify
npm --prefix client run build            # production SPA build
docker build -t museiris .               # full production image (multi-stage)

# Single-purpose
npm --prefix server run seed                       # idempotent re-seed of demo bookings
npm --prefix server run hash-password -- <plain>   # bcrypt hash for ADMIN_PASSWORD_HASH
```

No test runner is wired up. Verification is done via `curl` against `localhost:3001` (server-direct) or `localhost:5173`/`5174` (through the Vite proxy). The README's TODO list itself notes this gap.

When a `:3001` port-in-use error appears after a crashed dev run, find the squatter via PowerShell:
```powershell
Get-NetTCPConnection -LocalPort 3001 -State Listen | Stop-Process -Id { $_.OwningProcess } -Force
```

## Big-picture architecture

**Two halves, one container in prod.** `client/` is a Vite + React (JS) SPA; `server/` is Express + Postgres. In development they run as two processes, with Vite proxying `/api/*` → `http://localhost:3001`. In production (`NODE_ENV=production`) the same Express server also serves `client/dist/` with a SPA fallback, so the Coolify deploy is a single container on `:3001`.

**No npm workspaces.** Each of root / `client/` / `server/` is its own `package.json` + `node_modules`. The root has `concurrently` and forwards to the two sub-packages.

**Two distinct auth models in one app:**

1. **Customer access** — per-booking. `POST /api/bookings` returns `{ booking, accessToken }`; client stores `{id, accessToken}` entries in `localStorage` (`museIris:bookings`). `/me` fetches each booking via `/api/bookings/by-token/:token`. No customer accounts.
2. **Admin auth** — single shared password. bcrypt hash in `ADMIN_PASSWORD_HASH`, JWT signed with `JWT_SECRET` in an httpOnly cookie (`mi_admin`, 7-day TTL). `requireAuth` middleware in [`server/src/middleware/requireAuth.js`](server/src/middleware/requireAuth.js) gates the admin endpoints.

**Catalogue and salon-wide settings are DB-backed, not code constants.** This is recent history that matters: pre-v3, services and working hours lived in `server/src/data/services.js`. As of v3 they're in Postgres (`services` and `salon_config` tables) and managed via `/admin → Usluge` and `/admin → Podešavanja`. The repos live in [`server/src/lib/services.js`](server/src/lib/services.js) and [`server/src/lib/config.js`](server/src/lib/config.js). `server/src/data/services.js` now only exports `CATEGORIES`. Don't reintroduce the old JS-const pattern.

**Migrations.** SQL files in `server/db/migrations/*.sql` run alphabetically and tracked in a `_migrations` table. The runner ([`server/src/lib/migrate.js`](server/src/lib/migrate.js)) is invoked automatically at every server boot from [`server/src/index.js`](server/src/index.js), so adding `0003_*.sql` and pushing is enough — no manual step. Use `pathToFileURL` for the "invoked as script" check; the naive string-equality form breaks on Windows.

## Load-bearing details

These bit us during the build and would bite future you again.

- **Postgres DATE/TIME custom parsers.** [`server/src/db.js`](server/src/db.js) registers `types.setTypeParser(types.builtins.DATE, v => v)` and the same for `TIME`. Without this, `pg`'s default parser returns a JS `Date` at local-midnight, and a `.toISOString().slice(0,10)` shift in any positive UTC offset (Europe/Belgrade in DST is +2) silently moves dates back by a day. The salon's wall-clock is the source of truth — keep `DATE`/`TIME` as raw strings everywhere.
- **Booking state machine.** `pending → approved | rejected`; `approved → completed | rejected`; `rejected → pending` (admin reopens); `completed` is terminal. Enforced in [`server/src/routes/bookings.js`](server/src/routes/bookings.js) via `ALLOWED_TRANSITIONS`. Customer-side reschedule of an `approved` booking reverts it to `pending` (Milena re-confirms).
- **4-hour customer edit cutoff.** Hard-coded in [`server/src/routes/bookings.js`](server/src/routes/bookings.js) as `CUSTOMER_EDIT_WINDOW_MIN = 4 * 60`; mirrored client-side in [`client/src/client/MyBookingsPage.jsx`](client/src/client/MyBookingsPage.jsx). If you change one, change the other.
- **Slot conflict logic is in one place.** [`server/src/lib/slots.js`](server/src/lib/slots.js) — `validateSlot` and `generateSlots` share the same `fetchTaken` query (and `ignoreBookingId` is essential for reschedule). Don't duplicate this in routes.
- **MyBookingsPage polls.** 30s interval, gated on `document.visibilityState === "visible"`. Don't pile on more polling without consolidating it.
- **Admin fetches `listAllServices`, not `getServices`.** Bookings that reference archived services need the archived row to display the service name. Public-facing flows ( `/`, `/services`, `/me`) use `getServices` which is active-only.
- **FK on `bookings.service_id`** is `ON DELETE RESTRICT`. Hard-delete of a referenced service returns 409 from the lib; the admin UI offers "Arhiviraj umesto toga" as a one-click fallback.

## Coolify deploy quirks

Both bit the first deploy:

- **bcrypt's `$2a$10$…` hash gets mangled** by Coolify's compose-style env interpolation. In the Coolify UI, double every `$` → `$$2a$$10$$…`. Verify with `printenv ADMIN_PASSWORD_HASH` inside the container.
- **`NODE_ENV` must be Runtime-only.** If marked "Available at Buildtime", npm skips devDeps and `vite build` fails. The Dockerfile defensively pins `ENV NODE_ENV=development` for the build stages anyway, but the Coolify toggle should still be off.

See the README's "Coolify gotchas" section for the full story.

## Design conventions

- **Visual language and copy are Serbian Latin (`sr-Latn`).** Don't translate Serbian strings to English when refactoring. The branding is "atelier" not "salon".
- **Styles are hoisted, not scoped.** [`client/src/styles.css`](client/src/styles.css) holds both design tokens (`:root` CSS vars: `--ink`, `--bronze`, `--gold`, `--burgundy`, etc.) and the component-scoped classes that were originally inline `<style>` blocks in the prototype (`.svc-card`, `.time-pill`, `.cal-cell`, `.req-row`, `.cli-row`, `.modal-overlay`, etc.). New component-specific styles should follow the same pattern — add to `styles.css` under a `/* === component-name === */` comment, not as a styled-jsx or CSS module.
- **Fonts** are Cormorant Garamond (serif display, italic for emphasis) + Inter (sans, UI). The `<link>` tags are in [`client/index.html`](client/index.html).
- **Time formatting** lives in [`client/src/data/format.js`](client/src/data/format.js): `fmtRSD`, `fmtDur`, `fmtDateLong`, `fmtDateShort`, `fmtRelativeTime`, `MONTHS_SR`, `DAYS_SR_LONG`, `isoDate`. Reuse these; don't reach for `Intl.RelativeTimeFormat` directly.

## When in doubt

- Need to understand why a feature is shaped the way it is? Git history is meaningful — commits `db42ebe` (v2), `b155055` (v3), and friends carry context in their bodies.
- Need to verify something landed on a deployed box? `printenv`, `curl /api/health`, then `curl /api/auth/me` are the standard reality-check trio.
