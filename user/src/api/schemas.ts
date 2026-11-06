import { z } from "zod";
import type { CatalogData, LoginResponse, Product, StoreOffer } from "../types/models";

// ---------- Form input (validated before sending) ----------

export const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(72, "รหัสผ่านต้องไม่เกิน 72 ตัวอักษร"),
});

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, "ชื่อที่แสดงต้องมีอย่างน้อย 2 ตัวอักษร").max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  email: z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(72, "รหัสผ่านต้องไม่เกิน 72 ตัวอักษร"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
});

// ---------- API responses (validated after receiving) ----------

export const authUserSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
});

export const loginResponseSchema: z.ZodType<LoginResponse> = z.object({
  accessToken: z.string().min(1),
  demo: z.boolean(),
  user: authUserSchema,
});

export const productSchema: z.ZodType<Product> = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  category: z.enum(["เมาส์", "คีย์บอร์ด", "หูฟัง", "โน้ตบุ๊ก", "รองเท้า", "สมาร์ทวอทช์"]),
  description: z.string(),
  image_url: z.string(),
  emoji: z.string(),
  specs: z.array(z.string()),
  created_at: z.string(),
});

export const offerSchema: z.ZodType<StoreOffer> = z.object({
  id: z.string(),
  product_id: z.string(),
  store: z.enum(["Shopee", "Lazada", "Amazon"]),
  price: z.number(),
  original_price: z.number(),
  shipping_info: z.string(),
  product_url: z.string(),
  updated_at: z.string(),
});

export const catalogSchema: z.ZodType<CatalogData> = z.object({
  products: z.array(productSchema),
  offers: z.array(offerSchema),
});
