import type { Request, Response } from "express";
import type { z } from "zod";
import type { AuthPrincipal } from "../types/index.js";

export function validationError(error: z.ZodError, message: string, response: Response) {
  response.status(400).json({
    message,
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

export function principal(request: Request): AuthPrincipal {
  if (!request.principal) throw new Error("Authenticated route is missing a principal.");
  return request.principal;
}

export function routeId(request: Request): string {
  const id = request.params.id;
  return typeof id === "string" ? id : "";
}

export function hasPrismaCode(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === code);
}
