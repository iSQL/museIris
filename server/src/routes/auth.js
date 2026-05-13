import { Router } from "express";
import {
  COOKIE_NAME,
  cookieOptions,
  signToken,
  verifyPassword,
  verifyToken,
} from "../lib/auth.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const { password } = req.body || {};
    const ok = await verifyPassword(password);
    if (!ok) return res.status(401).json({ error: "Pogrešna lozinka." });
    const token = signToken();
    res.cookie(COOKIE_NAME, token, cookieOptions());
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  const payload = token ? verifyToken(token) : null;
  res.json({ authed: !!payload });
});

export default router;
