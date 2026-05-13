import { Router } from "express";
import { CATEGORIES } from "../data/services.js";
import {
  listActive,
  listAll,
  findService,
  createService,
  updateService,
  deleteService,
} from "../lib/services.js";
import { getConfig } from "../lib/config.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// ─── public ────────────────────────────────────────────────────────────────

router.get("/services", async (_req, res, next) => {
  try {
    const services = await listActive();
    res.json({ services, categories: CATEGORIES });
  } catch (err) {
    next(err);
  }
});

router.get("/working-hours", async (_req, res, next) => {
  try {
    const cfg = await getConfig();
    res.json({
      workingHours: cfg.workingHours,
      slotStep: cfg.slotStep,
      leadTime: cfg.leadTimeMin,
    });
  } catch (err) {
    next(err);
  }
});

// ─── admin ─────────────────────────────────────────────────────────────────

router.get("/services/all", requireAuth, async (_req, res, next) => {
  try {
    const services = await listAll();
    res.json({ services, categories: CATEGORIES });
  } catch (err) {
    next(err);
  }
});

router.post("/services", requireAuth, async (req, res, next) => {
  try {
    const created = await createService(req.body || {});
    res.status(201).json({ service: created });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.patch("/services/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await findService(req.params.id);
    if (!existing) return res.status(404).json({ error: "Usluga ne postoji." });
    const updated = await updateService(req.params.id, req.body || {});
    res.json({ service: updated });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.delete("/services/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await findService(req.params.id);
    if (!existing) return res.status(404).json({ error: "Usluga ne postoji." });
    await deleteService(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
