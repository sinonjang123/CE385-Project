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
