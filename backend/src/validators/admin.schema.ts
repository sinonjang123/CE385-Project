import { z } from "zod";
import { emailSchema } from "./common.schema.js";

export const storeSchema = z.enum(["Shopee", "Lazada", "Amazon"]);

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(200),
  brand: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(100),
  description: z.string().max(5000).default(""),
  image_url: z.string().max(500).refine((value) => !value || value.startsWith("https://") || value.startsWith("http://"), "รูปภาพต้องเป็นลิงก์ HTTP(S)").default(""),
  emoji: z.string().max(20).default("📦"),
  specs: z.array(z.string().trim().min(1).max(255)).max(50).default([]),
});

export const offerSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().min(1),
  store: storeSchema,
  price: z.number().finite().nonnegative().max(99_999_999.99),
  original_price: z.number().finite().nonnegative().max(99_999_999.99),
  shipping_info: z.string().max(255).default(""),
  product_url: z.string().max(500).refine((value) => value === "#" || value.startsWith("https://") || value.startsWith("http://"), "ลิงก์สินค้าต้องเป็น HTTP(S)").default("#"),
}).refine((offer) => offer.original_price >= offer.price, {
  message: "ราคาปกติต้องมากกว่าหรือเท่ากับราคาปัจจุบัน",
  path: ["original_price"],
});

// Role is intentionally not accepted: admins cannot promote users through the API.
export const userUpdateSchema = z.object({
  display_name: z.string().trim().min(2).max(100),
  email: emailSchema,
  status: z.enum(["active", "pending"]),
}).strict();

export const auditLimitSchema = z.coerce.number().int().min(1).max(100).default(100);
