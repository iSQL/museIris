import { COOKIE_NAME, verifyToken } from "../lib/auth.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Niste prijavljeni." });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Sesija je istekla." });
  req.user = payload;
  next();
}
