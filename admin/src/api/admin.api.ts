import type { AdminData, AppUser, AuditEntry, Product, StoreOffer, UserView } from "../types/models";
import { http } from "./http";
import { z } from "zod";
import { adminDataSchema, auditEntrySchema, offerSchema, productSchema, userSchema, userViewSchema } from "./schemas";

/** Admin-only endpoints. The backend rejects these for non-admin accounts (401/403). */

export async function getAdminData(): Promise<AdminData> {
  const response = await http.get("/admin/data");
  return adminDataSchema.parse(response.data);
}

export async function saveProduct(product: Product, isNew: boolean): Promise<Product> {
  const response = isNew
    ? await http.post("/admin/products", product)
    : await http.put(`/admin/products/${encodeURIComponent(product.id)}`, product);
  return productSchema.parse(response.data);
}

export async function deleteProduct(id: string): Promise<void> {
  await http.delete(`/admin/products/${encodeURIComponent(id)}`);
}

export async function saveOffer(offer: StoreOffer, isNew: boolean): Promise<StoreOffer> {
  const response = isNew
    ? await http.post("/admin/offers", offer)
    : await http.put(`/admin/offers/${encodeURIComponent(offer.id)}`, offer);
  return offerSchema.parse(response.data);
}

export async function deleteOffer(id: string): Promise<void> {
  await http.delete(`/admin/offers/${encodeURIComponent(id)}`);
}

export async function updateUser(user: AppUser): Promise<AppUser> {
  const { display_name, email, status } = user;
  const response = await http.put(`/admin/users/${encodeURIComponent(user.id)}`, { display_name, email, status });
  return userSchema.parse(response.data);
}

export async function deleteUser(id: string): Promise<void> {
  await http.delete(`/admin/users/${encodeURIComponent(id)}`);
}

export async function getAuditLog(limit = 8): Promise<AuditEntry[]> {
  const response = await http.get("/admin/audit", { params: { limit } });
  return z.array(auditEntrySchema).parse(response.data);
}

/** Read-only "View as User" snapshot. The backend audits every call. */
export async function getUserView(id: string): Promise<UserView> {
  const response = await http.get(`/admin/users/${encodeURIComponent(id)}/view`);
  return userViewSchema.parse(response.data);
}
