import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";
import { migrate } from "./lib/migrate.js";
import { runSeedIfEmpty } from "./seed.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import servicesRouter from "./routes/services.js";
import bookingsRouter from "./routes/bookings.js";
import clientsRouter from "./routes/clients.js";
import configRouter from "./routes/config.js";
import couponsRouter from "./routes/coupons.js";

const here = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: "64kb" }));
app.use(cookieParser());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api", servicesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/config", configRouter);
app.use("/api/coupons", couponsRouter);

// In production the same container serves the built SPA on /. Vite handles
// this in dev via its own server on :5173.
if (process.env.NODE_ENV === "production") {
  const distDir = resolve(here, "..", "..", "client", "dist");
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(resolve(distDir, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error("[server] error:", err);
  res.status(500).json({ error: "Server error." });
});

const PORT = Number(process.env.PORT) || 3001;

async function start() {
  await migrate();
  await runSeedIfEmpty();

  const server = app.listen(PORT, () => {
    console.log(`[server] Muse Iris API listening on http://localhost:${PORT}`);
  });

  const shutdown = (signal) => () => {
    console.log(`[server] received ${signal}, closing.`);
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  };
  process.on("SIGINT", shutdown("SIGINT"));
  process.on("SIGTERM", shutdown("SIGTERM"));
}

start().catch((err) => {
  console.error("[server] startup failed:", err);
  pool.end().finally(() => process.exit(1));
});
