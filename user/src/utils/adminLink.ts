import { requestAdminHandoff } from "../api/auth.api";

// The admin back office is a separate app (see /admin). Its URL is configurable per environment.
export const adminUrl = import.meta.env.VITE_ADMIN_URL ?? "http://localhost:5174";

/** Opens the admin dashboard already signed in, using a one-time code in the URL fragment (never sent to a server). */
export async function openAdminDashboard(token?: string): Promise<void> {
  const code = await requestAdminHandoff(token);
  window.location.assign(`${adminUrl}/#handoff=${encodeURIComponent(code)}`);
}
