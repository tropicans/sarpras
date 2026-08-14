import assert from "node:assert";
import test from "node:test";
import {
	buildBookingApprovalMessage,
	buildBookingCancellationMessage,
	buildBookingRejectionMessage,
	buildBookingSubmissionAdminMessage,
	buildBookingSubmissionRequesterMessage,
	getAppBaseUrl,
} from "./templates";

test("WhatsApp Message Templates Engine (WA-04, WA-05, WA-06, WA-07, WA-08)", async (t) => {
	const sampleStart = new Date("2026-08-20T01:30:00.000Z"); // 08:30 WIB
	const sampleEnd = new Date("2026-08-20T09:00:00.000Z"); // 16:00 WIB

	await t.test("getAppBaseUrl resolution", () => {
		const base = getAppBaseUrl();
		assert.ok(base.startsWith("http"));
	});

	await t.test("WA-04: buildBookingSubmissionRequesterMessage", () => {
		const msg = buildBookingSubmissionRequesterMessage({
			bookingRef: "bkg-12345",
			requesterName: "Budi Santoso",
			assetName: "Ruang Rapat Utama",
			assetLocation: "Gedung A Lt. 2",
			startDate: sampleStart,
			endDate: sampleEnd,
			purpose: "Rapat Koordinasi Tim IT",
		});

		assert.match(msg, /PENGAJUAN BOOKING SARPRAS PPKASN/);
		assert.match(msg, /Budi Santoso/);
		assert.match(msg, /#bkg-12345/);
		assert.match(msg, /Ruang Rapat Utama \(Gedung A Lt\. 2\)/);
		assert.match(msg, /20\/08\/2026 08:30 s\.d\. 20\/08\/2026 16:00 WIB/);
		assert.match(msg, /Rapat Koordinasi Tim IT/);
		assert.match(msg, /check-booking\?ref=bkg-12345/);
	});

	await t.test("WA-07, WA-08: buildBookingSubmissionAdminMessage", () => {
		const msg = buildBookingSubmissionAdminMessage({
			bookingRef: "bkg-12345",
			requesterName: "Siti Aminah",
			requesterOrganization: "Biro Kepegawaian",
			assetName: "Auditorium",
			startDate: sampleStart,
			endDate: sampleEnd,
			attendance: 50,
			purpose: "Workshop Transformasi Digital",
		});

		assert.match(msg, /OPERATIONAL ALERT: BOOKING BARU/);
		assert.match(msg, /Siti Aminah \(Biro Kepegawaian\)/);
		assert.match(msg, /#bkg-12345/);
		assert.match(msg, /Auditorium/);
		assert.match(msg, /50 orang/);
		assert.match(msg, /Workshop Transformasi Digital/);
		assert.match(msg, /\/admin\/approval/);
	});

	await t.test("WA-05: buildBookingApprovalMessage", () => {
		const msg = buildBookingApprovalMessage({
			bookingRef: "bkg-12345",
			requesterName: "Budi Santoso",
			assetName: "Ruang Rapat Utama",
			assetLocation: "Gedung A Lt. 2",
			startDate: sampleStart,
			endDate: sampleEnd,
		});

		assert.match(msg, /PERMOHONAN BOOKING DISETUJUI/);
		assert.match(msg, /Budi Santoso/);
		assert.match(msg, /#bkg-12345/);
		assert.match(msg, /Ruang Rapat Utama/);
		assert.match(msg, /20\/08\/2026 08:30 s\.d\. 20\/08\/2026 16:00 WIB/);
		assert.match(msg, /Disetujui/);
	});

	await t.test(
		"WA-06: buildBookingRejectionMessage includes mandatory reason",
		() => {
			const msg = buildBookingRejectionMessage({
				bookingRef: "bkg-12345",
				requesterName: "Budi Santoso",
				assetName: "Ruang Rapat Utama",
				startDate: sampleStart,
				endDate: sampleEnd,
				rejectionReason: "Fasilitas sedang dilakukan pemeliharaan AC mendadak",
			});

			assert.match(msg, /PERMOHONAN BOOKING DITOLAK/);
			assert.match(msg, /Budi Santoso/);
			assert.match(msg, /#bkg-12345/);
			assert.match(
				msg,
				/"Fasilitas sedang dilakukan pemeliharaan AC mendadak"/,
			);
		},
	);

	await t.test("buildBookingCancellationMessage", () => {
		const msg = buildBookingCancellationMessage({
			bookingRef: "bkg-12345",
			requesterName: "Budi Santoso",
			assetName: "Ruang Rapat Utama",
			startDate: sampleStart,
			endDate: sampleEnd,
			reason: "Jadwal pimpinan bergeser",
			cancelledBy: "Pemohon",
		});

		assert.match(msg, /PEMBATALAN BOOKING SARPRAS/);
		assert.match(msg, /#bkg-12345/);
		assert.match(msg, /Jadwal pimpinan bergeser/);
		assert.match(msg, /Dibatalkan oleh:\* Pemohon/);
	});
});
