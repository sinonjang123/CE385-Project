import { z } from "zod";
import type { CatalogData, Favorite, LoginResponse, PriceHistory, Product, RecentSearch, StoreOffer, UserProfile } from "../types/models";

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

export const profileFormSchema = z.object({
  displayName: z.string().trim().min(2, "ชื่อที่แสดงต้องมีอย่างน้อย 2 ตัวอักษร").max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  avatarUrl: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/, "รองรับเฉพาะรูป PNG, JPEG หรือ WebP").nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
  newPassword: z.string().min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร").max(72, "รหัสผ่านต้องไม่เกิน 72 ตัวอักษร"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม",
  path: ["newPassword"],
});

// ---------- API responses (validated after receiving) ----------

export const authUserSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
});

export const profileResponseSchema: z.ZodType<{ user: UserProfile }> = z.object({
  user: authUserSchema.extend({ avatar_url: z.string().nullable() }),
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
  category: z.enum(["เมาส์", "คีย์บอร์ด", "หูฟัง", "โน้ตบุ๊ก", "รองเท้า", "สมาร์ทวอทช์", "พาวเวอร์แบงก์", "สายชาร์จ", "จอคอมพิวเตอร์"]),
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
  in_stock: z.boolean(),
  promo_ends_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  promo_ended: z.boolean(),
});

export const catalogSchema: z.ZodType<CatalogData> = z.object({
  products: z.array(productSchema),
  offers: z.array(offerSchema),
});

export const favoritesResponseSchema: z.ZodType<{ favorites: Favorite[] }> = z.object({
  favorites: z.array(z.object({ product_id: z.string(), created_at: z.string() })),
});

const recentSearchSchema: z.ZodType<RecentSearch> = z.object({ id: z.string(), keyword: z.string(), searched_at: z.string() });

export const searchesResponseSchema: z.ZodType<{ searches: RecentSearch[] }> = z.object({ searches: z.array(recentSearchSchema) });

export const recordSearchResponseSchema: z.ZodType<{ search: RecentSearch }> = z.object({ search: recentSearchSchema });

export const searchKeywordSchema = z.string().trim().min(1).max(100);

export const priceHistorySchema: z.ZodType<PriceHistory> = z.object({
  mode: z.literal("mock"),
  product_id: z.string(),
  days: z.number().int().positive(),
  series: z.array(z.object({
    store: z.enum(["Shopee", "Lazada", "Amazon"]),
    points: z.array(z.object({ date: z.string(), price: z.number() })),
  })),
});
