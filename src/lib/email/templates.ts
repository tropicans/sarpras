import { formatInJakarta } from "../timezone/datetime";
import type {
	BookingApprovalEmailData,
	BookingCancellationEmailData,
	BookingRejectionEmailData,
	BookingSubmissionAdminEmailData,
	BookingSubmissionRequesterEmailData,
	EmailTemplateOutput,
} from "./types";

/**
 * Resolves the application base URL from environment or defaults to localhost.
 */
export function getAppBaseUrl(): string {
	const url = process.env.APP_BASE_URL || "http://localhost:3000";
	return url.replace(/\/+$/, "");
}

/**
 * Formats a timestamp into standard display string in Asia/Jakarta timezone.
 */
export function formatWib(date: Date | string): string {
	return formatInJakarta(date, "dd/MM/yyyy HH:mm");
}

/**
 * Escapes unsafe characters for HTML rendering to prevent injection/XSS.
 */
export function escapeHtml(unsafe: string | null | undefined): string {
	if (!unsafe) return "";
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

interface BaseLayoutOptions {
	title: string;
	badgeText: string;
	badgeBg: string;
	badgeColor: string;
	bodyHtml: string;
	ctaUrl?: string;
	ctaText?: string;
}

/**
 * Generates an accessible, responsive HTML email layout with PPKASN institutional branding.
 */
function renderBaseHtmlLayout(options: BaseLayoutOptions): string {
	const ctaBlock =
		options.ctaUrl && options.ctaText
			? `
      <tr>
        <td align="center" style="padding: 24px 0 8px 0;">
          <table border="0" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center" bgcolor="#1e3a8a" style="border-radius: 6px;">
                <a href="${escapeHtml(options.ctaUrl)}" target="_blank" style="font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: 600; letter-spacing: 0.2px;">
                  ${escapeHtml(options.ctaText)} &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
			: "";

	return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; line-height: 1.6;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (600px Max) -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #1e3a8a; padding: 24px 32px; text-align: left;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 1px;">Sistem Informasi Sarana & Prasarana</div>
                    <div style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 4px;">SARPRAS PPKASN</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 32px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <!-- Status Badge & Title -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: ${options.badgeBg}; color: ${options.badgeColor}; margin-bottom: 12px;">
                      ${escapeHtml(options.badgeText)}
                    </div>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      ${escapeHtml(options.title)}
                    </h1>
                  </td>
                </tr>

                <!-- Injected Body Details -->
                ${options.bodyHtml}

                <!-- CTA Button (if present) -->
                ${ctaBlock}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                Pusat Pelatihan dan Pengembangan Kepemimpinan Aparatur Sipil Negara (PPKASN)
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Email otomatis ini dikirim oleh sistem Sarpras PPKASN. Mohon tidak membalas langsung ke alamat ini.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Builds the requester booking submission confirmation email (EMAIL-05).
 */
export function buildBookingSubmissionRequesterEmail(
	data: BookingSubmissionRequesterEmailData,
): EmailTemplateOutput {
	const baseUrl = getAppBaseUrl();
	const trackingUrl =
		data.trackingUrl ||
		`${baseUrl}/status/${encodeURIComponent(data.bookingRef)}`;
	const startWib = formatWib(data.startDate);
	const endWib = formatWib(data.endDate);
	const locationStr = data.assetLocation ? ` (${data.assetLocation})` : "";
	const purposeStr = data.purpose?.trim() || "-";

	const subject = `[SARPRAS PPKASN] Konfirmasi Pengajuan Booking #${data.bookingRef}`;

	const bodyHtml = `
    <tr>
      <td style="font-size: 14px; color: #334155; line-height: 1.6; padding-bottom: 16px;">
        Yth. <strong>${escapeHtml(data.requesterName)}</strong>,<br><br>
        Permohonan peminjaman sarana dan prasarana Anda telah berhasil dicatat oleh sistem dan saat ini sedang menunggu verifikasi oleh tim administrator.
      </td>
    </tr>
    <tr>
      <td>
        <table width="100%" border="0" cellpadding="8" cellspacing="0" role="presentation" style="background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px; margin-bottom: 16px;">
          <tr>
            <td width="35%" style="color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Kode Referensi</td>
            <td style="color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">#${escapeHtml(data.bookingRef)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Fasilitas</td>
            <td style="color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.assetName)}${escapeHtml(locationStr)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Jadwal Peminjaman</td>
            <td style="color: #0f172a; border-bottom: 1px solid #e2e8f0;">${escapeHtml(startWib)} s.d. ${escapeHtml(endWib)} WIB</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500;">Keperluan</td>
            <td style="color: #0f172a;">${escapeHtml(purposeStr)}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="font-size: 13px; color: #64748b; line-height: 1.5; padding-bottom: 8px;">
        Anda dapat memantau status persetujuan pengajuan ini kapan saja melalui tautan di bawah ini.
      </td>
    </tr>
  `;

	const html = renderBaseHtmlLayout({
		title: "Konfirmasi Pengajuan Booking",
		badgeText: "⏳ Menunggu Verifikasi",
		badgeBg: "#fef3c7",
		badgeColor: "#d97706",
		bodyHtml,
		ctaUrl: trackingUrl,
		ctaText: "Cek Status Permohonan",
	});

	const text = `PENGAJUAN BOOKING SARPRAS PPKASN

Yth. ${data.requesterName},
Permohonan peminjaman sarana & prasarana Anda telah kami terima dan sedang menunggu verifikasi admin.

Rincian Pengajuan:
• Kode Ref: #${data.bookingRef}
• Fasilitas: ${data.assetName}${locationStr}
• Jadwal: ${startWib} s.d. ${endWib} WIB
• Tujuan: ${purposeStr}
• Status: Menunggu Persetujuan

Cek status permohonan Anda melalui tautan berikut:
${trackingUrl}

--
Sistem Sarpras PPKASN`;

	return { subject, html, text };
}

/**
 * Builds the admin operational alert email for new pending bookings (EMAIL-06).
 */
export function buildBookingSubmissionAdminEmail(
	data: BookingSubmissionAdminEmailData,
): EmailTemplateOutput {
	const baseUrl = getAppBaseUrl();
	const adminUrl = data.adminApprovalUrl || `${baseUrl}/admin/bookings`;
	const startWib = formatWib(data.startDate);
	const endWib = formatWib(data.endDate);
	const orgStr = data.requesterOrganization
		? ` (${data.requesterOrganization})`
		: "";
	const purposeStr = data.purpose?.trim() || "-";

	const subject = `[OPERATIONAL ALERT] Permohonan Booking Baru #${data.bookingRef} - ${data.assetName}`;

	const bodyHtml = `
    <tr>
      <td style="font-size: 14px; color: #334155; line-height: 1.6; padding-bottom: 16px;">
        Terdapat permohonan booking sarana dan prasarana baru yang memerlukan tinjauan dan persetujuan:
      </td>
    </tr>
    <tr>
      <td>
        <table width="100%" border="0" cellpadding="8" cellspacing="0" role="presentation" style="background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px; margin-bottom: 16px;">
          <tr>
            <td width="35%" style="color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Kode Referensi</td>
            <td style="color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">#${escapeHtml(data.bookingRef)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Pemohon</td>
            <td style="color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.requesterName)}${escapeHtml(orgStr)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Fasilitas</td>
            <td style="color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.assetName)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Jadwal Peminjaman</td>
            <td style="color: #0f172a; border-bottom: 1px solid #e2e8f0;">${escapeHtml(startWib)} s.d. ${escapeHtml(endWib)} WIB</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Jumlah Peserta</td>
            <td style="color: #0f172a; border-bottom: 1px solid #e2e8f0;">${data.attendance} orang</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 500;">Keperluan</td>
            <td style="color: #0f172a;">${escapeHtml(purposeStr)}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="font-size: 13px; color: #64748b; line-height: 1.5; padding-bottom: 8px;">
        Silakan buka panel persetujuan administrator untuk meninjau ketersediaan dan memberikan persetujuan atau penolakan.
      </td>
    </tr>
  `;

	const html = renderBaseHtmlLayout({
		title: "Tinjauan Permohonan Booking Baru",
		badgeText: "🔔 Action Required",
		badgeBg: "#dbeafe",
		badgeColor: "#1e40af",
		bodyHtml,
		ctaUrl: adminUrl,
		ctaText: "Tinjau di Panel Admin",
	});

	const text = `OPERATIONAL ALERT: BOOKING BARU

Terdapat permohonan booking sarpras baru yang membutuhkan persetujuan:

• Kode Ref: #${data.bookingRef}
• Pemohon: ${data.requesterName}${orgStr}
• Fasilitas: ${data.assetName}
• Jadwal: ${startWib} s.d. ${endWib} WIB
• Jumlah Peserta: ${data.attendance} orang
• Keperluan: ${purposeStr}

Buka panel persetujuan admin:
${adminUrl}

--
Notifikasi Internal Sarpras PPKASN`;

	return { subject, html, text };
}

/**
 * Builds the approval notification email sent to the requester (EMAIL-07).
 */
export function buildBookingApprovalEmail(
	data: BookingApprovalEmailData,
): EmailTemplateOutput {
	const baseUrl = getAppBaseUrl();
	const trackingUrl =
		data.trackingUrl ||
		`${baseUrl}/status/${encodeURIComponent(data.bookingRef)}`;
	const startWib = formatWib(data.startDate);
	const endWib = formatWib(data.endDate);
	const locationStr = data.assetLocation ? ` (${data.assetLocation})` : "";

	const subject = `[SARPRAS PPKASN] Permohonan Booking #${data.bookingRef} Telah DISETUJUI`;

	const bodyHtml = `
    <tr>
      <td style="font-size: 14px; color: #334155; line-height: 1.6; padding-bottom: 16px;">
        Yth. <strong>${escapeHtml(data.requesterName)}</strong>,<br><br>
        Kabar baik! Permohonan peminjaman sarana dan prasarana Anda telah <strong style="color: #15803d;">DISETUJUI</strong> oleh administrator.
      </td>
    </tr>
    <tr>
      <td>
        <table width="100%" border="0" cellpadding="8" cellspacing="0" role="presentation" style="background-color: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 13px; margin-bottom: 16px;">
          <tr>
            <td width="35%" style="color: #166534; font-weight: 500; border-bottom: 1px solid #bbf7d0;">Kode Referensi</td>
            <td style="color: #14532d; font-weight: 700; border-bottom: 1px solid #bbf7d0;">#${escapeHtml(data.bookingRef)}</td>
          </tr>
          <tr>
            <td style="color: #166534; font-weight: 500; border-bottom: 1px solid #bbf7d0;">Fasilitas</td>
            <td style="color: #14532d; font-weight: 600; border-bottom: 1px solid #bbf7d0;">${escapeHtml(data.assetName)}${escapeHtml(locationStr)}</td>
          </tr>
          <tr>
            <td style="color: #166534; font-weight: 500; border-bottom: 1px solid #bbf7d0;">Jadwal Peminjaman</td>
            <td style="color: #14532d; border-bottom: 1px solid #bbf7d0;">${escapeHtml(startWib)} s.d. ${escapeHtml(endWib)} WIB</td>
          </tr>
          <tr>
            <td style="color: #166534; font-weight: 500;">Status</td>
            <td style="color: #15803d; font-weight: 700;">✅ Disetujui</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="font-size: 13px; color: #475569; line-height: 1.5; padding-bottom: 8px;">
        Harap mematuhi seluruh tata tertib dan petunjuk teknis pemakaian fasilitas selama kegiatan berlangsung.
      </td>
    </tr>
  `;

	const html = renderBaseHtmlLayout({
		title: "Permohonan Booking Disetujui",
		badgeText: "✅ Disetujui",
		badgeBg: "#dcfce7",
		badgeColor: "#15803d",
		bodyHtml,
		ctaUrl: trackingUrl,
		ctaText: "Lihat Rincian Booking",
	});

	const text = `PERMOHONAN BOOKING DISETUJUI

Yth. ${data.requesterName},
Kabar baik! Permohonan peminjaman sarana & prasarana Anda telah DISETUJUI.

Rincian Pemakaian:
• Kode Ref: #${data.bookingRef}
• Fasilitas: ${data.assetName}${locationStr}
• Jadwal: ${startWib} s.d. ${endWib} WIB
• Status: Disetujui

Harap mematuhi tata tertib pemakaian fasilitas selama kegiatan berlangsung.

Detail lengkap:
${trackingUrl}

--
Sistem Sarpras PPKASN`;

	return { subject, html, text };
}

/**
 * Builds the rejection notification email sent to the requester (EMAIL-08).
 */
export function buildBookingRejectionEmail(
	data: BookingRejectionData,
): EmailTemplateOutput {
	const baseUrl = getAppBaseUrl();
	const trackingUrl =
		data.trackingUrl ||
		`${baseUrl}/status/${encodeURIComponent(data.bookingRef)}`;
	const startWib = formatWib(data.startDate);
	const endWib = formatWib(data.endDate);
	const reasonStr = data.rejectionReason.trim();

	const subject = `[SARPRAS PPKASN] Informasi Permohonan Booking #${data.bookingRef}`;

	const bodyHtml = `
    <tr>
      <td style="font-size: 14px; color: #334155; line-height: 1.6; padding-bottom: 16px;">
        Yth. <strong>${escapeHtml(data.requesterName)}</strong>,<br><br>
        Mohon maaf, permohonan peminjaman sarana dan prasarana Anda saat ini <strong style="color: #b91c1c;">BELUM DAPAT KAMI SETUJUI</strong>.
      </td>
    </tr>
    <tr>
      <td>
        <table width="100%" border="0" cellpadding="8" cellspacing="0" role="presentation" style="background-color: #fef2f2; border-radius: 6px; border: 1px solid #fecaca; font-size: 13px; margin-bottom: 16px;">
          <tr>
            <td width="35%" style="color: #991b1b; font-weight: 500; border-bottom: 1px solid #fecaca;">Kode Referensi</td>
            <td style="color: #7f1d1d; font-weight: 700; border-bottom: 1px solid #fecaca;">#${escapeHtml(data.bookingRef)}</td>
          </tr>
          <tr>
            <td style="color: #991b1b; font-weight: 500; border-bottom: 1px solid #fecaca;">Fasilitas</td>
            <td style="color: #7f1d1d; font-weight: 600; border-bottom: 1px solid #fecaca;">${escapeHtml(data.assetName)}</td>
          </tr>
          <tr>
            <td style="color: #991b1b; font-weight: 500; border-bottom: 1px solid #fecaca;">Jadwal Peminjaman</td>
            <td style="color: #7f1d1d; border-bottom: 1px solid #fecaca;">${escapeHtml(startWib)} s.d. ${escapeHtml(endWib)} WIB</td>
          </tr>
          <tr>
            <td style="color: #991b1b; font-weight: 500;">Alasan Penolakan</td>
            <td style="color: #b91c1c; font-weight: 600;">${escapeHtml(reasonStr)}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="font-size: 13px; color: #64748b; line-height: 1.5; padding-bottom: 8px;">
        Anda dapat mengajukan permohonan baru dengan menyesuaikan jadwal atau memilih fasilitas lain yang tersedia.
      </td>
    </tr>
  `;

	const html = renderBaseHtmlLayout({
		title: "Permohonan Booking Ditolak",
		badgeText: "❌ Ditolak",
		badgeBg: "#fee2e2",
		badgeColor: "#b91c1c",
		bodyHtml,
		ctaUrl: trackingUrl,
		ctaText: "Cek Status Permohonan",
	});

	const text = `PERMOHONAN BOOKING DITOLAK

Yth. ${data.requesterName},
Mohon maaf, permohonan peminjaman fasilitas Anda tidak dapat kami setujui.

Rincian Pengajuan:
• Kode Ref: #${data.bookingRef}
• Fasilitas: ${data.assetName}
• Jadwal: ${startWib} s.d. ${endWib} WIB
• Status: Ditolak

Alasan Penolakan:
"${reasonStr}"

Silakan mengajukan kembali dengan menyesuaikan jadwal atau fasilitas lain melalui sistem Sarpras PPKASN.

Detail:
${trackingUrl}

--
Sistem Sarpras PPKASN`;

	return { subject, html, text };
}

/**
 * Builds the cancellation alert email for requesters and admins.
 */
export function buildBookingCancellationEmail(
	data: BookingCancellationEmailData,
): EmailTemplateOutput {
	const startWib = formatWib(data.startDate);
	const endWib = formatWib(data.endDate);
	const reasonStr = data.reason?.trim() || "-";
	const cancelledByStr = data.cancelledBy?.trim() || "Pengguna";

	const subject = `[SARPRAS PPKASN] Pembatalan Booking #${data.bookingRef}`;

	const bodyHtml = `
    <tr>
      <td style="font-size: 14px; color: #334155; line-height: 1.6; padding-bottom: 16px;">
        Pemberitahuan bahwa permohonan peminjaman sarana dan prasarana berikut telah <strong style="color: #d97706;">DIBATALKAN</strong>:
      </td>
    </tr>
    <tr>
      <td>
        <table width="100%" border="0" cellpadding="8" cellspacing="0" role="presentation" style="background-color: #fffbeb; border-radius: 6px; border: 1px solid #fef3c7; font-size: 13px; margin-bottom: 16px;">
          <tr>
            <td width="35%" style="color: #92400e; font-weight: 500; border-bottom: 1px solid #fef3c7;">Kode Referensi</td>
            <td style="color: #78350f; font-weight: 700; border-bottom: 1px solid #fef3c7;">#${escapeHtml(data.bookingRef)}</td>
          </tr>
          <tr>
            <td style="color: #92400e; font-weight: 500; border-bottom: 1px solid #fef3c7;">Pemohon</td>
            <td style="color: #78350f; font-weight: 600; border-bottom: 1px solid #fef3c7;">${escapeHtml(data.requesterName)}</td>
          </tr>
          <tr>
            <td style="color: #92400e; font-weight: 500; border-bottom: 1px solid #fef3c7;">Fasilitas</td>
            <td style="color: #78350f; font-weight: 600; border-bottom: 1px solid #fef3c7;">${escapeHtml(data.assetName)}</td>
          </tr>
          <tr>
            <td style="color: #92400e; font-weight: 500; border-bottom: 1px solid #fef3c7;">Jadwal Peminjaman</td>
            <td style="color: #78350f; border-bottom: 1px solid #fef3c7;">${escapeHtml(startWib)} s.d. ${escapeHtml(endWib)} WIB</td>
          </tr>
          <tr>
            <td style="color: #92400e; font-weight: 500; border-bottom: 1px solid #fef3c7;">Dibatalkan Oleh</td>
            <td style="color: #78350f; border-bottom: 1px solid #fef3c7;">${escapeHtml(cancelledByStr)}</td>
          </tr>
          <tr>
            <td style="color: #92400e; font-weight: 500;">Alasan Pembatalan</td>
            <td style="color: #78350f;">${escapeHtml(reasonStr)}</td>
          </tr>
        </table>
      </td>
    </tr>
  `;

	const html = renderBaseHtmlLayout({
		title: "Pemberitahuan Pembatalan Booking",
		badgeText: "⚠️ Dibatalkan",
		badgeBg: "#fef3c7",
		badgeColor: "#b45309",
		bodyHtml,
	});

	const text = `PEMBATALAN BOOKING SARPRAS

Permohonan peminjaman sarana & prasarana berikut telah dibatalkan:

• Kode Ref: #${data.bookingRef}
• Pemohon: ${data.requesterName}
• Fasilitas: ${data.assetName}
• Jadwal: ${startWib} s.d. ${endWib} WIB
• Dibatalkan oleh: ${cancelledByStr}
• Alasan Pembatalan: ${reasonStr}

--
Sistem Sarpras PPKASN`;

	return { subject, html, text };
}
