import type { z } from "zod";
import type { LoginResponse } from "../types/models";
import { http } from "./http";
import { loginResponseSchema, loginSchema } from "./schemas";

/** Admin accounts cannot be registered here; they come from the backend bootstrap/seed only. */
export async function login(input: z.infer<typeof loginSchema>): Promise<LoginResponse> {
  const request = loginSchema.parse(input);
  const response = await http.post("/auth/login", request);
  return loginResponseSchema.parse(response.data);
}

/** Exchanges a one-time handoff code from the user site for an admin session (role re-checked by the backend). */
export async function redeemAdminHandoff(code: string): Promise<LoginResponse> {
  const response = await http.post("/auth/admin-handoff/redeem", { code });
  return loginResponseSchema.parse(response.data);
}
