import type { z } from "zod";
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
