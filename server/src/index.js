import express from "express";
import { db } from "./db.js";
import healthRouter from "./routes/health.js";
import servicesRouter from "./routes/services.js";
import bookingsRouter from "./routes/bookings.js";
import clientsRouter from "./routes/clients.js";
import { runSeedIfEmpty } from "./seed.js";

// TODO(auth): admin endpoints (/api/bookings, /api/clients, PATCH) are unguarded
// in v1. Add an auth layer before exposing this server outside localhost.

const app = express();
app.use(express.json({ limit: "64kb" }));

app.use("/api/health", healthRouter);
app.use("/api", servicesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/clients", clientsRouter);

app.use((err, _req, res, _next) => {
  console.error("[server] error:", err);
  res.status(500).json({ error: "Server error." });
});

const PORT = Number(process.env.PORT) || 3001;

runSeedIfEmpty();

const server = app.listen(PORT, () => {
  console.log(`[server] Muse Iris API listening on http://localhost:${PORT}`);
});

const shutdown = (signal) => () => {
  console.log(`[server] received ${signal}, closing.`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on("SIGINT", shutdown("SIGINT"));
process.on("SIGTERM", shutdown("SIGTERM"));
