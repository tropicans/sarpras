import { createServerFn } from "@tanstack/react-start";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gte,
	ilike,
	lte,
	ne,
	or,
	sql,
} from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/client.server";
import { assetClosures, assets, bookings } from "../../db/schema";
import { authMiddleware, requireMinRole } from "../auth.middleware";
import { normalizeDate } from "../timezone/datetime";
import { BookingService } from "./service.server";

export const AdminDashboardOverviewSchema = z.object({}).optional();

export const AdminBookingsFilterSchema = z.object({
	status: z
		.enum(["all", "pending", "approved", "rejected", "cancelled"])
		.default("all"),
	assetType: z
		.enum(["all", "room", "dormitory", "vehicle", "field", "equipment"])
		.default("all"),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	search: z.string().optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const BookingConflictContextInputSchema = z.object({
	bookingId: z.string().uuid("ID permohonan harus berformat UUID valid"),
});

export const ApproveBookingAdminInputSchema = z.object({
	bookingId: z.string().uuid("ID permohonan harus berformat UUID valid"),
});

export const RejectBookingAdminInputSchema = z.object({
	bookingId: z.string().uuid("ID permohonan harus berformat UUID valid"),
	rejectionReason: z
		.string()
		.min(3, "Alasan penolakan minimal harus 3 karakter"),
});

export const AdminCalendarEventsInputSchema = z.object({
	assetId: z.string().uuid().optional(),
	assetType: z
		.enum(["all", "room", "dormitory", "vehicle", "field", "equipment"])
		.optional()
		.default("all"),
	start: z.string().min(1, "Tanggal mulai harus disertakan"),
	end: z.string().min(1, "Tanggal selesai harus disertakan"),
});

/**
 * Admin Server Function: Dashboard overview KPIs & urgent pending requests.
 */
export const getAdminDashboardOverviewFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async () => {
		const now = new Date();
		// Compute beginning and end of current month
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const endOfMonth = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			0,
			23,
			59,
			59,
			999,
		);
		const startOfToday = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		);

		const [
			pendingResult,
			approvedMonthResult,
			activeAssetsResult,
			activeClosuresResult,
			urgentPendingList,
		] = await Promise.all([
			// 1. Pending bookings needing action
			db
				.select({ count: count() })
				.from(bookings)
				.where(eq(bookings.status, "pending")),

			// 2. Approved bookings this calendar month
			db
				.select({ count: count() })
				.from(bookings)
				.where(
					and(
						eq(bookings.status, "approved"),
						gte(bookings.startDate, startOfMonth),
						lte(bookings.startDate, endOfMonth),
					),
				),

			// 3. Active assets count
			db
				.select({ count: count() })
				.from(assets)
				.where(eq(assets.status, "active")),

			// 4. Active closures from today onwards
			db
				.select({ count: count() })
				.from(assetClosures)
				.where(gte(assetClosures.date, startOfToday)),

			// 5. Urgent pending bookings (most recent 5 pending bookings)
			db
				.select({
					id: bookings.id,
					assetId: bookings.assetId,
					assetName: assets.name,
					assetType: assets.type,
					requesterName: bookings.requesterName,
					requesterEmail: bookings.requesterEmail,
					requesterOrganization: bookings.requesterOrganization,
					purpose: bookings.purpose,
					attendance: bookings.attendance,
					startDate: bookings.startDate,
					endDate: bookings.endDate,
					status: bookings.status,
					createdAt: bookings.createdAt,
				})
				.from(bookings)
				.innerJoin(assets, eq(bookings.assetId, assets.id))
				.where(eq(bookings.status, "pending"))
				.orderBy(asc(bookings.createdAt))
				.limit(5),
		]);

		return {
			kpi: {
				pendingActionCount: pendingResult[0]?.count ?? 0,
				approvedThisMonthCount: approvedMonthResult[0]?.count ?? 0,
				activeAssetsCount: activeAssetsResult[0]?.count ?? 0,
				activeClosuresCount: activeClosuresResult[0]?.count ?? 0,
			},
			urgentPending: urgentPendingList.map((item) => ({
				...item,
				startDate: item.startDate.toISOString(),
				endDate: item.endDate.toISOString(),
				createdAt: item.createdAt.toISOString(),
			})),
		};
	});

/**
 * Admin Server Function: Filtered, paginated list of bookings for the management table.
 */
export const getAdminBookingsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator((data: unknown) => AdminBookingsFilterSchema.parse(data))
	.handler(async ({ data }) => {
		const page = data.page || 1;
		const limit = data.limit || 10;
		const offset = (page - 1) * limit;

		const conditions = [];

		if (data.status && data.status !== "all") {
			conditions.push(eq(bookings.status, data.status));
		}

		if (data.assetType && data.assetType !== "all") {
			conditions.push(eq(assets.type, data.assetType));
		}

		if (data.startDate) {
			const start = normalizeDate(data.startDate);
			conditions.push(gte(bookings.startDate, start));
		}

		if (data.endDate) {
			const end = normalizeDate(data.endDate);
			conditions.push(lte(bookings.endDate, end));
		}

		if (data.search && data.search.trim() !== "") {
			const term = `%${data.search.trim()}%`;
			conditions.push(
				or(
					ilike(bookings.requesterName, term),
					ilike(bookings.requesterEmail, term),
					ilike(bookings.requesterOrganization, term),
					ilike(bookings.purpose, term),
					ilike(assets.name, term),
					ilike(bookings.groupId, term),
					sql`CAST(${bookings.id} AS TEXT) ILIKE ${term}`,
				),
			);
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [totalResult, items] = await Promise.all([
			db
				.select({ count: count() })
				.from(bookings)
				.innerJoin(assets, eq(bookings.assetId, assets.id))
				.where(whereClause),
			db
				.select({
					id: bookings.id,
					groupId: bookings.groupId,
					assetId: bookings.assetId,
					assetName: assets.name,
					assetType: assets.type,
					assetLocation: assets.location,
					assetCapacity: assets.capacity,
					requesterName: bookings.requesterName,
					requesterEmail: bookings.requesterEmail,
					requesterPhone: bookings.requesterPhone,
					requesterOrganization: bookings.requesterOrganization,
					purpose: bookings.purpose,
					attendance: bookings.attendance,
					roomLayout: bookings.roomLayout,
					startDate: bookings.startDate,
					endDate: bookings.endDate,
					timezone: bookings.timezone,
					status: bookings.status,
					rejectionReason: bookings.rejectionReason,
					letterFileName: bookings.letterFileName,
					letterFileUrl: bookings.letterFileUrl,
					createdAt: bookings.createdAt,
					updatedAt: bookings.updatedAt,
				})
				.from(bookings)
				.innerJoin(assets, eq(bookings.assetId, assets.id))
				.where(whereClause)
				.orderBy(desc(bookings.createdAt))
				.limit(limit)
				.offset(offset),
		]);

		const total = totalResult[0]?.count ?? 0;
		const totalPages = Math.ceil(total / limit) || 1;

		return {
			items: items.map((item) => ({
				...item,
				startDate: item.startDate.toISOString(),
				endDate: item.endDate.toISOString(),
				createdAt: item.createdAt.toISOString(),
				updatedAt: item.updatedAt.toISOString(),
			})),
			total,
			page,
			limit,
			totalPages,
		};
	});

/**
 * Admin Server Function: Contextual conflict detection for a specific booking request (FLOW-02).
 */
export const getBookingConflictContextFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator((data: unknown) => BookingConflictContextInputSchema.parse(data))
	.handler(async ({ data }) => {
		const [target] = await db
			.select({
				id: bookings.id,
				groupId: bookings.groupId,
				assetId: bookings.assetId,
				assetName: assets.name,
				assetType: assets.type,
				assetLocation: assets.location,
				assetCapacity: assets.capacity,
				requesterName: bookings.requesterName,
				requesterEmail: bookings.requesterEmail,
				requesterPhone: bookings.requesterPhone,
				requesterOrganization: bookings.requesterOrganization,
				purpose: bookings.purpose,
				attendance: bookings.attendance,
				roomLayout: bookings.roomLayout,
				startDate: bookings.startDate,
				endDate: bookings.endDate,
				timezone: bookings.timezone,
				status: bookings.status,
				rejectionReason: bookings.rejectionReason,
				letterFileName: bookings.letterFileName,
				letterFileUrl: bookings.letterFileUrl,
				createdAt: bookings.createdAt,
				updatedAt: bookings.updatedAt,
			})
			.from(bookings)
			.innerJoin(assets, eq(bookings.assetId, assets.id))
			.where(eq(bookings.id, data.bookingId));

		if (!target) {
			throw new Error("Permohonan booking tidak ditemukan");
		}

		// If target is part of a group, fetch all siblings in that group
		let groupSiblings: Array<any> = [];
		if (target.groupId) {
			groupSiblings = await db
				.select({
					id: bookings.id,
					groupId: bookings.groupId,
					assetId: bookings.assetId,
					assetName: assets.name,
					assetType: assets.type,
					assetLocation: assets.location,
					assetCapacity: assets.capacity,
					startDate: bookings.startDate,
					endDate: bookings.endDate,
					attendance: bookings.attendance,
					roomLayout: bookings.roomLayout,
					status: bookings.status,
					rejectionReason: bookings.rejectionReason,
				})
				.from(bookings)
				.innerJoin(assets, eq(bookings.assetId, assets.id))
				.where(
					and(
						eq(bookings.groupId, target.groupId),
						ne(bookings.id, target.id),
					),
				)
				.orderBy(asc(bookings.startDate));
		}

		// Find overlapping approved bookings (Hard Conflict)
		const approvedOverlaps = await db
			.select({
				id: bookings.id,
				requesterName: bookings.requesterName,
				requesterOrganization: bookings.requesterOrganization,
				purpose: bookings.purpose,
				attendance: bookings.attendance,
				startDate: bookings.startDate,
				endDate: bookings.endDate,
				status: bookings.status,
			})
			.from(bookings)
			.where(
				and(
					eq(bookings.assetId, target.assetId),
					eq(bookings.status, "approved"),
					ne(bookings.id, target.id),
					sql`${bookings.startDate} < ${target.endDate}`,
					sql`${bookings.endDate} > ${target.startDate}`,
				),
			)
			.orderBy(asc(bookings.startDate));

		// Find competing pending bookings (Soft Conflict)
		const pendingOverlaps = await db
			.select({
				id: bookings.id,
				requesterName: bookings.requesterName,
				requesterOrganization: bookings.requesterOrganization,
				purpose: bookings.purpose,
				attendance: bookings.attendance,
				startDate: bookings.startDate,
				endDate: bookings.endDate,
				status: bookings.status,
			})
			.from(bookings)
			.where(
				and(
					eq(bookings.assetId, target.assetId),
					eq(bookings.status, "pending"),
					ne(bookings.id, target.id),
					sql`${bookings.startDate} < ${target.endDate}`,
					sql`${bookings.endDate} > ${target.startDate}`,
				),
			)
			.orderBy(asc(bookings.startDate));

		const hasHardConflict = approvedOverlaps.length > 0;
		const hasPendingOverlaps = pendingOverlaps.length > 0;

		return {
			target: {
				...target,
				startDate: target.startDate.toISOString(),
				endDate: target.endDate.toISOString(),
				createdAt: target.createdAt.toISOString(),
				updatedAt: target.updatedAt.toISOString(),
			},
			hasHardConflict,
			hasPendingOverlaps,
			groupSiblings: groupSiblings.map((s) => ({
				...s,
				startDate: s.startDate.toISOString(),
				endDate: s.endDate.toISOString(),
			})),
			approvedConflicts: approvedOverlaps.map((item) => ({
				...item,
				startDate: item.startDate.toISOString(),
				endDate: item.endDate.toISOString(),
			})),
			pendingOverlaps: pendingOverlaps.map((item) => ({
				...item,
				startDate: item.startDate.toISOString(),
				endDate: item.endDate.toISOString(),
			})),
		};
	});

export const BatchApproveBookingsAdminInputSchema = z.object({
	groupId: z.string().min(1, "Group ID is required"),
});

/**
 * Admin Server Function: Approves all pending bookings in a group (FLOW-03).
 */
export const batchApproveBookingsAdminFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("operator")])
	.validator((data: unknown) => BatchApproveBookingsAdminInputSchema.parse(data))
	.handler(async ({ data, context }) => {
		const approvedList = await BookingService.batchApproveBookings(
			data.groupId,
			context.user.id,
		);
		return {
			success: true,
			count: approvedList.length,
		};
	});

/**
 * Admin Server Function: Approves a booking request atomically (FLOW-03).
 */
export const approveBookingAdminFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("operator")])
	.validator((data: unknown) => ApproveBookingAdminInputSchema.parse(data))
	.handler(async ({ data, context }) => {
		const booking = await BookingService.approveBooking(
			data.bookingId,
			context.user.id,
		);
		return {
			success: true,
			booking: {
				...booking,
				startDate: booking.startDate.toISOString(),
				endDate: booking.endDate.toISOString(),
				createdAt: booking.createdAt.toISOString(),
				updatedAt: booking.updatedAt.toISOString(),
			},
		};
	});

/**
 * Admin Server Function: Rejects a booking request with justification (FLOW-03).
 */
export const rejectBookingAdminFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("operator")])
	.validator((data: unknown) => RejectBookingAdminInputSchema.parse(data))
	.handler(async ({ data, context }) => {
		const booking = await BookingService.rejectBooking(
			data.bookingId,
			context.user.id,
			data.rejectionReason,
		);
		return {
			success: true,
			booking: {
				...booking,
				startDate: booking.startDate.toISOString(),
				endDate: booking.endDate.toISOString(),
				createdAt: booking.createdAt.toISOString(),
				updatedAt: booking.updatedAt.toISOString(),
			},
		};
	});

/**
 * Admin Server Function: Fetches calendar events (bookings and closures) for operational calendar (OPS-02).
 */
export const getAdminCalendarEventsFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator((data: unknown) => AdminCalendarEventsInputSchema.parse(data))
	.handler(async ({ data }) => {
		const start = normalizeDate(data.start);
		const end = normalizeDate(data.end);

		const bookingConditions = [
			or(eq(bookings.status, "approved"), eq(bookings.status, "pending")),
			sql`${bookings.startDate} <= ${end}`,
			sql`${bookings.endDate} >= ${start}`,
		];

		if (data.assetId) {
			bookingConditions.push(eq(bookings.assetId, data.assetId));
		}

		if (data.assetType && data.assetType !== "all") {
			bookingConditions.push(eq(assets.type, data.assetType));
		}

		const closureConditions = [
			gte(assetClosures.date, start),
			lte(assetClosures.date, end),
		];

		if (data.assetId) {
			closureConditions.push(eq(assetClosures.assetId, data.assetId));
		}

		if (data.assetType && data.assetType !== "all") {
			closureConditions.push(eq(assets.type, data.assetType));
		}

		const [bookingEvents, closureEvents] = await Promise.all([
			db
				.select({
					id: bookings.id,
					assetId: bookings.assetId,
					assetName: assets.name,
					assetType: assets.type,
					requesterName: bookings.requesterName,
					requesterOrganization: bookings.requesterOrganization,
					purpose: bookings.purpose,
					attendance: bookings.attendance,
					startDate: bookings.startDate,
					endDate: bookings.endDate,
					status: bookings.status,
				})
				.from(bookings)
				.innerJoin(assets, eq(bookings.assetId, assets.id))
				.where(and(...bookingConditions)),

			db
				.select({
					id: assetClosures.id,
					assetId: assetClosures.assetId,
					assetName: assets.name,
					assetType: assets.type,
					date: assetClosures.date,
				})
				.from(assetClosures)
				.innerJoin(assets, eq(assetClosures.assetId, assets.id))
				.where(and(...closureConditions)),
		]);

		const formattedBookings = bookingEvents.map((b) => ({
			id: b.id,
			type: "booking" as const,
			status: b.status as "approved" | "pending",
			assetId: b.assetId,
			assetName: b.assetName,
			assetType: b.assetType,
			title: `${b.requesterName} - ${b.purpose || b.assetName}`,
			requesterName: b.requesterName,
			requesterOrganization: b.requesterOrganization,
			purpose: b.purpose,
			attendance: b.attendance,
			startDate: b.startDate.toISOString(),
			endDate: b.endDate.toISOString(),
		}));

		const formattedClosures = closureEvents.map((c) => {
			const closureStart = new Date(c.date);
			closureStart.setUTCHours(0, 0, 0, 0);
			const closureEnd = new Date(c.date);
			closureEnd.setUTCHours(23, 59, 59, 999);
			return {
				id: c.id,
				type: "closure" as const,
				status: "closed" as const,
				assetId: c.assetId,
				assetName: c.assetName,
				assetType: c.assetType,
				title: `Penutupan: ${c.assetName}`,
				requesterName: "Pengelola Sarpras",
				requesterOrganization: "PPKASN",
				purpose: "Pemeliharaan / Penutupan Operasional",
				attendance: 0,
				startDate: closureStart.toISOString(),
				endDate: closureEnd.toISOString(),
			};
		});

		return [...formattedBookings, ...formattedClosures];
	});
