import { z } from "zod";

// --- Phone Normalization Helper ---
export function normalizePhoneNumber(phone: string): string | null {
	if (!phone) return null;
	const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
	if (!cleaned) return null;

	if (cleaned.startsWith("+62")) {
		const rest = cleaned.slice(3);
		if (/^\d{8,13}$/.test(rest)) return `62${rest}`;
		return null;
	}
	if (cleaned.startsWith("62")) {
		const rest = cleaned.slice(2);
		if (/^\d{8,13}$/.test(rest)) return `62${rest}`;
		return null;
	}
	if (cleaned.startsWith("08")) {
		const rest = cleaned.slice(1);
		if (/^\d{8,13}$/.test(rest)) return `62${rest}`;
		return null;
	}
	if (cleaned.startsWith("8")) {
		if (/^\d{8,13}$/.test(cleaned)) return `62${cleaned}`;
		return null;
	}
	return null;
}

// --- Booking Statuses ---
export const BOOKING_STATUSES = [
	"pending",
	"approved",
	"rejected",
	"cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const BookingStatusSchema = z.enum(BOOKING_STATUSES);

// --- Asset Types ---
export const ASSET_TYPES = [
	"room",
	"dormitory",
	"vehicle",
	"field",
	"equipment",
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];
export const AssetTypeSchema = z.enum(ASSET_TYPES);

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
	room: "Ruangan",
	dormitory: "Asrama",
	vehicle: "Kendaraan",
	field: "Lapangan",
	equipment: "Peralatan",
};

// --- Roles ---
export const ROLE_RANK = {
	admin: 3,
	operator: 2,
	pimpinan: 1,
} as const;

export type UserRole = keyof typeof ROLE_RANK;

export function resolveEffectiveRole(user: {
	email: string;
	role?: string | null;
}): UserRole {
	const adminEmails = (
		typeof process !== "undefined" && process.env?.ADMIN_DEFAULT_EMAIL
			? process.env.ADMIN_DEFAULT_EMAIL
			: "admin@ppkasn.go.id"
	)
		.split(",")
		.map((e) => e.trim().toLowerCase());

	if (user.email && adminEmails.includes(user.email.toLowerCase())) {
		return "admin";
	}

	const role = (user.role || "operator") as UserRole;
	return ROLE_RANK[role] ? role : "operator";
}

// --- Booking Schemas ---
export const CreateBookingInputSchema = z
	.object({
		assetId: z.string().uuid("Invalid asset ID"),
		requesterName: z.string().min(1, "Nama pemohon wajib diisi"),
		requesterEmail: z.string().email("Format email tidak valid"),
		requesterPhone: z
			.string()
			.optional()
			.nullable()
			.refine(
				(val) =>
					!val || val.trim() === "" || normalizePhoneNumber(val) !== null,
				{
					message: "Format nomor WhatsApp tidak valid (contoh: 08123456789)",
				},
			),
		requesterOrganization: z.string().optional().nullable(),
		purpose: z.string().optional().nullable(),
		attendance: z.number().int().positive("Jumlah peserta/tamu minimal 1"),
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
		timezone: z.string().default("Asia/Jakarta"),
	})
	.refine((data) => data.endDate > data.startDate, {
		message: "Waktu selesai harus setelah waktu mulai",
		path: ["endDate"],
	});

export type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>;

export interface PublicAssetItem {
	id: string;
	name: string;
	type: string;
	location: string | null;
	capacity: number;
	status: string;
}
