import type { UserProfile } from "../types/models";
import { http } from "./http";
import { changePasswordSchema, profileFormSchema, profileResponseSchema } from "./schemas";

/** The account is identified by the session token; the backend never accepts a user id from the client here. */
export async function getProfile(): Promise<UserProfile> {
  const response = await http.get("/account/profile");
  return profileResponseSchema.parse(response.data).user;
}

export async function updateProfile(input: { displayName: string; avatarUrl: string | null }): Promise<UserProfile> {
  const request = profileFormSchema.parse(input);
  const response = await http.patch("/account/profile", request);
  return profileResponseSchema.parse(response.data).user;
}

export async function changePassword(input: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<void> {
  const { currentPassword, newPassword } = changePasswordSchema.parse(input);
  await http.post("/account/password", { currentPassword, newPassword });
}
