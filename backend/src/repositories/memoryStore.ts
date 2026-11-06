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
