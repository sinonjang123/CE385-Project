import type { NextFunction, Request, Response } from "express";
import { hasPrismaCode } from "../utils/http.js";

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  // Thrown by express.json() when the body exceeds the route's size limit (e.g. an oversized avatar).
  if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
    response.status(413).json({ message: "ข้อมูลที่ส่งมีขนาดใหญ่เกินไป" });
    return;
  }
  // Log only the error name: never log request bodies, tokens or stack traces with user data.
  console.error("Unhandled API error.", error instanceof Error ? error.name : "Unknown error.");
  if (hasPrismaCode(error, "P2025")) {
    response.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการ" });
    return;
  }
  response.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่" });
}
