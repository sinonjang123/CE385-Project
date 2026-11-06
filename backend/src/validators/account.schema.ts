import { z } from "zod";
import { passwordSchema } from "./common.schema.js";

/** ~110 KB of image data once base64 is decoded. The user site resizes avatars to 256x256 before upload. */
export const maxAvatarLength = 150_000;

// Raster images only (no SVG, which can carry scripts), encoded as a base64 data URL.
const avatarDataUrlSchema = z.string()
  .max(maxAvatarLength, "รูปโปรไฟล์มีขนาดใหญ่เกินไป")
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/, "รองรับเฉพาะรูป PNG, JPEG หรือ WebP");

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  avatarUrl: avatarDataUrlSchema.nullable(),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: passwordSchema,
}).strict().refine((data) => data.currentPassword !== data.newPassword, {
  message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม",
  path: ["newPassword"],
});
