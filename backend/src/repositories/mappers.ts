import type { Prisma } from "@prisma/client";
import type { AppUserDto, AppUserRecord, AuthPrincipal, ProductDto, StoreOfferDto } from "../types/index.js";
import { isPromoEnded } from "../utils/promo.js";

export function day(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

/** Database ids are integers; demo ids are strings such as "p-001". */
export function integerId(id: string): number | null {
  if (!/^\d+$/.test(id)) return null;
  const parsed = Number(id);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function publicUser(user: AppUserDto | AppUserRecord): AuthPrincipal {
  return {
    id: user.id,
    display_name: user.display_name,
    email: user.email,
    role: user.role,
  };
}

export function toProduct(row: {
  id: number;
  name: string;
  brand: string;
  description: string | null;
  imageUrl: string | null;
  emoji: string | null;
  createdAt: Date;
  category: { name: string };
  specs: Array<{ specText: string; sortOrder: number }>;
}): ProductDto {
  return {
    id: String(row.id),
    name: row.name,
    brand: row.brand,
    category: row.category.name,
    description: row.description ?? "",
    image_url: row.imageUrl ?? "",
    emoji: row.emoji ?? "📦",
    specs: [...row.specs].sort((a, b) => a.sortOrder - b.sortOrder).map((spec) => spec.specText),
    created_at: day(row.createdAt),
  };
}

export function toOffer(row: {
  id: number;
  productId: number;
  price: Prisma.Decimal;
  originalPrice: Prisma.Decimal | null;
  shippingInfo: string | null;
  productUrl: string;
  updatedAt: Date;
  inStock: boolean;
  promoEndsAt: Date | null;
  store: { name: string };
}): StoreOfferDto {
  // @db.Date comes back as UTC midnight, so the ISO date part is the stored calendar date.
  const promoEndsAt = row.promoEndsAt ? row.promoEndsAt.toISOString().slice(0, 10) : null;
  return {
    id: String(row.id),
    product_id: String(row.productId),
    store: row.store.name as StoreOfferDto["store"],
    price: Number(row.price),
    original_price: Number(row.originalPrice ?? row.price),
    shipping_info: row.shippingInfo ?? "",
    product_url: row.productUrl,
    updated_at: row.updatedAt.toISOString(),
    in_stock: row.inStock,
    promo_ends_at: promoEndsAt,
    promo_ended: isPromoEnded(promoEndsAt),
  };
}

export function toUser(row: {
  id: number;
  displayName: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  passwordHash?: string;
}): AppUserDto | AppUserRecord {
  return {
    id: String(row.id),
    display_name: row.displayName ?? "",
    email: row.email,
    role: row.role === "admin" ? "admin" : "user",
    status: row.status === "pending" ? "pending" : "active",
    created_at: day(row.createdAt),
    ...("passwordHash" in row ? { password_hash: row.passwordHash ?? "" } : {}),
  };
}
