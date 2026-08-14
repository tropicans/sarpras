import { z } from "zod";

export const BOOKING_STATUSES = [
	"pending",
	"approved",
	"rejected",
	"cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const BookingStatusSchema = z.enum(BOOKING_STATUSES);

export const ASSET_TYPES = ["room", "dormitory"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];
export const AssetTypeSchema = z.enum(ASSET_TYPES);

export const CreateBookingInputSchema = z
	.object({
		assetId: z.string().uuid("Invalid asset ID"),
		requesterName: z.string().min(1, "Nama pemohon wajib diisi"),
		requesterEmail: z.string().email("Format email tidak valid"),
		requesterPhone: z.string().optional().nullable(),
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
	reason: z.string().optional(),
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
