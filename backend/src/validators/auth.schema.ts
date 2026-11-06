import { z } from "zod";
import { emailSchema, passwordSchema } from "./common.schema.js";

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: passwordSchema,
});
