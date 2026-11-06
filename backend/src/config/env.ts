import { randomBytes } from "node:crypto";
import { emailSchema, passwordSchema } from "../validators/common.schema.js";

export const isProduction = process.env.NODE_ENV === "production";
export const port = Number(process.env.PORT ?? 3001);

// --- Database ---
export const databaseUrl = process.env.DATABASE_URL || undefined;
if (isProduction && !databaseUrl) {
  throw new Error("DATABASE_URL is required in production.");
}

// --- JWT ---
const configuredSecret = process.env.JWT_SECRET;
if (isProduction && (!configuredSecret || configuredSecret.length < 32)) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters in production.");
}
export const jwtSecret = new TextEncoder().encode(configuredSecret || randomBytes(32).toString("base64url"));
export const jwtIssuer = "find-this-api";
export const jwtAudience = "find-this-app";

// --- Admin bootstrap (the only way an admin account is created) ---
const configuredAdminEmail = (process.env.DEMO_ADMIN_EMAIL ?? "").trim();
const configuredAdminPassword = process.env.DEMO_ADMIN_PASSWORD ?? "";
if (Boolean(configuredAdminEmail) !== Boolean(configuredAdminPassword)) {
  throw new Error("Set both DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD, or leave both unset.");
}
if (isProduction && !configuredAdminEmail) {
  throw new Error("Set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD in production.");
}

function parseAdminBootstrap(): { email: string; password: string } | null {
  if (!configuredAdminEmail) return null;
  const email = emailSchema.safeParse(configuredAdminEmail);
  const password = passwordSchema.min(12).safeParse(configuredAdminPassword);
  if (!email.success || !password.success) {
    throw new Error("Admin bootstrap requires a valid email and a password of at least 12 characters.");
  }
  return { email: email.data, password: password.data };
}

export const adminBootstrap = parseAdminBootstrap();
