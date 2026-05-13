import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const COOKIE_NAME = "mi_admin";
const TOKEN_TTL = "7d";

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "JWT_SECRET is missing or too short (≥16 chars). Set it in server/.env."
    );
  }
  return s;
}

export async function verifyPassword(plain) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  if (typeof plain !== "string" || plain.length === 0) return false;
  return bcrypt.compare(plain, hash);
}

export function signToken(payload = {}) {
  return jwt.sign({ role: "admin", ...payload }, jwtSecret(), {
    expiresIn: TOKEN_TTL,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret());
  } catch {
    return null;
  }
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
