import assert from "node:assert";
import test from "node:test";
import { like } from "drizzle-orm";
import { db } from "../../db/client.server";
import { assets, auditLogs, bookings } from "../../db/schema";
import { getAuditLogsForEntity } from "../audit/audit.server";
import { safeDispatchNotification, WhatsAppService } from "./service.server";

test("WhatsApp Service & Audit Dispatch (WA-01, WA-02, WA-03, WA-08)", async (t) => {
	const prefix = "test-wa-svc-";
	process.env.NODE_ENV = "test";

	const cleanup = async () => {
		await db
			.delete(auditLogs)
			.where(like(auditLogs.actorId, "system:whatsapp"));
		await db
			.delete(bookings)
			.where(like(bookings.requesterEmail, `${prefix}%`));
		await db.delete(assets).where(like(assets.name, `${prefix}%`));
	};

	await cleanup();

	// Create test asset and booking for linking audit logs
	const [asset] = await db
		.insert(assets)
		.values({
			name: `${prefix}Test Room`,
			type: "room",
			capacity: 10,
		})
		.returning();

	const [booking] = await db
		.insert(bookings)
		.values({
			assetId: asset.id,
			requesterName: "Test Requester",
			requesterEmail: `${prefix}req@example.com`,
			requesterPhone: "081234567890",
			purpose: "Integration Test",
			startDate: new Date("2026-08-25T02:00:00.000Z"),
			endDate: new Date("2026-08-25T05:00:00.000Z"),
			status: "pending",
		})
		.returning();

	await t.test("Mock Fallback when in test mode or token missing", async () => {
		const result = await WhatsAppService.sendWhatsAppMessage({
			target: "081234567890",
			message: "Test message from automated test suite",
			bookingId: booking.id,
			templateType: "BOOKING_CREATED_REQUESTER",
		});

		assert.strictEqual(result.success, true);
		assert.strictEqual(result.mock, true);
		assert.ok(result.messageId?.startsWith("mock-"));

		// Verify audit log
		const logs = await getAuditLogsForEntity("booking", booking.id);
		assert.strictEqual(logs.length, 1);
		assert.strictEqual(logs[0].action, "notification.whatsapp_dispatch");
		assert.strictEqual(logs[0].actorId, "system:whatsapp");
		assert.strictEqual((logs[0].metadata as any).target, "6281234567890");
		assert.strictEqual(
			(logs[0].metadata as any).template,
			"BOOKING_CREATED_REQUESTER",
		);
		assert.strictEqual((logs[0].metadata as any).status, "mock");
		assert.strictEqual((logs[0].metadata as any).provider, "fonnte_mock");
	});

	await t.test(
		"Invalid target phone logs failure and returns success: false without throwing",
		async () => {
			const result = await WhatsAppService.sendWhatsAppMessage({
				target: "invalid-phone",
				message: "Will not send",
				bookingId: booking.id,
				templateType: "BOOKING_APPROVED",
			});

			assert.strictEqual(result.success, false);
			assert.match(result.error || "", /Invalid or empty target phone number/);

			// Verify audit log recorded for failed target
			const logs = await getAuditLogsForEntity("booking", booking.id);
			assert.strictEqual(logs.length, 2);
			assert.strictEqual(logs[0].action, "notification.whatsapp_dispatch");
			assert.strictEqual((logs[0].metadata as any).status, "failed");
		},
	);

	await t.test("safeDispatchNotification wrapper never throws", async () => {
		const result = await safeDispatchNotification({
			target: "+628123456789",
			message: "Safe dispatch test",
			bookingId: booking.id,
		});

		assert.strictEqual(result.success, true);
	});

	await t.test(
		"Fonnte payload sends countryCode 0 when target is already normalized",
		async () => {
			// Mock global fetch to inspect request body
			const originalFetch = global.fetch;
			let capturedBody: any = null;

			try {
				global.fetch = async (_url: any, options: any) => {
					capturedBody = JSON.parse(options.body);
					return {
						ok: true,
						json: async () => ({ status: true, id: "msg-test-123" }),
					} as any;
				};

				// Temporarily simulate non-test environment to test HTTP dispatch
				const oldEnv = process.env.NODE_ENV;
				const oldMock = process.env.FONNTE_MOCK;
				const oldToken = process.env.FONNTE_API_TOKEN;

				(process.env as any).NODE_ENV = "production";
				process.env.FONNTE_MOCK = "false";
				process.env.FONNTE_API_TOKEN = "test-token";

				const res = await WhatsAppService.sendWhatsAppMessage({
					target: "081234567890",
					message: "Test message",
					bookingId: booking.id,
				});

				assert.strictEqual(res.success, true);
				assert.strictEqual(capturedBody?.target, "6281234567890");
				assert.strictEqual(capturedBody?.countryCode, "0");

				// Restore
				(process.env as any).NODE_ENV = oldEnv;
				process.env.FONNTE_MOCK = oldMock;
				process.env.FONNTE_API_TOKEN = oldToken;
			} finally {
				global.fetch = originalFetch;
			}
		},
	);

	await cleanup();
});
