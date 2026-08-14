import {
	getJakartaDateKey,
	getJakartaDayOfWeek,
	getJakartaTimeString,
	normalizeDate,
	parseTimeToMinutes,
} from "../timezone/datetime";
import type { AvailabilityCheckResult, OperatingHours } from "./types";

/**
 * Validates whether a room booking falls strictly within configured operating hours in Asia/Jakarta.
 */
export function validateOperatingHours(
	startDateInput: Date | string | number,
	endDateInput: Date | string | number,
	operatingSchedules: OperatingHours[],
): { valid: boolean; reason?: string } {
	const startDate = normalizeDate(startDateInput);
	const endDate = normalizeDate(endDateInput);

	const startDayOfWeek = getJakartaDayOfWeek(startDate);
	const endDayOfWeek = getJakartaDayOfWeek(endDate);

	const startSchedule = operatingSchedules.find(
		(s) => s.dayOfWeek === startDayOfWeek,
	);
	if (!startSchedule) {
		return {
			valid: false,
			reason: `Ruangan tidak beroperasi pada hari ${getDayName(startDayOfWeek)}.`,
		};
	}

	const endSchedule = operatingSchedules.find(
		(s) => s.dayOfWeek === endDayOfWeek,
	);
	if (!endSchedule) {
		return {
			valid: false,
			reason: `Ruangan tidak beroperasi pada hari ${getDayName(endDayOfWeek)}.`,
		};
	}

	const startTimeMinutes = parseTimeToMinutes(getJakartaTimeString(startDate));
	const endTimeMinutes = parseTimeToMinutes(getJakartaTimeString(endDate));
	const openTimeMinutes = parseTimeToMinutes(startSchedule.openTime);
	const closeTimeMinutes = parseTimeToMinutes(endSchedule.closeTime);

	if (startTimeMinutes < openTimeMinutes) {
		return {
			valid: false,
			reason: `Waktu mulai (${getJakartaTimeString(startDate)}) lebih awal dari jam buka ruangan (${startSchedule.openTime}).`,
		};
	}

	if (endTimeMinutes > closeTimeMinutes) {
		return {
			valid: false,
			reason: `Waktu selesai (${getJakartaTimeString(endDate)}) melewati jam tutup ruangan (${endSchedule.closeTime}).`,
		};
	}

	return { valid: true };
}

/**
 * Checks if the requested booking interval overlaps with any scheduled asset closures (holidays/maintenance).
 * Applicable to both rooms and dormitories.
 */
export function validateAssetClosures(
	startDateInput: Date | string | number,
	endDateInput: Date | string | number,
	closures: Array<{ date: Date | string | number }>,
): { valid: boolean; reason?: string; conflictingDate?: string } {
	const startDate = normalizeDate(startDateInput);
	const endDate = normalizeDate(endDateInput);

	if (closures.length === 0) {
		return { valid: true };
	}

	const closureDateKeys = new Set(
		closures.map((c) => getJakartaDateKey(c.date)),
	);

	// Generate all Jakarta date keys within [startDate, endDate]
	const current = new Date(startDate.getTime());
	while (current <= endDate) {
		const key = getJakartaDateKey(current);
		if (closureDateKeys.has(key)) {
			return {
				valid: false,
				reason: `Aset tidak tersedia pada tanggal penutupan/libur: ${key}.`,
				conflictingDate: key,
			};
		}
		// Advance by 1 day (86400s)
		current.setTime(current.getTime() + 24 * 60 * 60 * 1000);
	}

	// Also check the exact endDate key in case loop stepped past it
	const endKey = getJakartaDateKey(endDate);
	if (closureDateKeys.has(endKey)) {
		return {
			valid: false,
			reason: `Aset tidak tersedia pada tanggal penutupan/libur: ${endKey}.`,
			conflictingDate: endKey,
		};
	}

	return { valid: true };
}

/**
 * Validates room exclusivity against existing approved bookings.
 * Standard interval overlap: (startA < endB && endA > startB)
 */
export function checkRoomOverlap(
	existingApprovedBookings: Array<{
		id: string;
		startDate: Date | string | number;
		endDate: Date | string | number;
	}>,
	requestedStartInput: Date | string | number,
	requestedEndInput: Date | string | number,
	excludeBookingId?: string,
): AvailabilityCheckResult {
	const reqStart = normalizeDate(requestedStartInput).getTime();
	const reqEnd = normalizeDate(requestedEndInput).getTime();

	for (const existing of existingApprovedBookings) {
		if (excludeBookingId && existing.id === excludeBookingId) {
			continue;
		}

		const exStart = normalizeDate(existing.startDate).getTime();
		const exEnd = normalizeDate(existing.endDate).getTime();

		// Overlap condition
		if (reqStart < exEnd && reqEnd > exStart) {
			return {
				available: false,
				conflictReason:
					"Ruangan sudah disetujui untuk permohonan lain pada rentang waktu yang sama.",
				conflictingBookingId: existing.id,
				details: {
					conflictingStart: existing.startDate,
					conflictingEnd: existing.endDate,
				},
			};
		}
	}

	return { available: true };
}

/**
 * Validates attendance capacity for room bookings.
 */
export function validateRoomCapacity(
	requestedAttendance: number,
	roomCapacity: number,
): { valid: boolean; reason?: string } {
	if (requestedAttendance <= 0) {
		return {
			valid: false,
			reason: "Jumlah peserta harus minimal 1 orang.",
		};
	}

	if (requestedAttendance > roomCapacity) {
		return {
			valid: false,
			reason: `Jumlah peserta (${requestedAttendance} orang) melebihi kapasitas ruangan (${roomCapacity} orang).`,
		};
	}

	return { valid: true };
}

function getDayName(dayIndex: number): string {
	const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
	return days[dayIndex] ?? `Hari #${dayIndex}`;
}
