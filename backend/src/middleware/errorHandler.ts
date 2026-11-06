import type { NextFunction, Request, Response } from "express";
import { hasPrismaCode } from "../utils/http.js";

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  // Log only the error name: never log request bodies, tokens or stack traces with user data.
  console.error("Unhandled API error.", error instanceof Error ? error.name : "Unknown error.");
  if (hasPrismaCode(error, "P2025")) {
    response.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการ" });
    return;
  }
  response.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่" });
}
