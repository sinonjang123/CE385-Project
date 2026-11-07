import { z } from "zod";
import { emailSchema, passwordSchema } from "./common.schema.js";

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
});

/** One-time admin handoff code (base64url of 32 random bytes = 43 characters). */
export const adminHandoffSchema = z.object({
  code: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
}).strict();
