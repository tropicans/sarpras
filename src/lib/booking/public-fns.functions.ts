import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/client.server";
import { assetClosures, assets, bookings } from "../../db/schema";
import { BookingService } from "./service.server";

/**
 * Public Server Function: Retrieves list of active assets for the catalog.
 */
export const getPublicAssetsListFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const result = await db
			.select({
				id: assets.id,
				name: assets.name,
				type: assets.type,
				location: assets.location,
				capacity: assets.capacity,
				status: assets.status,
			})
			.from(assets)
			.where(eq(assets.status, "active"))
			.orderBy(asc(assets.name));

		return result;
	},
);

/**
 * Public Server Function: Retrieves single asset details by ID.
 */
export const getPublicAssetByIdFn = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		z
			.object({
				assetId: z.string().uuid(),
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const [asset] = await db
			.select({
				id: assets.id,
				name: assets.name,
				type: assets.type,
				location: assets.location,
				capacity: assets.capacity,
				status: assets.status,
			})
			.from(assets)
			.where(and(eq(assets.id, data.assetId), eq(assets.status, "active")));

		return asset || null;
	});

/**
 * Public Server Function: Retrieves privacy-safe public schedule (booked slots & closures).
 * Strictly omits any requester PII (ASSET-04, D-01, D-02).
 */
export const getAssetPublicScheduleFn = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		z
			.object({
				assetId: z.string().uuid(),
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const [approvedList, closuresList] = await Promise.all([
			db
				.select({
					startDate: bookings.startDate,
					endDate: bookings.endDate,
				})
				.from(bookings)
				.where(
					and(
						eq(bookings.assetId, data.assetId),
						eq(bookings.status, "approved"),
					),
				),
			db
				.select({
					date: assetClosures.date,
				})
				.from(assetClosures)
				.where(eq(assetClosures.assetId, data.assetId)),
		]);

		const bookedSlots = approvedList.map((b) => ({
			startDate: b.startDate.toISOString(),
			endDate: b.endDate.toISOString(),
			status: "booked" as const,
		}));

		const closureSlots = closuresList.map((c) => {
			const start = new Date(c.date);
			start.setUTCHours(0, 0, 0, 0);
			const end = new Date(c.date);
			end.setUTCHours(23, 59, 59, 999);
			return {
				startDate: start.toISOString(),
				endDate: end.toISOString(),
				reason: "Penutupan Pemeliharaan / Layanan",
				status: "closed" as const,
			};
		});

		return {
			bookedSlots,
			closureSlots,
		};
	});

/**
 * Public Server Function: Real-time availability pre-flight check before booking submission (D-04).
 */
export const checkAvailabilityPreflightFn = createServerFn({ method: "POST" })
	.validator((data: unknown) =>
		z
			.object({
				assetId: z.string().uuid(),
				startDate: z.string().min(1),
				endDate: z.string().min(1),
				attendance: z.number().int().positive().optional(),
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const res = await BookingService.checkPreflightAvailability({
			assetId: data.assetId,
			startDate: data.startDate,
			endDate: data.endDate,
			attendance: data.attendance,
		});
		return {
			available: res.available,
			reason: res.reason,
		};
	});

/**
 * Public Server Function: Reference status lookup for public requester tracking (BOOK-05).
 */
export const getPublicBookingStatusFn = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		z
			.object({
				ref: z.string().min(1),
			})
			.parse(data),
	)
	.handler(async ({ data }) => {
		const status = await BookingService.getPublicBookingStatus(data.ref);
		if (!status) {
			return null;
		}
		return {
			...status,
			startDate: status.startDate.toISOString(),
			endDate: status.endDate.toISOString(),
			createdAt: status.createdAt.toISOString(),
			updatedAt: status.updatedAt.toISOString(),
		};
	});
