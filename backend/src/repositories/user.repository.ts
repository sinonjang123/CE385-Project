import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma.js";
import type { AppUserDto, AppUserRecord } from "../types/index.js";
import { integerId, toUser } from "./mappers.js";
import { memory, memoryPasswords } from "./memoryStore.js";

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
    const user = await prisma.user.findUnique({ where: { email } });
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
    const user = await prisma.user.findUnique({ where: { id: parsedId } });
    return user ? toUser(user) : null;
  }
  return memory.users.find((user) => user.id === id) ?? null;
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
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
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
