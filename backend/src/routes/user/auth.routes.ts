import bcrypt from "bcryptjs";
import express from "express";
import { randomBytes } from "node:crypto";
import { isDatabaseEnabled } from "../../db/prisma.js";
import { requireAdmin, requireUser } from "../../middleware/auth.js";
import { publicUser } from "../../repositories/mappers.js";
import { createUser, findUserByEmail, findUserById } from "../../repositories/user.repository.js";
import { issueAdminHandoffCode, redeemAdminHandoffCode } from "../../services/adminHandoff.service.js";
import { createAccessToken } from "../../services/token.service.js";
import type { AuthPrincipal } from "../../types/index.js";
import { hasPrismaCode, principal, validationError } from "../../utils/http.js";
import { adminHandoffSchema, loginSchema, registerSchema } from "../../validators/auth.schema.js";

/** User-facing account endpoints: register, login, current session. Mounted at /api/auth. */
const router = express.Router();

// Compared against when the email does not exist, so login timing does not reveal registered emails.
const dummyPasswordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
const pendingRegistrationEmails = new Set<string>();

async function authPayload(user: AuthPrincipal) {
  return { accessToken: await createAccessToken(user), user, demo: !isDatabaseEnabled };
}

router.post("/register", async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(parsed.error, "กรุณาตรวจสอบชื่อ อีเมล และรหัสผ่าน", response);
    return;
  }
  const { displayName, email, password } = parsed.data;
  const existing = await findUserByEmail(email);
  if (existing || pendingRegistrationEmails.has(email)) {
    response.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    return;
  }
  pendingRegistrationEmails.add(email);
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ display_name: displayName, email, password_hash: passwordHash });
    response.status(201).json(await authPayload(publicUser(user)));
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) {
      response.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
      return;
    }
    throw error;
  } finally {
    pendingRegistrationEmails.delete(email);
  }
});

router.post("/login", async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(parsed.error, "กรุณาตรวจสอบอีเมลและรหัสผ่าน", response);
    return;
  }
  const user = await findUserByEmail(parsed.data.email);
  const passwordHash = user?.password_hash || dummyPasswordHash;
  const passwordMatches = await bcrypt.compare(parsed.data.password, passwordHash);
  if (!user || user.status !== "active" || !passwordMatches) {
    response.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    return;
  }
  response.json(await authPayload(publicUser(user)));
});

router.get("/me", requireUser, (request, response) => {
  response.json({ user: principal(request) });
});

/**
 * Admin handoff: a signed-in admin on the user site gets a one-time code and opens the admin app with it,
 * so they land on the dashboard without signing in again. Role and status are re-checked on redeem.
 */
router.post("/admin-handoff", requireUser, requireAdmin, (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.json({ code: issueAdminHandoffCode(principal(request).id) });
});

router.post("/admin-handoff/redeem", async (request, response) => {
  const parsed = adminHandoffSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(parsed.error, "รหัสส่งต่อไม่ถูกต้อง", response);
    return;
  }
  const userId = redeemAdminHandoffCode(parsed.data.code);
  const user = userId ? await findUserById(userId) : null;
  if (!user || user.role !== "admin" || user.status !== "active") {
    response.status(401).json({ message: "รหัสส่งต่อหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่" });
    return;
  }
  response.setHeader("Cache-Control", "no-store");
  response.json(await authPayload(publicUser(user)));
});

export default router;
