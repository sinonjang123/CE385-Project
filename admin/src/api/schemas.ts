import { z } from "zod";
import type { AdminData, AppUser, AuditEntry, LoginResponse, Product, StoreOffer, UserView } from "../types/models";

// ---------- Form input ----------

export const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(72, "รหัสผ่านต้องไม่เกิน 72 ตัวอักษร"),
});

// ---------- API responses ----------

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

export const userSchema: z.ZodType<AppUser> = z.object({
  ...authUserSchema.shape,
  status: z.enum(["active", "pending"]),
  created_at: z.string(),
});

export const adminDataSchema: z.ZodType<AdminData> = z.object({
  products: z.array(productSchema),
  offers: z.array(offerSchema),
  users: z.array(userSchema),
});

export const healthSchema = z.object({
  status: z.literal("ok"),
  mode: z.enum(["demo", "postgres"]),
  persistence: z.enum(["memory", "postgresql"]),
});

export const auditEntrySchema: z.ZodType<AuditEntry> = z.object({
  id: z.string(),
  actor_user_id: z.string().nullable(),
  action: z.enum(["create", "update", "delete", "view"]),
  entity: z.enum(["product", "offer", "user"]),
  entity_id: z.string(),
  created_at: z.string(),
});

export const userViewSchema: z.ZodType<UserView> = z.object({
  mode: z.literal("read-only"),
  user: z.object({
    id: z.string(),
    display_name: z.string(),
    email: z.string().email(),
    role: z.enum(["admin", "user"]),
    status: z.enum(["active", "pending"]),
    created_at: z.string(),
    avatar_url: z.string().nullable(),
  }),
  favorites: z.array(z.object({ product_id: z.string(), created_at: z.string() })),
  searches: z.array(z.object({ id: z.string(), keyword: z.string(), searched_at: z.string() })),
});
