# Muse Iris — atelier booking app

Serbian-language ("sr-Latn") booking web app for **Muse Iris**, a one-master manicure/pedicure atelier. Master: Milena. Location: Žabari.

## Stack

- **Frontend:** Vite + React 18 (JS), `react-router-dom` v6.
- **Backend:** Node 22 + Express 4 + `pg` (raw queries, handwritten SQL migrations).
- **Database:** Postgres 16.
- **Auth:** single shared admin password — bcryptjs hash + signed JWT in an httpOnly cookie.
- **Container:** multi-stage `Dockerfile` builds the SPA and runs the API in a single container on `:3001`.
- **Local dev:** `docker-compose.yml` brings up Postgres only; the app itself runs via `npm run dev` for HMR.

## Project layout

```
.
├── client/                       # Vite + React SPA
│   └── src/
│       ├── api.js                # fetch wrappers (credentials: include)
│       ├── App.jsx               # routes: /, /services, /me, /admin
│       ├── components/           # BrandMark, MonthCalendar, Stepper, StatusChip, …
│       ├── client/               # booking flow + ServicesPage + MyBookingsPage + RescheduleModal
│       ├── admin/                # AdminApp, Login, Sidebar, OverviewView, RequestsView, ServicesView, ServiceFormModal, SettingsView, …
│       ├── data/format.js        # Serbian formatters (fmtRSD, fmtDateLong, fmtRelativeTime, …)
│       ├── lib/myBookings.js     # localStorage cache of customer access tokens
│       └── styles.css            # design tokens + hoisted component styles
├── server/                       # Express + Postgres backend
│   ├── db/migrations/            # numbered SQL files; runner is idempotent
│   └── src/
│       ├── index.js              # bootstrap: dotenv → migrate → seed → listen
│       ├── db.js                 # pg Pool, query(), withTx(), rowToBooking()
│       ├── data/services.js      # CATEGORIES enum (catalogue itself is in DB)
│       ├── lib/                  # auth, hashPassword, migrate, slots, nextId, tokens, services, config
│       ├── middleware/requireAuth.js
│       ├── routes/               # health, auth, services, bookings, clients, config
│       └── seed.js               # idempotent 9-row demo seed
├── Dockerfile                    # multi-stage: deps → build → runtime
├── docker-compose.yml            # Postgres only (dev convenience)
└── package.json                  # root — `npm run dev` runs both via concurrently
```

## Local development

Requires Node 22 (LTS), npm, and Docker Desktop (or any local Postgres 14+).

```sh
# 1. Start Postgres
docker compose up -d

# 2. Configure env
cp server/.env.example server/.env
# Generate the admin password hash:
npm --prefix server run hash-password -- yourpassword
# → paste the printed bcrypt hash into server/.env as ADMIN_PASSWORD_HASH
# → set JWT_SECRET to any long random string (≥ 16 chars)

# 3. Install deps + apply migrations
npm run install:all
npm --prefix server run migrate

# 4. Run both dev servers (Express :3001 + Vite :5173)
npm run dev
```

Open:
- http://localhost:5173/ — client booking flow (5 steps)
- http://localhost:5173/services — service catalogue
- http://localhost:5173/me — customer self-service ("Moji termini")
- http://localhost:5173/admin — admin dashboard (requires login)

The first server boot auto-seeds 9 demo bookings if the `bookings` table is empty.

## Production deploy (Coolify)

Point Coolify at this repo and select the `Dockerfile` build pack. Internal port: `3001`. Required env vars:

| Var | Notes |
| --- | --- |
| `DATABASE_URL` | `postgres://user:pass@host:5432/db` — use the Coolify Postgres' internal hostname |
| `ADMIN_PASSWORD_HASH` | bcrypt hash generated via `npm run hash-password` |
| `JWT_SECRET` | Long random string (≥ 16 chars); rotate to invalidate all sessions |
| `COOKIE_SECURE` | `true` (HTTPS) |
| `NODE_ENV` | `production` |
| `PORT` | `3001` (Coolify reverse-proxies this) |
| `SEED_DEMO` | `false` to skip the 9-row demo seed on first boot (recommended for prod) |

On every boot the server runs pending migrations (`server/db/migrations/*.sql`) and — unless `SEED_DEMO=false` — seeds an empty `bookings` table. Both operations are idempotent.

The Dockerfile includes a `HEALTHCHECK` that probes `/api/health` every 30 s, so Coolify (and any other orchestrator that respects Docker healthchecks) can mark stuck containers unhealthy.

## Features

**Client (no auth required)**
- 5-step booking flow: service → date → time → details → confirmation.
- Service catalogue at `/services` with per-card "Zakaži" deep-link that pre-selects the service in the flow.
- "Moji termini" at `/me`: reads per-booking access tokens from `localStorage`, fetches current state from the server, polls every 30s while the tab is visible.
- Customer can reschedule, edit the note, or cancel — up to **4 hours** before the appointment. Server enforces the same cutoff.
- Rescheduling a booking that is already `approved` reverts its status to `pending` so Milena re-confirms the new slot.

**Admin (gated by single shared password)**
- Login screen at `/admin` (no separate URL). JWT in httpOnly cookie, 7-day TTL.
- Dashboard: **Pregled** (overview) · **Zahtevi** (requests + filters + detail panel) · **Kalendar** (month grid) · **Klijenti** (aggregated client list) · **Usluge** (service CRUD) · **Podešavanja** (working hours, slot step, lead time).
- Booking actions: approve / reject / mark completed (subject to the state machine below).
- Service actions: create / edit / archive / hard-delete. Hard delete is blocked (`409`) when bookings reference the service; the modal offers "Arhiviraj umesto toga" as a one-click fallback.
- Settings: per-day open/close pickers (Sundays closeable), 4-option slot raster (15/30/45/60 min), lead-time minutes. Changes take effect immediately for new bookings + availability queries.
- "Odjavi se" in the sidebar.

### Booking state machine

```
              ┌──────────────────┐
              │     pending      │ ← POST /api/bookings
              └──────┬──────┬────┘
                     │      │
            approved │      │ rejected
                     ▼      ▼
              ┌──────────┐ ┌──────────┐
              │ approved │ │ rejected │ ── customer cancel from /me
              └──┬───┬───┘ └──────────┘    or admin reject
                 │   │            ▲
       completed │   │ rejected   │ (customer reschedules approved → pending)
                 ▼   ▼            │
            ┌───────────┐         │
            │ completed │         │
            └───────────┘         │
              (terminal)
```

## API

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Liveness |
| GET | `/api/services` | — | Service catalogue |
| GET | `/api/working-hours` | — | Hours + slot step |
| GET | `/api/bookings/availability?date=&serviceId=&excludeId=` | — | Server-computed slot grid |
| POST | `/api/bookings` | — | Create; returns `{ booking, accessToken }` |
| GET | `/api/bookings/by-token/:token` | — | Customer fetch |
| PATCH | `/api/bookings/by-token/:token` | — | Customer edits date/time/note; ≥ 4h before |
| POST | `/api/bookings/by-token/:token/cancel` | — | Customer cancel; ≥ 4h before |
| GET | `/api/bookings` | admin | Admin list (`?status=` filter) |
| GET | `/api/bookings/:id` | admin | Single booking |
| PATCH | `/api/bookings/:id` | admin | Status transition |
| GET | `/api/clients` | admin | Aggregated client list |
| GET | `/api/services/all` | admin | All services incl. archived (used by admin views) |
| POST | `/api/services` | admin | Create a service |
| PATCH | `/api/services/:id` | admin | Edit / archive / un-archive |
| DELETE | `/api/services/:id` | admin | Hard delete; **409** if referenced by any booking |
| GET | `/api/config` | admin | `{ workingHours, slotStep, leadTimeMin, updatedAt }` |
| PATCH | `/api/config` | admin | Partial config update |
| POST | `/api/auth/login` | — | Body `{ password }`; sets httpOnly cookie |
| POST | `/api/auth/logout` | — | Clears cookie |
| GET | `/api/auth/me` | — | Returns `{ authed }` |

## Scripts

| Command | Effect |
| --- | --- |
| `npm run dev` | Start client + server (concurrently) |
| `npm run build` | Build the client SPA |
| `npm run install:all` | Install root + client + server deps |
| `npm --prefix server run migrate` | Apply pending SQL migrations |
| `npm --prefix server run seed` | Idempotent re-seed of demo bookings |
| `npm --prefix server run hash-password -- <plain>` | Print bcrypt hash for `.env` |
| `docker compose up -d` / `down` | Start / stop the Postgres dev container |
| `docker build -t museiris .` | Build the production image |

## Notes

- **Time zone.** Appointment `date`/`time` columns are tz-naive (Postgres `DATE` + `TIME`) and read as raw strings; the salon's wall clock (Europe/Belgrade) is the source of truth. Custom `pg` type parsers in `server/src/db.js` prevent the default `DATE → JS Date at local midnight` round-trip from shifting dates by a day in positive UTC offsets.
- **Demo seed.** First boot inserts 9 demo bookings if `bookings` is empty (see `server/src/seed.js`). Subsequent boots are no-ops. For a clean production start, set `SEED_DEMO=false` in Coolify before the first deploy — or run `DELETE FROM bookings;` once afterward.
- **`/api/health`.** Returns `{ ok: true, ts }`. Used by Coolify and any external monitor.
- **Single-master assumption.** There's one admin password; "Klijenti" view aggregates per `client_email || client_phone`. Multi-master support would require adding a master/user table and per-booking ownership.
- **Catalogue & schedule are DB-backed.** Services live in the `services` table (managed via `/admin` → Usluge); the salon-wide config (working hours, slot step, lead time) is a singleton row in `salon_config` (managed via `/admin` → Podešavanja). Bookings reference services through a `FOREIGN KEY … ON DELETE RESTRICT`; archive (`PATCH { archived: true }`) is the safe retirement path, hard `DELETE` only succeeds for unused services.

## TODOs (out of scope)

- Real-time push (currently polled at 30s).
- Email/SMS confirmations & reminders.
- Multiple admin accounts.
- Phone-based booking recovery if the customer clears `localStorage`.
- Editing customer name/phone/email after the booking is created.
- Editable categories (currently the three categories are a fixed enum in `server/src/data/services.js`).
- Drag-and-drop service reordering (currently `sortOrder` is a number input).
- Customer-side display fallback when their booking references an archived service (shows the bare id; admin views resolve the name via `listAllServices`).
- Audit log of who changed which service/config when (only `updated_at` is tracked).
