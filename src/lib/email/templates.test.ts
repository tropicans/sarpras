import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildBookingApprovalEmail,
	buildBookingCancellationEmail,
	buildBookingRejectionEmail,
	buildBookingSubmissionAdminEmail,
	buildBookingSubmissionRequesterEmail,
	escapeHtml,
	formatWib,
	getAppBaseUrl,
} from "./templates";

describe("Email Templates Engine (EMAIL-01, EMAIL-05, EMAIL-06, EMAIL-07, EMAIL-08)", () => {
	it("escapes special HTML characters correctly", () => {
		const raw = `<script>alert("XSS & test 'attack'")</script>`;
		const escaped = escapeHtml(raw);
		assert.strictEqual(
			escaped,
			"&lt;script&gt;alert(&quot;XSS &amp; test &#039;attack&#039;&quot;)&lt;/script&gt;",
		);
		assert.strictEqual(escapeHtml(null), "");
		assert.strictEqual(escapeHtml(undefined), "");
	});

	it("formats date in Asia/Jakarta (WIB) wall-clock time", () => {
		// 2026-08-15 08:30 UTC = 2026-08-15 15:30 WIB (UTC+7)
		const utcDate = new Date("2026-08-15T08:30:00.000Z");
		const formatted = formatWib(utcDate);
		assert.strictEqual(formatted, "15/08/2026 15:30");
	});

	it("resolves application base URL from environment or fallback", () => {
		const defaultUrl = getAppBaseUrl();
		assert.ok(defaultUrl.startsWith("http"));
		assert.ok(!defaultUrl.endsWith("/"));
	});

	it("generates booking submission requester email with WIB format and CTA link (EMAIL-05)", () => {
		const result = buildBookingSubmissionRequesterEmail({
			bookingRef: "bkg-req-001",
			requesterName: "Budi Santoso",
			assetName: "Auditorium Utama",
			assetLocation: "Gedung A Lt. 2",
			startDate: "2026-08-20T01:00:00.000Z", // 08:00 WIB
			endDate: "2026-08-20T09:00:00.000Z", // 16:00 WIB
			purpose: "Rapat Koordinasi Nasional",
		});

		assert.ok(result.subject.includes("#bkg-req-001"));
		assert.ok(result.html.includes("<!DOCTYPE html>"));
		assert.ok(result.html.includes("SARPRAS PPKASN"));
		assert.ok(result.html.includes("Budi Santoso"));
		assert.ok(result.html.includes("Auditorium Utama"));
		assert.ok(result.html.includes("20/08/2026 08:00 s.d. 20/08/2026 16:00 WIB"));
		assert.ok(result.html.includes("Cek Status Permohonan"));
		assert.ok(result.html.includes("/status/bkg-req-001"));

		// Plaintext asserts
		assert.ok(result.text.includes("PENGAJUAN BOOKING SARPRAS PPKASN"));
		assert.ok(result.text.includes("#bkg-req-001"));
		assert.ok(result.text.includes("Auditorium Utama (Gedung A Lt. 2)"));
		assert.ok(result.text.includes("/status/bkg-req-001"));
		assert.ok(!result.text.includes("<table>"));
	});

	it("generates admin operational alert email with requester info and admin CTA link (EMAIL-06)", () => {
		const result = buildBookingSubmissionAdminEmail({
			bookingRef: "bkg-adm-002",
			requesterName: "Siti Rahma",
			requesterOrganization: "Puslatbang KMP",
			assetName: "Ruang Kelas 101",
			startDate: "2026-09-01T02:00:00.000Z",
			endDate: "2026-09-01T05:00:00.000Z",
			attendance: 35,
			purpose: "Pelatihan Kepemimpinan",
		});

		assert.ok(result.subject.includes("[OPERATIONAL ALERT]"));
		assert.ok(result.subject.includes("#bkg-adm-002"));
		assert.ok(result.html.includes("Siti Rahma"));
		assert.ok(result.html.includes("Puslatbang KMP"));
		assert.ok(result.html.includes("35 orang"));
		assert.ok(result.html.includes("Tinjau di Panel Admin"));

		assert.ok(result.text.includes("OPERATIONAL ALERT: BOOKING BARU"));
		assert.ok(result.text.includes("35 orang"));
		assert.ok(result.text.includes("/admin/bookings"));
	});

	it("generates booking approval email with confirmation details (EMAIL-07)", () => {
		const result = buildBookingApprovalEmail({
			bookingRef: "bkg-app-003",
			requesterName: "Dr. Hendra",
			assetName: "Ruang Seminar 1",
			assetLocation: "Gedung B Lt. 3",
			startDate: "2026-08-25T01:30:00.000Z",
			endDate: "2026-08-25T04:30:00.000Z",
		});

		assert.ok(result.subject.includes("DISETUJUI"));
		assert.ok(result.subject.includes("#bkg-app-003"));
		assert.ok(result.html.includes("Disetujui"));
		assert.ok(result.html.includes("Ruang Seminar 1"));
		assert.ok(result.html.includes("Lihat Rincian Booking"));

		assert.ok(result.text.includes("PERMOHONAN BOOKING DISETUJUI"));
		assert.ok(result.text.includes("#bkg-app-003"));
	});

	it("generates booking rejection email with highlighted rejection reason (EMAIL-08)", () => {
		const result = buildBookingRejectionEmail({
			bookingRef: "bkg-rej-004",
			requesterName: "Ahmad Fauzi",
			assetName: "Lapangan Futsal",
			startDate: "2026-08-28T09:00:00.000Z",
			endDate: "2026-08-28T11:00:00.000Z",
			rejectionReason: "Fasilitas sedang dalam perbaikan drainase & lampu.",
		});

		assert.ok(result.subject.includes("Informasi Permohonan Booking"));
		assert.ok(result.subject.includes("#bkg-rej-004"));
		assert.ok(result.html.includes("Ditolak"));
		assert.ok(
			result.html.includes("Fasilitas sedang dalam perbaikan drainase &amp; lampu."),
		);

		assert.ok(result.text.includes("PERMOHONAN BOOKING DITOLAK"));
		assert.ok(
			result.text.includes("Fasilitas sedang dalam perbaikan drainase & lampu."),
		);
	});

	it("generates booking cancellation alert email", () => {
		const result = buildBookingCancellationEmail({
			bookingRef: "bkg-cnc-005",
			requesterName: "Dewi Lestari",
			assetName: "Asrama Wisma 1",
			startDate: "2026-09-10T01:00:00.000Z",
			endDate: "2026-09-12T05:00:00.000Z",
			cancelledBy: "Pemohon",
			reason: "Acara dimajukan ke luar kota",
		});

		assert.ok(result.subject.includes("Pembatalan Booking #bkg-cnc-005"));
		assert.ok(result.html.includes("Dibatalkan"));
		assert.ok(result.html.includes("Acara dimajukan ke luar kota"));
		assert.ok(result.text.includes("PEMBATALAN BOOKING SARPRAS"));
	});
});
