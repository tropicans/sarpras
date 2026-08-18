import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildBookingApprovalEmail,
	buildBookingRejectionEmail,
	buildBookingSubmissionAdminEmail,
	buildBookingSubmissionRequesterEmail,
} from "./templates";
import {
	buildBookingSubmissionAdminMessage,
	buildBookingSubmissionRequesterMessage,
} from "../whatsapp/templates";

describe("Bug Reproduction: Tracking and Admin Queue URLs", () => {
	it("email requester templates must generate URLs matching /status/{ref}", () => {
		const ref = "4efb5bea-8ca4-4c10-8b22-ba99ccda4098";
		const submissionEmail = buildBookingSubmissionRequesterEmail({
			bookingRef: ref,
			requesterName: "Yudhi Ardinal",
			assetName: "Asrama Cempaka Kamar 101",
			startDate: "2026-08-14T07:00:00.000Z",
			endDate: "2026-08-15T05:00:00.000Z",
		});

		// Must point to /status/{ref} instead of non-existent /check-booking
		assert.ok(
			submissionEmail.html.includes(`/status/${ref}`),
			`Expected HTML to contain /status/${ref}, but got: ${submissionEmail.html}`,
		);
		assert.ok(
			!submissionEmail.html.includes("/check-booking"),
			"HTML should not contain /check-booking",
		);

		const approvalEmail = buildBookingApprovalEmail({
			bookingRef: ref,
			requesterName: "Yudhi Ardinal",
			assetName: "Asrama Cempaka Kamar 101",
			startDate: "2026-08-14T07:00:00.000Z",
			endDate: "2026-08-15T05:00:00.000Z",
		});
		assert.ok(
			approvalEmail.html.includes(`/status/${ref}`),
			`Expected approval HTML to contain /status/${ref}`,
		);

		const rejectionEmail = buildBookingRejectionEmail({
			bookingRef: ref,
			requesterName: "Yudhi Ardinal",
			assetName: "Asrama Cempaka Kamar 101",
			startDate: "2026-08-14T07:00:00.000Z",
			endDate: "2026-08-15T05:00:00.000Z",
			rejectionReason: "Jadwal penuh",
		});
		assert.ok(
			rejectionEmail.html.includes(`/status/${ref}`),
			`Expected rejection HTML to contain /status/${ref}`,
		);
	});

	it("email admin alert template must generate admin URL matching /admin/bookings", () => {
		const ref = "4efb5bea-8ca4-4c10-8b22-ba99ccda4098";
		const adminEmail = buildBookingSubmissionAdminEmail({
			bookingRef: ref,
			requesterName: "Yudhi Ardinal",
			assetName: "Asrama Cempaka Kamar 101",
			startDate: "2026-08-14T07:00:00.000Z",
			endDate: "2026-08-15T05:00:00.000Z",
			attendance: 1,
		});

		assert.ok(
			adminEmail.html.includes("/admin/bookings"),
			`Expected admin HTML to contain /admin/bookings, got: ${adminEmail.html}`,
		);
		assert.ok(
			!adminEmail.html.includes("/admin/approval"),
			"Admin email should not contain non-existent /admin/approval",
		);
	});

	it("whatsapp templates must generate URLs matching /status/{ref} and /admin/bookings", () => {
		const ref = "4efb5bea-8ca4-4c10-8b22-ba99ccda4098";
		const waRequester = buildBookingSubmissionRequesterMessage({
			bookingRef: ref,
			requesterName: "Yudhi Ardinal",
			assetName: "Asrama Cempaka Kamar 101",
			startDate: "2026-08-14T07:00:00.000Z",
			endDate: "2026-08-15T05:00:00.000Z",
		});
		assert.ok(
			waRequester.includes(`/status/${ref}`),
			`Expected WA message to contain /status/${ref}, got: ${waRequester}`,
		);

		const waAdmin = buildBookingSubmissionAdminMessage({
			bookingRef: ref,
			requesterName: "Yudhi Ardinal",
			assetName: "Asrama Cempaka Kamar 101",
			startDate: "2026-08-14T07:00:00.000Z",
			endDate: "2026-08-15T05:00:00.000Z",
			attendance: 1,
		});
		assert.ok(
			waAdmin.includes("/admin/bookings"),
			`Expected WA admin message to contain /admin/bookings, got: ${waAdmin}`,
		);
	});
});
