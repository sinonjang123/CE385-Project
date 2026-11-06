import express from "express";
import { requireAdmin, requireUser } from "../../middleware/auth.js";
import auditRouter from "./audit.routes.js";
import catalogRouter from "./catalog.routes.js";
import usersRouter from "./users.routes.js";

/** Every /api/admin/* route requires a signed-in, active admin. */
const router = express.Router();

router.use(requireUser, requireAdmin);
router.use("/users", usersRouter);
router.use("/audit", auditRouter);
router.use("/", catalogRouter);

export default router;
