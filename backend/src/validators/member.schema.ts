import { z } from "zod";

/** Product ids are integers in the database and strings such as "p-001" in demo mode. */
export const productIdParamSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9-]+$/);

export const searchIdParamSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9-]+$/);

export const recordSearchSchema = z.object({
  keyword: z.string().trim().min(1, "กรุณากรอกคำค้นหา").max(100, "คำค้นหาต้องไม่เกิน 100 ตัวอักษร"),
}).strict();
