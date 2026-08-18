import type { AssetType } from "../booking/types";

export const CATEGORY_FACILITY_PRESETS: Record<AssetType, string[]> = {
	room: [
		"AC",
		"Proyektor Laser",
		"Sound System",
		"Wi-Fi Cepat",
		"Podium",
		"Smart TV",
	],
	dormitory: [
		"AC",
		"Water Heater",
		"Wi-Fi",
		"Lemari & Meja Kerja",
		"Kamar Mandi Dalam",
	],
	vehicle: [
		"AC Double Blower",
		"Driver Dinas",
		"Audio / Bluetooth",
		"Kapasitas Bagasi Luas",
	],
	field: [
		"Lampu Sorot Malam",
		"Tribun Penonton",
		"Sound Lapangan",
		"Ruang Ganti",
	],
	equipment: [
		"Kabel Sambung",
		"Baterai Cadangan",
		"Hardcase Box",
		"Buku Panduan",
	],
};

const MAX_TAG_LENGTH = 40;
const MAX_TAGS_COUNT = 20;

/**
 * Sanitizes an input facilities list:
 * - Trims whitespace
 * - Discards empty strings / non-strings
 * - Deduplicates case-insensitively
 * - Truncates each tag to MAX_TAG_LENGTH
 * - Caps maximum number of tags to MAX_TAGS_COUNT
 */
export function sanitizeFacilities(input: unknown): string[] {
	if (!Array.isArray(input)) {
		return [];
	}

	const seen = new Set<string>();
	const result: string[] = [];

	for (const item of input) {
		if (typeof item !== "string") continue;
		const trimmed = item.trim();
		if (!trimmed) continue;

		const limited = trimmed.slice(0, MAX_TAG_LENGTH);
		const lowerKey = limited.toLowerCase();

		if (!seen.has(lowerKey)) {
			seen.add(lowerKey);
			result.push(limited);
		}

		if (result.length >= MAX_TAGS_COUNT) {
			break;
		}
	}

	return result;
}

/**
 * Resolves facilities for an asset:
 * Returns custom sanitized tags if present,
 * otherwise returns an empty array by default.
 */
export function getAssetFacilities(asset: {
	type?: string;
	facilities?: string[] | null;
}): string[] {
	if (asset.facilities && Array.isArray(asset.facilities)) {
		return sanitizeFacilities(asset.facilities);
	}

	return [];
}

