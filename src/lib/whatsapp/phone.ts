/**
 * Phone number normalization & sanitization for Indonesian WhatsApp messaging.
 */

const WHATSAPP_GROUP_REGEX = /^[0-9a-zA-Z_\-.]+@g\.us$/;
const INDONESIA_PHONE_REGEX = /^628[0-9]{8,12}$/;

/**
 * Normalizes a single Indonesian phone number into canonical `628...` format.
 * Returns `null` if the input is empty or does not conform to Indonesian mobile number patterns.
 */
export function normalizePhoneNumber(rawPhone?: string | null): string | null {
	if (!rawPhone || typeof rawPhone !== "string") {
		return null;
	}

	// Strip all whitespace, dashes, parentheses, dots, and common formatting artifacts
	let cleaned = rawPhone.replace(/[\s\-.()+]/g, "").trim();

	if (!cleaned) {
		return null;
	}

	// If starts with 08..., convert leading 0 to 62 -> 628...
	if (cleaned.startsWith("08")) {
		cleaned = `62${cleaned.slice(1)}`;
	}
	// If starts with 8... (missing country/trunk code), prepend 62 -> 628...
	else if (cleaned.startsWith("8")) {
		cleaned = `62${cleaned}`;
	}

	// Validate resulting format: must match 628 followed by 8 to 12 digits (total 11-15 digits)
	if (INDONESIA_PHONE_REGEX.test(cleaned)) {
		return cleaned;
	}

	return null;
}

/**
 * Sanitizes a target recipient parameter.
 * Supports:
 * - Single Indonesian mobile number (e.g. "081234567890" -> "6281234567890")
 * - Comma-separated phone numbers (e.g. "081234567890, +628987654321")
 * - WhatsApp Group ID (e.g. "120363000@g.us" or "xxx-xxx@g.us")
 */
export function sanitizeTarget(rawTarget?: string | null): string | null {
	if (!rawTarget || typeof rawTarget !== "string") {
		return null;
	}

	const trimmed = rawTarget.trim();
	if (!trimmed) {
		return null;
	}

	// Check if target is a WhatsApp Group ID
	if (WHATSAPP_GROUP_REGEX.test(trimmed)) {
		return trimmed;
	}

	// Check for comma-separated list
	if (trimmed.includes(",")) {
		const parts = trimmed.split(",");
		const validTargets: string[] = [];

		for (const part of parts) {
			const item = part.trim();
			if (!item) continue;

			if (WHATSAPP_GROUP_REGEX.test(item)) {
				validTargets.push(item);
			} else {
				const normalized = normalizePhoneNumber(item);
				if (normalized) {
					validTargets.push(normalized);
				}
			}
		}

		if (validTargets.length === 0) {
			return null;
		}

		return validTargets.join(",");
	}

	return normalizePhoneNumber(trimmed);
}
