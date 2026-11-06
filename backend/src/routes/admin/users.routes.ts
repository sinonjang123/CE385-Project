import express from "express";
import { recordAdminAudit } from "../../repositories/audit.repository.js";
import {
  countAdmins,
  deleteUser,
  findUserByEmail,
  listUsers,
  updateUser,
} from "../../repositories/user.repository.js";
import { hasPrismaCode, principal, routeId, validationError } from "../../utils/http.js";
import { userUpdateSchema } from "../../validators/admin.schema.js";

/**
 * Admin user management. Mounted at /api/admin/users.
 * There is deliberately no POST (users self-register) and no role change (no promotion to admin).
 */
const router = express.Router();

router.get("/", async (_request, response) => {
  response.json(await listUsers());
});

router.put("/:id", async (request, response) => {
  const parsed = userUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    validationError(parsed.error, "ข้อมูลผู้ใช้ไม่ถูกต้อง และไม่สามารถเปลี่ยนสิทธิ์ผู้ใช้ได้", response);
    return;
  }
  const id = routeId(request);
  const currentUser = (await listUsers()).find((user) => user.id === id);
  if (!currentUser) {
    response.status(404).json({ message: "ไม่พบผู้ใช้" });
    return;
  }
  if (currentUser.id === principal(request).id && parsed.data.status !== "active") {
    response.status(409).json({ message: "ไม่สามารถปิดใช้งานบัญชีแอดมินที่กำลังเข้าสู่ระบบได้" });
    return;
  }
  if (currentUser.role === "admin" && currentUser.status === "active"
    && parsed.data.status !== "active" && await countAdmins() <= 1) {
    response.status(409).json({ message: "ไม่สามารถปิดใช้งานแอดมินคนสุดท้ายได้" });
    return;
  }
  const duplicateEmail = await findUserByEmail(parsed.data.email);
  if (duplicateEmail && duplicateEmail.id !== currentUser.id) {
    response.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    return;
  }
  let user;
  try {
    // Role is always kept from storage, never taken from the request.
    user = await updateUser(id, { ...parsed.data, role: currentUser.role });
  } catch (error) {
    if (hasPrismaCode(error, "P2002")) {
      response.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
      return;
    }
    throw error;
  }
  if (!user) {
    response.status(404).json({ message: "ไม่พบผู้ใช้" });
    return;
  }
  await recordAdminAudit({ actorUserId: principal(request).id, action: "update", entity: "user", entityId: user.id });
  response.json(user);
});

router.delete("/:id", async (request, response) => {
  const currentUser = principal(request);
  const id = routeId(request);
  if (currentUser.id === id) {
    response.status(409).json({ message: "ไม่สามารถลบบัญชีที่กำลังเข้าสู่ระบบได้" });
    return;
  }
  const user = (await listUsers()).find((item) => item.id === id);
  if (!user) {
    response.status(404).json({ message: "ไม่พบผู้ใช้" });
    return;
  }
  if (user.role === "admin" && user.status === "active" && await countAdmins() <= 1) {
    response.status(409).json({ message: "ไม่สามารถลบแอดมินคนสุดท้ายได้" });
    return;
  }
  if (!await deleteUser(id)) {
    response.status(409).json({ message: "ไม่สามารถลบบัญชีแอดมินนี้ได้" });
    return;
  }
  await recordAdminAudit({ actorUserId: currentUser.id, action: "delete", entity: "user", entityId: id });
  response.status(204).end();
});

export default router;
