import express from "express";
import { getAdminAuditLog } from "../../repositories/audit.repository.js";
import { auditLimitSchema } from "../../validators/admin.schema.js";

/** Admin audit log (read-only). Mounted at /api/admin/audit. */
const router = express.Router();

router.get("/", async (request, response) => {
  const parsedLimit = auditLimitSchema.safeParse(request.query.limit);
  if (!parsedLimit.success) {
    response.status(400).json({ message: "จำนวนรายการ audit log ต้องอยู่ระหว่าง 1 ถึง 100" });
    return;
  }
  response.json(await getAdminAuditLog(parsedLimit.data));
});

export default router;
