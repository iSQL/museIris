import { Router } from "express";
import { SERVICES, CATEGORIES, WORKING_HOURS, SLOT_STEP, LEAD_TIME_MIN } from "../data/services.js";

const router = Router();

router.get("/services", (_req, res) => {
  res.json({ services: SERVICES, categories: CATEGORIES });
});

router.get("/working-hours", (_req, res) => {
  res.json({ workingHours: WORKING_HOURS, slotStep: SLOT_STEP, leadTime: LEAD_TIME_MIN });
});

export default router;
