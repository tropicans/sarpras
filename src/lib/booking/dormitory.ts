import { and, eq, gt, lt, ne } from "drizzle-orm";
import { bookings } from "#/db/schema";
import { getJakartaDateKey, normalizeDate } from "#/lib/timezone/datetime";
import type { AvailabilityCheckResult } from "./types";

export interface DayOccupancy {
	dateKey: string;
	occupied: number;
	remaining: number;
}

/**
 * Calculates daily dormitory occupancy within a given date range by summing attendance of approved bookings.
 */
export async function calculateDormitoryOccupancyByDate(
	tx: any,
	assetId: string,
	startDateInput: Date | string | number,
	endDateInput: Date | string | number,
	excludeBookingId?: string,
): Promise<Map<string, number>> {
	const reqStart = normalizeDate(startDateInput);
	const reqEnd = normalizeDate(endDateInput);

	// Query overlapping approved bookings
	const conditions = [
		eq(bookings.assetId, assetId),
		eq(bookings.status, "approved"),
		lt(bookings.startDate, reqEnd),
		gt(bookings.endDate, reqStart),
	];

	if (excludeBookingId) {
		conditions.push(ne(bookings.id, excludeBookingId));
	}

	const overlappingApproved = await tx
		.select({
			id: bookings.id,
			attendance: bookings.attendance,
			startDate: bookings.startDate,
			endDate: bookings.endDate,
		})
		.from(bookings)
		.where(and(...conditions));

	const dailyMap = new Map<string, number>();

	// Iterate each overlapping approved booking and tally daily attendance
	for (const booking of overlappingApproved) {
		const bStart = normalizeDate(booking.startDate);
		const bEnd = normalizeDate(booking.endDate);
		const guestCount = booking.attendance ?? 1;

		// Iterate each day of the booking
		const cursor = new Date(Math.max(bStart.getTime(), reqStart.getTime()));
		const finalEnd = new Date(Math.min(bEnd.getTime(), reqEnd.getTime()));

		while (cursor <= finalEnd) {
			const key = getJakartaDateKey(cursor);
			const current = dailyMap.get(key) || 0;
			dailyMap.set(key, current + guestCount);
			cursor.setTime(cursor.getTime() + 24 * 60 * 60 * 1000);
		}
		// Also include finalEnd day
		const endKey = getJakartaDateKey(finalEnd);
		if (!dailyMap.has(endKey)) {
			const current = dailyMap.get(endKey) || 0;
			dailyMap.set(endKey, current + guestCount);
		}
	}

	return dailyMap;
}

/**
 * Validates whether the requested dormitory guests fit into the available capacity for every day in the interval.
 */
export async function checkDormitoryCapacity(
	tx: any,
	assetId: string,
	totalCapacity: number,
	startDateInput: Date | string | number,
	endDateInput: Date | string | number,
	requestedGuests: number,
	excludeBookingId?: string,
): Promise<AvailabilityCheckResult> {
	const reqStart = normalizeDate(startDateInput);
	const reqEnd = normalizeDate(endDateInput);

	if (requestedGuests <= 0) {
		return {
			available: false,
			conflictReason: "Jumlah tamu asrama harus minimal 1 orang.",
		};
	}

	if (requestedGuests > totalCapacity) {
		return {
			available: false,
			conflictReason: `Jumlah tamu yang diajukan (${requestedGuests} orang) melebihi total kapasitas asrama (${totalCapacity} tempat tidur).`,
			details: {
				totalCapacity,
				requestedGuests,
			},
		};
	}

	const occupancyMap = await calculateDormitoryOccupancyByDate(
		tx,
		assetId,
		reqStart,
		reqEnd,
		excludeBookingId,
	);

	// Check every day in [reqStart, reqEnd]
	const cursor = new Date(reqStart.getTime());
	while (cursor <= reqEnd) {
		const key = getJakartaDateKey(cursor);
		const occupied = occupancyMap.get(key) || 0;
		const remaining = totalCapacity - occupied;

		if (occupied + requestedGuests > totalCapacity) {
			return {
				available: false,
				conflictReason: `Kapasitas asrama pada tanggal ${key} tidak mencukupi (terisi ${occupied}/${totalCapacity}, sisa ${remaining}, diajukan ${requestedGuests}).`,
				details: {
					conflictingDate: key,
					occupied,
					remaining,
					requestedGuests,
					totalCapacity,
				},
			};
		}

		cursor.setTime(cursor.getTime() + 24 * 60 * 60 * 1000);
	}

	// Check the exact end date
	const endKey = getJakartaDateKey(reqEnd);
	const occupiedEnd = occupancyMap.get(endKey) || 0;
	const remainingEnd = totalCapacity - occupiedEnd;
	if (occupiedEnd + requestedGuests > totalCapacity) {
		return {
			available: false,
			conflictReason: `Kapasitas asrama pada tanggal ${endKey} tidak mencukupi (terisi ${occupiedEnd}/${totalCapacity}, sisa ${remainingEnd}, diajukan ${requestedGuests}).`,
			details: {
				conflictingDate: endKey,
				occupied: occupiedEnd,
				remaining: remainingEnd,
				requestedGuests,
				totalCapacity,
			},
		};
	}

	return { available: true };
}
