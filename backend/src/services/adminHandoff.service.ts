import { randomBytes } from "node:crypto";

/**
 * One-time codes that move a signed-in admin from the user site to the admin app.
 * The two apps run on different origins, so their sessionStorage is not shared.
 * A code is random, single-use and expires quickly; the JWT itself never goes into a URL.
 * Codes live in process memory, so they only work on a single API instance.
 */
const ttlMs = 60 * 1000;
const codes = new Map<string, { userId: string; expiresAt: number }>();

function removeExpired(now: number) {
  for (const [code, entry] of codes) {
    if (entry.expiresAt <= now) codes.delete(code);
  }
}

export function issueAdminHandoffCode(userId: string): string {
  const now = Date.now();
  removeExpired(now);
  const code = randomBytes(32).toString("base64url");
  codes.set(code, { userId, expiresAt: now + ttlMs });
  return code;
}

/** Returns the user id once; the code is deleted whether or not it is still valid. */
export function redeemAdminHandoffCode(code: string): string | null {
  const entry = codes.get(code);
  codes.delete(code);
  if (!entry || entry.expiresAt <= Date.now()) return null;
  return entry.userId;
}
