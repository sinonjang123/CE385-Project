import { z } from "zod";

export const emailSchema = z.string().trim().max(255).email().transform((email) => email.toLowerCase());

export const passwordSchema = z.string().min(8).max(72).refine(
  (password) => Buffer.byteLength(password, "utf8") <= 72,
  "รหัสผ่านต้องมีความยาวไม่เกิน 72 ไบต์",
);
