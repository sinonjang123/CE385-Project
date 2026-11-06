import type { NextFunction, Request, Response } from "express";
import { findUserById } from "../repositories/user.repository.js";
import { verifyAccessToken } from "../services/token.service.js";
import type { AuthPrincipal } from "../types/index.js";

declare global {
  namespace Express {
    interface Request {
      principal?: AuthPrincipal;
    }
  }
}

/** Any signed-in, active account (user or admin). Role is loaded from storage, not from the token. */
export async function requireUser(request: Request, response: Response, next: NextFunction) {
  const [scheme, token] = (request.header("authorization") ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    response.status(401).json({ message: "กรุณาเข้าสู่ระบบ" });
    return;
  }
  const subject = await verifyAccessToken(token);
  if (!subject) {
    response.status(401).json({ message: "เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่" });
    return;
  }
  const user = await findUserById(subject);
  if (!user || user.status !== "active") {
    response.status(401).json({ message: "บัญชีนี้ไม่สามารถใช้งานได้ กรุณาเข้าสู่ระบบใหม่" });
    return;
  }
  request.principal = {
    id: user.id,
    display_name: user.display_name,
    email: user.email,
    role: user.role,
  };
  next();
}

/** Must run after requireUser. */
export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (request.principal?.role !== "admin") {
    response.status(403).json({ message: "บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ" });
    return;
  }
  next();
}
