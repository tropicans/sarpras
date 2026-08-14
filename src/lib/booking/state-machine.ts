import type { BookingStatus } from "./types";

const ALLOWED_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
	pending: ["approved", "rejected", "cancelled"],
	approved: ["cancelled"],
	rejected: [],
	cancelled: [],
};

export function canTransition(
	currentStatus: BookingStatus,
	nextStatus: BookingStatus,
): boolean {
	const allowed = ALLOWED_TRANSITIONS[currentStatus];
	return allowed ? allowed.includes(nextStatus) : false;
}

export function validateBookingTransition(
	currentStatus: BookingStatus,
	nextStatus: BookingStatus,
	rejectionReason?: string | null,
): { valid: true } {
	if (!canTransition(currentStatus, nextStatus)) {
		throw new Error(
			`Perubahan status tidak valid dari '${currentStatus}' ke '${nextStatus}'. Status '${currentStatus}' ${
				ALLOWED_TRANSITIONS[currentStatus]?.length === 0
					? "adalah status akhir (terminal)."
					: `hanya dapat diubah ke: ${ALLOWED_TRANSITIONS[currentStatus].join(", ")}.`
			}`,
		);
	}

	if (nextStatus === "rejected") {
		if (!rejectionReason || rejectionReason.trim().length === 0) {
			throw new Error(
				"Alasan penolakan (rejection reason) wajib diisi saat menolak permohonan peminjaman.",
			);
		}
	}

	return { valid: true };
}

export function getAllowedNextStatuses(
	currentStatus: BookingStatus,
): readonly BookingStatus[] {
	return ALLOWED_TRANSITIONS[currentStatus] || [];
}
