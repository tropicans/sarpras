import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client.server";
import { auditLogs } from "../../db/schema";

export type AuditActorType = "system" | "user";
export type AuditEntityType = "booking" | "asset" | "user";

export interface RecordAuditParams {
	actorId: string;
	actorType?: AuditActorType;
	action: string;
	entityType: AuditEntityType;
	entityId?: string | null;
	metadata?: Record<string, unknown> | null;
}

/**
 * Records an append-only audit event inside a transaction or using default db client.
 */
export async function recordAuditEvent(txOrDb: any, params: RecordAuditParams) {
	const client = txOrDb || db;
	const [created] = await client
		.insert(auditLogs)
		.values({
			actorId: params.actorId,
			actorType: params.actorType || "user",
			action: params.action,
			entityType: params.entityType,
			entityId: params.entityId,
			metadata: {
				...params.metadata,
				recordedAt: new Date().toISOString(),
			},
			createdAt: new Date(),
		})
		.returning();

	return created;
}

/**
 * Retrieves the audit trail for a specific entity ordered by newest first.
 */
export async function getAuditLogsForEntity(
	entityType: AuditEntityType,
	entityId: string,
	limit: number = 50,
	offset: number = 0,
) {
	return await db
		.select()
		.from(auditLogs)
		.where(
			and(
				eq(auditLogs.entityType, entityType),
				eq(auditLogs.entityId, entityId),
			),
		)
		.orderBy(desc(auditLogs.createdAt))
		.limit(limit)
		.offset(offset);
}
