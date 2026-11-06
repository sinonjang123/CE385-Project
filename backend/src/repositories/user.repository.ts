import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma.js";
import type { AppUserDto, AppUserRecord, UserProfileDto } from "../types/index.js";
import { integerId, publicUser, toUser } from "./mappers.js";
import { memory, memoryAvatars, memoryPasswords } from "./memoryStore.js";

// The avatar can be tens of KB: only load it for the profile endpoints, not on every auth check or user list.
const withoutAvatar = { avatarUrl: true } as const;

/** Demo mode only: create (or reset the password of) the bootstrap admin. */
export async function initializeMemoryAdmin(email: string, password: string): Promise<void> {
  if (prisma) return;
  const normalizedEmail = email.toLowerCase();
  const existing = memory.users.find((user) => user.email === normalizedEmail);
  const passwordHash = await bcrypt.hash(password, 12);
  if (existing) {
    memoryPasswords.set(existing.id, passwordHash);
    return;
  }
  const admin: AppUserDto = {
    id: "u-001",
    display_name: "คุณแอดมิน",
    email: normalizedEmail,
    role: "admin",
    status: "active",
    created_at: new Date().toISOString().slice(0, 10),
  };
  memory.users.unshift(admin);
  memoryPasswords.set(admin.id, passwordHash);
}

export async function findUserByEmail(email: string): Promise<AppUserRecord | null> {
  if (prisma) {
    const user = await prisma.user.findUnique({ where: { email }, omit: withoutAvatar });
    return user ? toUser(user) as AppUserRecord : null;
  }
  const user = memory.users.find((item) => item.email === email);
  if (!user) return null;
  return { ...user, password_hash: memoryPasswords.get(user.id) ?? "" };
}

export async function findUserById(id: string): Promise<AppUserDto | null> {
  if (prisma) {
    const parsedId = integerId(id);
    if (parsedId === null) return null;
    const user = await prisma.user.findUnique({ where: { id: parsedId }, omit: withoutAvatar });
    return user ? toUser(user) : null;
  }
  return memory.users.find((user) => user.id === id) ?? null;
}

/** Includes the password hash: use only to verify the current password. */
export async function findUserRecordById(id: string): Promise<AppUserRecord | null> {
  if (prisma) {
    const parsedId = integerId(id);
    if (parsedId === null) return null;
    const user = await prisma.user.findUnique({ where: { id: parsedId }, omit: withoutAvatar });
    return user ? toUser(user) as AppUserRecord : null;
  }
  const user = memory.users.find((item) => item.id === id);
  if (!user) return null;
  return { ...user, password_hash: memoryPasswords.get(user.id) ?? "" };
}

export async function getUserProfile(id: string): Promise<UserProfileDto | null> {
  if (prisma) {
    const parsedId = integerId(id);
    if (parsedId === null) return null;
    const user = await prisma.user.findUnique({ where: { id: parsedId } });
    return user ? { ...publicUser(toUser(user)), avatar_url: user.avatarUrl } : null;
  }
  const user = memory.users.find((item) => item.id === id);
  return user ? { ...publicUser(user), avatar_url: memoryAvatars.get(id) ?? null } : null;
}

/** Self-service profile update: only display name and avatar. Email, role and status are not editable here. */
export async function updateOwnProfile(
  id: string,
  input: { display_name: string; avatar_url: string | null },
): Promise<UserProfileDto | null> {
  if (prisma) {
    const parsedId = integerId(id);
    if (parsedId === null) return null;
    const user = await prisma.user.update({
      where: { id: parsedId },
      data: { displayName: input.display_name, avatarUrl: input.avatar_url },
    });
    return { ...publicUser(toUser(user)), avatar_url: user.avatarUrl };
  }
  const user = memory.users.find((item) => item.id === id);
  if (!user) return null;
  user.display_name = input.display_name;
  if (input.avatar_url) memoryAvatars.set(id, input.avatar_url);
  else memoryAvatars.delete(id);
  return { ...publicUser(user), avatar_url: input.avatar_url };
}

export async function updatePasswordHash(id: string, passwordHash: string): Promise<boolean> {
  if (prisma) {
    const parsedId = integerId(id);
    if (parsedId === null) return false;
    await prisma.user.update({ where: { id: parsedId }, data: { passwordHash } });
    return true;
  }
  if (!memory.users.some((user) => user.id === id)) return false;
  memoryPasswords.set(id, passwordHash);
  return true;
}

/** Self-registration always creates a `user` role account. */
export async function createUser(input: {
  display_name: string;
  email: string;
  password_hash: string;
}): Promise<AppUserDto> {
  if (prisma) {
    const row = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.password_hash,
        displayName: input.display_name,
        role: "user",
        status: "active",
      },
    });
    return toUser(row);
  }
  const user: AppUserDto = {
    id: `u-${crypto.randomUUID()}`,
    display_name: input.display_name,
    email: input.email,
    role: "user",
    status: "active",
    created_at: new Date().toISOString().slice(0, 10),
  };
  memory.users.unshift(user);
  memoryPasswords.set(user.id, input.password_hash);
  return user;
}

export async function listUsers(): Promise<AppUserDto[]> {
  if (prisma) {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, omit: withoutAvatar });
    return users.map((user) => toUser(user));
  }
  return structuredClone(memory.users);
}

export async function updateUser(
  id: string,
  input: { display_name: string; email: string; role: "admin" | "user"; status: "active" | "pending" },
): Promise<AppUserDto | null> {
  if (prisma) {
    const parsedId = integerId(id);
    if (parsedId === null) return null;
    const user = await prisma.user.update({
      where: { id: parsedId },
      data: { displayName: input.display_name, email: input.email, role: input.role, status: input.status },
    });
    return toUser(user);
  }
  const user = memory.users.find((item) => item.id === id);
  if (!user) return null;
  Object.assign(user, input);
  return structuredClone(user);
}

export async function deleteUser(id: string): Promise<boolean> {
  if (!prisma) {
    const user = memory.users.find((item) => item.id === id);
    if (!user) return false;
    memory.users = memory.users.filter((item) => item.id !== id);
    memoryPasswords.delete(id);
    memoryAvatars.delete(id);
    return true;
  }
  const parsedId = integerId(id);
  if (parsedId === null) return false;
  const user = await prisma.user.findUnique({ where: { id: parsedId } });
  if (!user || user.role === "admin") return false;
  await prisma.user.delete({ where: { id: parsedId } });
  return true;
}

export async function countAdmins(): Promise<number> {
  if (prisma) return prisma.user.count({ where: { role: "admin", status: "active" } });
  return memory.users.filter((user) => user.role === "admin" && user.status === "active").length;
}
