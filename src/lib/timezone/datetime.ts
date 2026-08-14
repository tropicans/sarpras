import { isValid, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export const DEFAULT_TIMEZONE = "Asia/Jakarta";

/**
 * Ensures an input date or string is normalized to a valid Date object.
 */
export function normalizeDate(input: Date | string | number): Date {
	if (input instanceof Date) {
		if (!isValid(input)) throw new Error("Invalid Date provided");
		return input;
	}
	if (typeof input === "string") {
		const parsed = parseISO(input);
		if (!isValid(parsed)) {
			const direct = new Date(input);
			if (!isValid(direct))
				throw new Error(`Cannot parse invalid date string: ${input}`);
			return direct;
		}
		return parsed;
	}
	const dateObj = new Date(input);
	if (!isValid(dateObj)) throw new Error(`Invalid timestamp: ${input}`);
	return dateObj;
}

/**
 * Returns formatted date string in Asia/Jakarta timezone.
 */
export function formatInJakarta(
	date: Date | string | number,
	formatString: string = "yyyy-MM-dd HH:mm:ss",
): string {
	const normalized = normalizeDate(date);
	return formatInTimeZone(normalized, DEFAULT_TIMEZONE, formatString);
}

export const formatJakartaDisplay = formatInJakarta;

/**
 * Extracts the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * for a given timestamp when interpreted in Asia/Jakarta.
 */
export function getJakartaDayOfWeek(date: Date | string | number): number {
	const normalized = normalizeDate(date);
	// format 'e' in date-fns gives 1-7 (where 1 is Sunday by default depending on locale),
	// format 'i' gives 1-7 (Monday=1, Sunday=7).
	// format 'c' or 'e' with formatInTimeZone:
	// Let's get day of week using 'd' and Date parsing or 'e':
	const dayStr = formatInTimeZone(normalized, DEFAULT_TIMEZONE, "i"); // 1 = Monday, 7 = Sunday
	const isoDay = parseInt(dayStr, 10);
	return isoDay === 7 ? 0 : isoDay; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

/**
 * Extracts wall-clock "HH:mm" string for a timestamp in Asia/Jakarta.
 */
export function getJakartaTimeString(date: Date | string | number): string {
	const normalized = normalizeDate(date);
	return formatInTimeZone(normalized, DEFAULT_TIMEZONE, "HH:mm");
}

/**
 * Extracts "yyyy-MM-dd" date key for a timestamp in Asia/Jakarta.
 */
export function getJakartaDateKey(date: Date | string | number): string {
	const normalized = normalizeDate(date);
	return formatInTimeZone(normalized, DEFAULT_TIMEZONE, "yyyy-MM-dd");
}

/**
 * Checks if two dates fall on the same calendar day in Asia/Jakarta.
 */
export function isSameJakartaDay(
	date1: Date | string | number,
	date2: Date | string | number,
): boolean {
	return getJakartaDateKey(date1) === getJakartaDateKey(date2);
}

/**
 * Parses a wall-clock time string "HH:mm" into minutes from midnight (0..1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
	const [hours, minutes] = timeStr.split(":").map((v) => parseInt(v, 10));
	if (Number.isNaN(hours) || Number.isNaN(minutes)) {
		throw new Error(`Invalid time format: "${timeStr}". Expected "HH:mm"`);
	}
	return hours * 60 + minutes;
}
