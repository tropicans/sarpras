import { z } from "zod";
import { normalizePhoneNumber } from "../whatsapp/phone";

export const BOOKING_STATUSES = [
	"pending",
	"approved",
	"rejected",
	"cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const BookingStatusSchema = z.enum(BOOKING_STATUSES);

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

export interface RoomLayoutOption {
	id: string;
	name: string;
	maxCapacity: number;
}

export const DEFAULT_ROOM_LAYOUT_CONFIGS = [
	{ id: "island", name: "Island", ratio: 0.7 },
	{ id: "ushape", name: "U-Shape", ratio: 0.5 },
	{ id: "classroom", name: "Classroom", ratio: 0.85 },
] as const;

export function getRoomLayoutOptions(
	assetCapacity: number,
	customLayouts?: RoomLayoutOption[] | null,
): RoomLayoutOption[] {
	if (customLayouts !== undefined && customLayouts !== null) {
		return customLayouts;
	}
	return DEFAULT_ROOM_LAYOUT_CONFIGS.map((cfg) => ({
		id: cfg.id,
		name: cfg.name,
		maxCapacity: Math.max(1, Math.round(assetCapacity * cfg.ratio)),
	}));
}

export const CreateBookingInputSchema = z
	.object({
		assetId: z.string().uuid("Invalid asset ID"),
		groupId: z.string().optional().nullable(),
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
		roomLayout: z.string().optional().nullable(),
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
		timezone: z.string().default("Asia/Jakarta"),
		letterFileName: z
			.string()
			.min(1, "Surat permohonan dinas (PDF) wajib dilampirkan"),
		letterFileUrl: z.string().min(1, "Berkas surat permohonan tidak valid"),
	})
	.refine((data) => data.endDate > data.startDate, {
		message: "Waktu selesai harus setelah waktu mulai",
		path: ["endDate"],
	});

export type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>;

export const BatchBookingRoomItemSchema = z
	.object({
		assetId: z.string().uuid("Invalid asset ID"),
		attendance: z.number().int().positive("Jumlah peserta/tamu minimal 1"),
		roomLayout: z.string().optional().nullable(),
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
	})
	.refine((data) => data.endDate > data.startDate, {
		message: "Waktu selesai harus setelah waktu mulai",
		path: ["endDate"],
	});

export type BatchBookingRoomItem = z.infer<typeof BatchBookingRoomItemSchema>;

export const CreateBatchBookingInputSchema = z.object({
	items: z
		.array(BatchBookingRoomItemSchema)
		.min(1, "Pilih minimal 1 ruangan untuk diajukan"),
	requesterName: z.string().min(1, "Nama pemohon wajib diisi"),
	requesterEmail: z.string().email("Format email tidak valid"),
	requesterPhone: z
		.string()
		.optional()
		.nullable()
		.refine(
			(val) => !val || val.trim() === "" || normalizePhoneNumber(val) !== null,
			{
				message: "Format nomor WhatsApp tidak valid (contoh: 08123456789)",
			},
		),
	requesterOrganization: z.string().optional().nullable(),
	purpose: z.string().optional().nullable(),
	timezone: z.string().default("Asia/Jakarta"),
	letterFileName: z
		.string()
		.min(1, "Surat permohonan dinas (PDF) wajib dilampirkan"),
	letterFileUrl: z.string().min(1, "Berkas surat permohonan tidak valid"),
});

export type CreateBatchBookingInput = z.infer<
	typeof CreateBatchBookingInputSchema
>;

export const BatchApproveBookingsInputSchema = z.object({
	groupId: z.string().min(1, "Group ID is required"),
});

export type BatchApproveBookingsInput = z.infer<
	typeof BatchApproveBookingsInputSchema
>;

export const RejectBookingInputSchema = z.object({
	bookingId: z.string().uuid("Invalid booking ID"),
	rejectionReason: z.string().trim().min(1, "Alasan penolakan wajib diisi"),
});

export type RejectBookingInput = z.infer<typeof RejectBookingInputSchema>;

export const ApproveBookingInputSchema = z.object({
	bookingId: z.string().uuid("Invalid booking ID"),
});

export type ApproveBookingInput = z.infer<typeof ApproveBookingInputSchema>;

export const CancelBookingInputSchema = z.object({
	bookingId: z.string().uuid("Invalid booking ID"),
	reason: z.string().optional(),
});

export type CancelBookingInput = z.infer<typeof CancelBookingInputSchema>;

export const CancelPublicBookingInputSchema = z.object({
	bookingId: z.string().uuid("Invalid booking ID"),
	referenceToken: z.string().min(1, "Reference token is required"),
	reason: z.string().trim().min(1, "Alasan pembatalan wajib diisi"),
});

export type CancelPublicBookingInput = z.infer<
	typeof CancelPublicBookingInputSchema
>;

export interface AvailabilityCheckResult {
	available: boolean;
	conflictReason?: string;
	conflictingBookingId?: string;
	details?: Record<string, unknown>;
}

export interface OperatingHours {
	dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
	openTime: string; // "HH:MM" e.g. "08:00"
	closeTime: string; // "HH:MM" e.g. "17:00"
}
