import { prisma } from "../db/prisma.js";
import type { AdminAuditAction, AdminAuditEntity, AdminAuditEntry } from "../types/index.js";
import { integerId } from "./mappers.js";
import { memoryAuditLog } from "./memoryStore.js";

export async function recordAdminAudit(input: {
  actorUserId: string;
  action: AdminAuditAction;
  entity: AdminAuditEntity;
  entityId: string;
}): Promise<void> {
  if (!prisma) {
    memoryAuditLog.unshift({
      id: crypto.randomUUID(),
      actor_user_id: input.actorUserId,
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId,
      created_at: new Date().toISOString(),
    });
    return;
  }
  const actorId = integerId(input.actorUserId);
  if (actorId === null) throw new Error("Cannot write an audit log for an invalid actor.");
  await prisma.adminAuditLog.create({
    data: {
      actorUserId: actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
    },
  });
}

export async function getAdminAuditLog(limit = 100): Promise<AdminAuditEntry[]> {
  if (!prisma) return structuredClone(memoryAuditLog.slice(0, limit));
  const entries = await prisma.adminAuditLog.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });
  return entries.map((entry) => ({
    id: String(entry.id),
    actor_user_id: entry.actorUserId === null ? null : String(entry.actorUserId),
    action: entry.action as AdminAuditAction,
    entity: entry.entity as AdminAuditEntity,
    entity_id: entry.entityId,
    created_at: entry.createdAt.toISOString(),
  }));
}
