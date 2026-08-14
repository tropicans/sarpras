import { formatInJakarta } from "../timezone/datetime";
import type {
	BookingApprovalData,
	BookingCancellationData,
	BookingRejectionData,
	BookingSubmissionAdminData,
	BookingSubmissionRequesterData,
} from "./types";

/**
 * Resolves the application base URL from environment or defaults to localhost.
 */
export function getAppBaseUrl(): string {
	const url = process.env.APP_BASE_URL || "http://localhost:3000";
	return url.replace(/\/+$/, "");
}

/**
 * Formats a timestamp into a standard display string in Asia/Jakarta timezone.
 */
function formatWib(date: Date | string): string {
	return formatInJakarta(date, "dd/MM/yyyy HH:mm");
}

/**
 * Builds the submission confirmation message sent to the requester (WA-04).
 */
export function buildBookingSubmissionRequesterMessage(
	data: BookingSubmissionRequesterData,
): string {
	const baseUrl = getAppBaseUrl();
	const trackingUrl =
		data.trackingUrl ||
		`${baseUrl}/check-booking?ref=${encodeURIComponent(data.bookingRef)}`;
	const startWib = formatWib(data.startDate);
	const endWib = formatWib(data.endDate);
	const locationStr = data.assetLocation ? ` (${data.assetLocation})` : "";
	const purposeStr = data.purpose?.trim() || "-";

	return `📋 *PENGAJUAN BOOKING SARPRAS PPKASN*

Yth. *${data.requesterName}*,
Permohonan peminjaman sarana & prasarana Anda telah kami terima dan sedang menunggu verifikasi admin.

*Rincian Pengajuan:*
• *Kode Ref:* #${data.bookingRef}
• *Fasilitas:* ${data.assetName}${locationStr}
• *Jadwal:* ${startWib} s.d. ${endWib} WIB
• *Tujuan:* ${purposeStr}
• *Status:* ⏳ Menunggu Persetujuan

Cek status permohonan Anda secara berkala melalui tautan:
${trackingUrl}

_Pesan otomatis dari Sistem Sarpras PPKASN_`;
}

/**
 * Builds the operational alert sent to the admin or operators (WA-07, WA-08).
 */
export function buildBookingSubmissionAdminMessage(
	data: BookingSubmissionAdminData,
): string {
	const baseUrl = getAppBaseUrl();
	const adminUrl = data.adminApprovalUrl || `${baseUrl}/admin/approval`;
	const startWib = formatWib(data.startDate);
	const endWib = formatWib(data.endDate);
	const orgStr = data.requesterOrganization
		? ` (${data.requesterOrganization})`
		: "";
	const purposeStr = data.purpose?.trim() || "-";

	return `🔔 *OPERATIONAL ALERT: BOOKING BARU*

Terdapat permohonan booking sarpras baru yang membutuhkan persetujuan:

• *Kode Ref:* #${data.bookingRef}
• *Pemohon:* ${data.requesterName}${orgStr}
• *Fasilitas:* ${data.assetName}
• *Jadwal:* ${startWib} s.d. ${endWib} WIB
• *Jumlah Peserta:* ${data.attendance} orang
• *Keperluan:* ${purposeStr}

Buka panel persetujuan admin:
${adminUrl}

_Notifikasi Internal Sistem Sarpras PPKASN_`;
}

/**
 * Builds the approval notification sent to the requester (WA-05).
 */
export function buildBookingApprovalMessage(data: BookingApprovalData): string {
	const baseUrl = getAppBaseUrl();
	const trackingUrl =
		data.trackingUrl ||
		`${baseUrl}/check-booking?ref=${encodeURIComponent(data.bookingRef)}`;
	const startWib = formatWib(data.startDate);
	const endWib = formatWib(data.endDate);
	const locationStr = data.assetLocation ? ` (${data.assetLocation})` : "";

	return `✅ *PERMOHONAN BOOKING DISETUJUI*

Yth. *${data.requesterName}*,
Kabar baik! Permohonan peminjaman sarana & prasarana Anda telah *DISETUJUI*.

*Rincian Pemakaian:*
• *Kode Ref:* #${data.bookingRef}
• *Fasilitas:* ${data.assetName}${locationStr}
• *Jadwal:* ${startWib} s.d. ${endWib} WIB
• *Status:* ✅ Disetujui

Harap mematuhi tata tertib pemakaian fasilitas selama kegiatan berlangsung.

Detail lengkap:
${trackingUrl}

_Pesan otomatis dari Sistem Sarpras PPKASN_`;
}

/**
 * Builds the rejection notification with required reason sent to the requester (WA-06).
 */
export function buildBookingRejectionMessage(
	data: BookingRejectionData,
): string {
	const startWib = formatWib(data.startDate);
	const endWib = formatWib(data.endDate);
	const reasonStr = data.rejectionReason.trim();

	return `❌ *PERMOHONAN BOOKING DITOLAK*

Yth. *${data.requesterName}*,
Mohon maaf, permohonan peminjaman fasilitas Anda tidak dapat kami setujui.

*Rincian Pengajuan:*
• *Kode Ref:* #${data.bookingRef}
• *Fasilitas:* ${data.assetName}
• *Jadwal:* ${startWib} s.d. ${endWib} WIB
• *Status:* ❌ Ditolak

*Alasan Penolakan:*
"${reasonStr}"

Silakan mengajukan kembali dengan menyesuaikan jadwal atau fasilitas lain melalui sistem Sarpras PPKASN.

_Pesan otomatis dari Sistem Sarpras PPKASN_`;
}

/**
 * Builds the cancellation alert for requesters and admins.
 */
export function buildBookingCancellationMessage(
	data: BookingCancellationData,
): string {
	const startWib = formatWib(data.startDate);
	const endWib = formatWib(data.endDate);
	const reasonPart = data.reason?.trim()
		? `\n• *Alasan Pembatalan:* ${data.reason.trim()}`
		: "";
	const cancelledByPart = data.cancelledBy
		? `\n• *Dibatalkan oleh:* ${data.cancelledBy}`
		: "";

	return `⚠️ *PEMBATALAN BOOKING SARPRAS*

Permohonan peminjaman sarana & prasarana berikut telah dibatalkan:

• *Kode Ref:* #${data.bookingRef}
• *Pemohon:* ${data.requesterName}
• *Fasilitas:* ${data.assetName}
• *Jadwal:* ${startWib} s.d. ${endWib} WIB
• *Status:* ⚠️ Dibatalkan${cancelledByPart}${reasonPart}

_Pesan otomatis dari Sistem Sarpras PPKASN_`;
}
