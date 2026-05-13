import { Router } from "express";
import { getConfig, updateConfig } from "../lib/config.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res, next) => {
  try {
    const cfg = await getConfig();
    res.json({ config: cfg });
  } catch (err) {
    next(err);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const updated = await updateConfig(req.body || {});
    res.json({ config: updated });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
