import { demoData } from "../data/demoData.js";
import type { AdminAuditEntry, AdminData } from "../types/index.js";

/**
 * In-memory storage used only when DATABASE_URL is not configured (demo mode).
 * Data resets whenever the API process restarts.
 */
export const memory: AdminData = structuredClone(demoData);
export const memoryPasswords = new Map<string, string>();
export const memoryAvatars = new Map<string, string>();
export const memoryAuditLog: AdminAuditEntry[] = [];
export const memoryFavorites: Array<{ user_id: string; product_id: string; created_at: string }> = [];
export const memorySearches: Array<{ id: string; user_id: string; keyword: string; searched_at: string }> = [];

export function removeWhere<T>(rows: T[], matches: (row: T) => boolean): void {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (matches(rows[index] as T)) rows.splice(index, 1);
  }
}

// The database does these with ON DELETE CASCADE.
export function removeMemoryUserData(userId: string): void {
  removeWhere(memoryFavorites, (row) => row.user_id === userId);
  removeWhere(memorySearches, (row) => row.user_id === userId);
}

export function removeMemoryProductData(productId: string): void {
  removeWhere(memoryFavorites, (row) => row.product_id === productId);
}


