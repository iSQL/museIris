import { randomBytes } from "node:crypto";

// 24 bytes → 32 base64url chars. Plenty of entropy for an unauthenticated
// resource access token; URL-safe so it can ride in a path segment.
export function newAccessToken() {
  return randomBytes(24).toString("base64url");
}
