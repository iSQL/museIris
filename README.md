# Muse Iris — atelier booking app

Serbian-language ("sr-Latn") booking web app for **Muse Iris**, a one-master manicure/pedicure atelier. Master: Milena. Location: Žabari.

- `client/` — Vite + React (JS) frontend, port of the Claude Design prototype.
- `server/` — Node + Express backend with SQLite (better-sqlite3) persistence.

## Run

Requires Node 18+ (LTS recommended) and npm.

```sh
# one-time install
npm run install:all

# (optional) seed demo bookings — runs automatically on first server boot too
npm --prefix server run seed

# start both dev servers (Express on :3001, Vite on :5173)
npm run dev
```

Then open http://localhost:5173/ for the client booking flow, http://localhost:5173/admin for the admin dashboard.

## API

Express runs on `:3001`. Vite proxies `/api/*` to it during dev.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | liveness |
| GET | `/api/services` | service catalogue |
| GET | `/api/working-hours` | salon hours + slot step |
| GET | `/api/bookings?status=` | list (admin) |
| GET | `/api/bookings/:id` | single booking |
| GET | `/api/bookings/availability?date=&serviceId=` | server-computed slot grid |
| POST | `/api/bookings` | create pending booking |
| PATCH | `/api/bookings/:id` | update status |
| GET | `/api/clients` | aggregated client list |

## TODOs (out of scope for v1)

- Auth on `/admin` and the admin API routes (currently unguarded).
- Email/SMS notifications & reminders.
- Booking edit/reschedule (only status changes are supported).
- Admin password / role-based access.
