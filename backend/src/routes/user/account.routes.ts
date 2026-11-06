import bcrypt from "bcryptjs";
import express from "express";
import { requireUser } from "../../middleware/auth.js";
import { passwordChangeLimiter } from "../../middleware/rateLimits.js";
import {
  findUserRecordById,
  getUserProfile,
  updateOwnProfile,
  updatePasswordHash,
} from "../../repositories/user.repository.js";
import { principal, validationError } from "../../utils/http.js";
import { changePasswordSchema, updateProfileSchema } from "../../validators/account.schema.js";

/**
 * Signed-in user's own account: profile (display name, avatar) and password change.
 * Mounted at /api/account. The account id always comes from the verified token, never from the request body.
 */
const router = express.Router();
router.use(requireUser);

router.get("/profile", async (request, response) => {
  const profile = await getUserProfile(principal(request).id);
  if (!profile) {
    response.status(404).json({ message: "ไม่พบบัญชีผู้ใช้" });
    return;
  }
  response.json({ user: profile });
});

router.patch("/profile", async (request, response) => {
  const parsed = updateProfileSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(parsed.error, "กรุณาตรวจสอบชื่อที่แสดงและรูปโปรไฟล์", response);
    return;
  }
  const profile = await updateOwnProfile(principal(request).id, {
    display_name: parsed.data.displayName,
    avatar_url: parsed.data.avatarUrl,
  });
  if (!profile) {
    response.status(404).json({ message: "ไม่พบบัญชีผู้ใช้" });
    return;
  }
  response.json({ user: profile });
});

router.post("/password", passwordChangeLimiter, async (request, response) => {
  const parsed = changePasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(parsed.error, "กรุณาตรวจสอบรหัสผ่าน", response);
    return;
  }
  const { id } = principal(request);
  const user = await findUserRecordById(id);
  if (!user || !user.password_hash) {
    response.status(404).json({ message: "ไม่พบบัญชีผู้ใช้" });
    return;
  }
  // 400 rather than 401: the session is still valid, only the confirmation password is wrong.
  if (!await bcrypt.compare(parsed.data.currentPassword, user.password_hash)) {
    response.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    return;
  }
  await updatePasswordHash(id, await bcrypt.hash(parsed.data.newPassword, 12));
  response.status(204).end();
});

export default router;
