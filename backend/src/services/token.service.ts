import { SignJWT, jwtVerify } from "jose";
import { jwtAudience, jwtIssuer, jwtSecret } from "../config/env.js";
import type { AuthPrincipal } from "../types/index.js";

export async function createAccessToken(user: AuthPrincipal): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role, display_name: user.display_name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(jwtIssuer)
    .setAudience(jwtAudience)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(jwtSecret);
}

/** Returns the user id (subject) of a valid token, or null. Role claims are never trusted. */
export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret, { issuer: jwtIssuer, audience: jwtAudience });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
