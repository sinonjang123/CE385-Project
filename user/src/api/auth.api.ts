import { z } from "zod";
import type { LoginResponse } from "../types/models";
import { http } from "./http";
import { loginResponseSchema, loginSchema, registerSchema } from "./schemas";

export async function login(input: z.infer<typeof loginSchema>): Promise<LoginResponse> {
  const request = loginSchema.parse(input);
  const response = await http.post("/auth/login", request);
  return loginResponseSchema.parse(response.data);
}

/** Self-registration always creates a regular `user` account (enforced by the backend). */
export async function register(input: z.infer<typeof registerSchema>): Promise<LoginResponse> {
  const { confirmPassword: _confirmPassword, ...request } = registerSchema.parse(input);
  const response = await http.post("/auth/register", request);
  return loginResponseSchema.parse(response.data);
}

const adminHandoffSchema = z.object({ code: z.string().min(1) });

/**
 * Asks the backend for a one-time code that signs this admin into the separate admin app.
 * The backend checks the admin role; a regular user gets 403. Pass the token when it is not saved yet.
 */
export async function requestAdminHandoff(token?: string): Promise<string> {
  const response = await http.post("/auth/admin-handoff", {}, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  return adminHandoffSchema.parse(response.data).code;
}
