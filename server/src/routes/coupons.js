import { Router } from "express";
import {
  listCoupons,
  findCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  resolveDiscount,
  validateForRedemption,
} from "../lib/coupons.js";
import { findService } from "../lib/services.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// ─── public ────────────────────────────────────────────────────────────────

// Lightweight pre-flight check used by the booking form. Returns the resolved
// discount in RSD for the given service so the UI can show the final price
// without leaking the rest of the coupon row. Does NOT consume an activation.
router.get("/validate", async (req, res, next) => {
  try {
    const code = String(req.query.code || "").trim();
    const serviceId = String(req.query.serviceId || "").trim();
    if (!code) return res.status(400).json({ error: "Nedostaje kod." });
    const coupon = await findCouponByCode(code);
    const err = validateForRedemption(coupon);
    if (err) return res.status(404).json({ error: err });

    let discount = null;
    if (serviceId) {
      const svc = await findService(serviceId);
      if (svc) discount = resolveDiscount(coupon, svc.price);
    }
    res.json({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount: coupon.discountAmount,
      discount,
    });
  } catch (err) {
    next(err);
  }
});

// ─── admin ─────────────────────────────────────────────────────────────────

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const coupons = await listCoupons();
    res.json({ coupons });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const created = await createCoupon(req.body || {});
    res.status(201).json({ coupon: created });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const updated = await updateCoupon(Number(req.params.id), req.body || {});
    res.json({ coupon: updated });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    await deleteCoupon(Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
