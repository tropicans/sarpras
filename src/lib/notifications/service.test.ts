import assert from "node:assert";
import test from "node:test";
import { like } from "drizzle-orm";
import { db } from "../../db/client.server";
import { assets, auditLogs, bookings } from "../../db/schema";
import { getAuditLogsForEntity } from "../audit/audit.server";
import {
	dispatchBookingApprovedNotifications,
	dispatchBookingCancelledNotifications,
	dispatchBookingCreatedNotifications,
	dispatchBookingRejectedNotifications,
	safeDispatchBookingNotifications,
} from "./service.server";

test("Unified Dual-Channel Notification Orchestrator (NOTIF-01, NOTIF-02, EMAIL-04)", async (t) => {
	const prefix = "test-notif-orch-";
	process.env.NODE_ENV = "test";
	process.env.FONNTE_MOCK = "true";
	process.env.RESEND_MOCK = "true";

	const cleanup = async () => {
		await db
			.delete(auditLogs)
			.where(like(auditLogs.actorId, "system:%"));
		await db
			.delete(bookings)
			.where(like(bookings.requesterEmail, `${prefix}%`));
		await db.delete(assets).where(like(assets.name, `${prefix}%`));
	};

	await cleanup();

	// Create test asset and booking
	const [asset] = await db
		.insert(assets)
		.values({
			name: `${prefix}Auditorium`,
			type: "room",
			capacity: 100,
		})
		.returning();

	const [booking] = await db
		.insert(bookings)
		.values({
			assetId: asset.id,
			requesterName: "Budi Santoso",
			requesterEmail: `${prefix}budi@example.com`,
			requesterPhone: "081234567890",
			purpose: "Rapat Kerja Tahunan",
			startDate: new Date("2026-09-01T01:00:00.000Z"),
			endDate: new Date("2026-09-01T09:00:00.000Z"),
			status: "pending",
		})
		.returning();

	await t.test("dispatches to both Email and WhatsApp when both exist (NOTIF-01)", async () => {
		const origAdminEmail = process.env.ADMIN_DEFAULT_EMAIL;
		const origAdminWa = process.env.FONNTE_ADMIN_TARGET;

		try {
			process.env.ADMIN_DEFAULT_EMAIL = "admin1@ppkasn.go.id, admin2@ppkasn.go.id";
			process.env.FONNTE_ADMIN_TARGET = "08111268777";

			const summary = await dispatchBookingCreatedNotifications({
				bookingId: booking.id,
				bookingRef: booking.id,
				requesterName: booking.requesterName,
				requesterEmail: booking.requesterEmail,
				requesterPhone: booking.requesterPhone,
				requesterOrganization: "Bagian Umum",
				assetName: asset.name,
				startDate: booking.startDate,
				endDate: booking.endDate,
				attendance: 50,
				purpose: booking.purpose,
			});

			// Requester email + 2 Admin emails = 3 email dispatches
			assert.strictEqual(summary.emailResults.length, 3);
			assert.ok(summary.emailResults.every((r) => r.success && r.mock));

			// Requester WA + 1 Admin WA = 2 WA dispatches
			assert.strictEqual(summary.whatsappResults.length, 2);
			assert.ok(summary.whatsappResults.every((r) => r.success && r.mock));

			// Verify audit logs recorded across both channels (NOTIF-02)
			const logs = await getAuditLogsForEntity("booking", booking.id);
			const emailLogs = logs.filter(
				(l) => l.action === "notification.email_dispatch",
			);
			const waLogs = logs.filter(
				(l) => l.action === "notification.whatsapp_dispatch",
			);

			assert.ok(emailLogs.length >= 1);
			assert.ok(waLogs.length >= 1);
		} finally {
			process.env.ADMIN_DEFAULT_EMAIL = origAdminEmail;
			process.env.FONNTE_ADMIN_TARGET = origAdminWa;
		}
	});

	await t.test("gracefully handles email-only recipient without phone", async () => {
		const summary = await dispatchBookingApprovedNotifications({
			bookingId: booking.id,
			bookingRef: booking.id,
			requesterName: "Hendra",
			requesterEmail: "hendra@ppkasn.go.id",
			requesterPhone: null,
			assetName: asset.name,
			startDate: booking.startDate,
			endDate: booking.endDate,
		});

		assert.strictEqual(summary.emailResults.length, 1);
		assert.strictEqual(summary.emailResults[0].success, true);
		assert.strictEqual(summary.whatsappResults.length, 0);
	});

	await t.test("gracefully handles phone-only recipient without email", async () => {
		const summary = await dispatchBookingRejectedNotifications({
			bookingId: booking.id,
			bookingRef: booking.id,
			requesterName: "Siti",
			requesterEmail: null,
			requesterPhone: "081298765432",
			assetName: asset.name,
			startDate: booking.startDate,
			endDate: booking.endDate,
			rejectionReason: "Jadwal bertabrakan dengan acara pimpinan.",
		});

		assert.strictEqual(summary.emailResults.length, 0);
		assert.strictEqual(summary.whatsappResults.length, 1);
		assert.strictEqual(summary.whatsappResults[0].success, true);
	});

	await t.test("handles cancellation notification dispatches", async () => {
		const summary = await dispatchBookingCancelledNotifications({
			bookingId: booking.id,
			bookingRef: booking.id,
			requesterName: "Budi",
			requesterEmail: "budi@ppkasn.go.id",
			requesterPhone: "081234567890",
			assetName: asset.name,
			startDate: booking.startDate,
			endDate: booking.endDate,
			cancelledBy: "Pemohon",
			reason: "Pembatalan agenda dinas",
		});

		assert.strictEqual(summary.emailResults.length, 1);
		assert.strictEqual(summary.whatsappResults.length, 1);
		assert.strictEqual(summary.emailResults[0].success, true);
		assert.strictEqual(summary.whatsappResults[0].success, true);
	});

	await t.test("safeDispatchBookingNotifications catches and isolates errors (EMAIL-04)", async () => {
		const result = await safeDispatchBookingNotifications(async () => {
			throw new Error("Simulated critical gateway exception");
		});

		assert.strictEqual(result, null);
	});

	await cleanup();
});
