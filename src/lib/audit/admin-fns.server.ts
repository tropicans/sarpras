import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db/client.server";
import { auditLogs, users } from "#/db/schema";
import { authMiddleware } from "#/lib/auth.middleware";
import { normalizeDate } from "#/lib/timezone/datetime";

export const AdminAuditLogsFilterSchema = z.object({
	action: z.string().optional(),
	entityType: z
		.enum(["all", "booking", "asset", "user"])
		.optional()
		.default("all"),
	entityId: z.string().optional(),
	actorId: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AuditLogDetailInputSchema = z.object({
	logId: z.string().uuid("ID log audit harus berformat UUID valid"),
});

/**
 * Admin Server Function: Paginated and filterable query for system audit logs (OPS-04, D-07).
 */
export const getAdminAuditLogsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator((data: unknown) => AdminAuditLogsFilterSchema.parse(data))
	.handler(async ({ data }) => {
		const page = data.page || 1;
		const limit = data.limit || 20;
		const offset = (page - 1) * limit;

		const conditions = [];

		if (data.action && data.action !== "all" && data.action.trim() !== "") {
			conditions.push(eq(auditLogs.action, data.action.trim()));
		}

		if (data.entityType && data.entityType !== "all") {
			conditions.push(eq(auditLogs.entityType, data.entityType));
		}

		if (data.entityId && data.entityId.trim() !== "") {
			conditions.push(eq(auditLogs.entityId, data.entityId.trim()));
		}

		if (data.actorId && data.actorId.trim() !== "") {
			const term = `%${data.actorId.trim()}%`;
			conditions.push(
				or(
					ilike(auditLogs.actorId, term),
					ilike(users.name, term),
					ilike(users.email, term),
				),
			);
		}

		if (data.startDate) {
			const start = normalizeDate(data.startDate);
			conditions.push(gte(auditLogs.createdAt, start));
		}

		if (data.endDate) {
			const end = normalizeDate(data.endDate);
			conditions.push(lte(auditLogs.createdAt, end));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [totalResult, items] = await Promise.all([
			db
				.select({ count: count() })
				.from(auditLogs)
				.leftJoin(users, eq(auditLogs.actorId, users.id))
				.where(whereClause),
			db
				.select({
					id: auditLogs.id,
					actorId: auditLogs.actorId,
					actorType: auditLogs.actorType,
					action: auditLogs.action,
					entityType: auditLogs.entityType,
					entityId: auditLogs.entityId,
					metadata: auditLogs.metadata,
					createdAt: auditLogs.createdAt,
					actorName: users.name,
					actorEmail: users.email,
				})
				.from(auditLogs)
				.leftJoin(users, eq(auditLogs.actorId, users.id))
				.where(whereClause)
				.orderBy(desc(auditLogs.createdAt))
				.limit(limit)
				.offset(offset),
		]);

		const total = totalResult[0]?.count ?? 0;
		const totalPages = Math.ceil(total / limit) || 1;

		return {
			items: items.map((item) => ({
				...item,
				createdAt: item.createdAt.toISOString(),
			})),
			total,
			page,
			limit,
			totalPages,
		};
	});

/**
 * Admin Server Function: Retrieves complete single audit log record with metadata (OPS-04, D-08).
 */
export const getAuditLogDetailFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator((data: unknown) => AuditLogDetailInputSchema.parse(data))
	.handler(async ({ data }) => {
		const [log] = await db
			.select({
				id: auditLogs.id,
				actorId: auditLogs.actorId,
				actorType: auditLogs.actorType,
				action: auditLogs.action,
				entityType: auditLogs.entityType,
				entityId: auditLogs.entityId,
				metadata: auditLogs.metadata,
				createdAt: auditLogs.createdAt,
				actorName: users.name,
				actorEmail: users.email,
			})
			.from(auditLogs)
			.leftJoin(users, eq(auditLogs.actorId, users.id))
			.where(eq(auditLogs.id, data.logId));

		if (!log) {
			throw new Error("Catatan audit tidak ditemukan");
		}

		return {
			...log,
			createdAt: log.createdAt.toISOString(),
		};
	});
