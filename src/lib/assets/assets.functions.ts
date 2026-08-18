import { createServerFn } from "@tanstack/react-start";
import { toDate } from "date-fns-tz";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client.server";
import {
	assetAvailability,
	assetClosures,
	assets,
	auditLogs,
} from "../../db/schema";
import { authMiddleware, requireMinRole } from "../auth.middleware";
import { sanitizeFacilities } from "./facilities";

export const getAssetsListFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async () => {
		return await db.select().from(assets).orderBy(desc(assets.createdAt));
	});

export const getAssetSchedulesFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator((assetId: string) => assetId)
	.handler(async ({ data: assetId }) => {
		const availabilityList = await db
			.select()
			.from(assetAvailability)
			.where(eq(assetAvailability.assetId, assetId));

		const closuresList = await db
			.select()
			.from(assetClosures)
			.where(eq(assetClosures.assetId, assetId));

		return {
			availability: availabilityList,
			closures: closuresList,
		};
	});

export const saveAssetFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("operator")])
	.validator(
		(data: {
			id?: string;
			name: string;
			type: string;
			location?: string;
			capacity: number;
			roomLayouts?: Array<{ id: string; name: string; maxCapacity: number }> | null;
			facilities?: string[] | null;
			status: string;
		}) => data,
	)
	.handler(async ({ data, context }) => {
		if (data.capacity <= 0) {
			throw new Error("Capacity must be positive");
		}

		let assetId = data.id;
		const sanitizedFacilities = sanitizeFacilities(data.facilities);

		if (assetId) {
			// Update
			await db
				.update(assets)
				.set({
					name: data.name,
					type: data.type,
					location: data.location || null,
					capacity: data.capacity,
					roomLayouts: data.type === "room" ? (data.roomLayouts || null) : null,
					facilities: sanitizedFacilities,
					status: data.status,
					updatedAt: new Date(),
				})
				.where(eq(assets.id, assetId));

			await db.insert(auditLogs).values({
				actorId: context.user.id,
				actorType: "user",
				action: "asset.update",
				entityType: "asset",
				entityId: assetId,
				metadata: {
					updatedValues: {
						...data,
						facilities: sanitizedFacilities,
					},
				},
			});
		} else {
			// Create
			const inserted = await db
				.insert(assets)
				.values({
					name: data.name,
					type: data.type,
					location: data.location || null,
					capacity: data.capacity,
					roomLayouts: data.type === "room" ? (data.roomLayouts || null) : null,
					facilities: sanitizedFacilities,
					status: data.status,
				})
				.returning();

			assetId = inserted[0].id;

			await db.insert(auditLogs).values({
				actorId: context.user.id,
				actorType: "user",
				action: "asset.create",
				entityType: "asset",
				entityId: assetId,
				metadata: {
					createdValues: {
						...data,
						facilities: sanitizedFacilities,
					},
				},
			});
		}

		return { assetId };
	});

export const archiveAssetFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("operator")])
	.validator((assetId: string) => assetId)
	.handler(async ({ data: assetId, context }) => {
		await db
			.update(assets)
			.set({ status: "archived" })
			.where(eq(assets.id, assetId));

		await db.insert(auditLogs).values({
			actorId: context.user.id,
			actorType: "user",
			action: "asset.archive",
			entityType: "asset",
			entityId: assetId,
			metadata: { archivedBy: context.user.id },
		});

		return { success: true };
	});

export const saveAssetSchedulesFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("operator")])
	.validator(
		(data: {
			assetId: string;
			availability: Array<{
				dayOfWeek: number;
				openTime: string;
				closeTime: string;
			}>;
			closures: Array<{ date: string }>;
		}) => data,
	)
	.handler(async ({ data, context }) => {
		for (const slot of data.availability) {
			if (slot.openTime >= slot.closeTime) {
				throw new Error("Close time must be strictly after open time.");
			}
			if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
				throw new Error(
					"Day of week must be between 0 (Sunday) and 6 (Saturday).",
				);
			}
		}

		await db.transaction(async (tx) => {
			// 1. Availability
			await tx
				.delete(assetAvailability)
				.where(eq(assetAvailability.assetId, data.assetId));
			if (data.availability.length > 0) {
				await tx.insert(assetAvailability).values(
					data.availability.map((s) => ({
						assetId: data.assetId,
						dayOfWeek: s.dayOfWeek,
						openTime: s.openTime,
						closeTime: s.closeTime,
					})),
				);
			}

			// 2. Closures
			await tx
				.delete(assetClosures)
				.where(eq(assetClosures.assetId, data.assetId));
			if (data.closures.length > 0) {
				await tx.insert(assetClosures).values(
					data.closures.map((c) => {
						const localDate = toDate(c.date, { timeZone: "Asia/Jakarta" });
						return {
							assetId: data.assetId,
							date: localDate,
						};
					}),
				);
			}

			// Audit Log
			await tx.insert(auditLogs).values({
				actorId: context.user.id,
				actorType: "user",
				action: "asset.schedules_update",
				entityType: "asset",
				entityId: data.assetId,
				metadata: {
					availabilityCount: data.availability.length,
					closuresCount: data.closures.length,
				},
			});
		});

		return { success: true };
	});
