import { z } from "zod";

export const emailSchema = z.string().trim().max(255).email().transform((email) => email.toLowerCase());

export const passwordSchema = z.string().min(8).max(72).refine(
  (password) => Buffer.byteLength(password, "utf8") <= 72,
  "รหัสผ่านต้องมีความยาวไม่เกิน 72 ไบต์",
);

/** Calendar date as YYYY-MM-DD that must exist (e.g. 2026-02-30 is rejected). */
export const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD").refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "วันที่ไม่ถูกต้อง");
