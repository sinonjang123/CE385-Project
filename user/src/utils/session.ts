import { authUserSchema } from "../api/schemas";
import type { AuthUser } from "../types/models";

// The stored user is only used for display. Every permission is re-checked by the backend.
const userKey = "find-this-demo-session";
const tokenKey = "find-this-demo-token";

export function readAuthUser(): AuthUser | null {
  const saved = sessionStorage.getItem(userKey);
  if (!saved) return null;
  try {
    const result = authUserSchema.safeParse(JSON.parse(saved));
    return result.success ? result.data : null;
  } catch {
    sessionStorage.removeItem(userKey);
    return null;
  }
}

export function readToken(): string | null {
  return sessionStorage.getItem(tokenKey);
}

export function saveSession(user: AuthUser, token: string): void {
  sessionStorage.setItem(userKey, JSON.stringify(user));
  sessionStorage.setItem(tokenKey, token);
}

export function clearSession(): void {
  sessionStorage.removeItem(userKey);
  sessionStorage.removeItem(tokenKey);
}

/** Refresh the display copy of the user after a profile change, keeping the current token. */
export function updateSessionUser(user: AuthUser): void {
  if (readToken()) sessionStorage.setItem(userKey, JSON.stringify(user));
}
