import assert from "node:assert";
import test from "node:test";
import { like } from "drizzle-orm";
import { db } from "../../db/client.server";
import { assets, auditLogs, bookings } from "../../db/schema";
import { getAuditLogsForEntity } from "../audit/audit.server";
import {
	EmailService,
	safeDispatchEmail,
	sanitizeEmail,
	sanitizeEmailList,
	sendEmail,
} from "./service.server";

test("Resend Email Service & Audit Dispatch (EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04, NOTIF-02)", async (t) => {
	const prefix = "test-email-svc-";
	process.env.NODE_ENV = "test";

	const cleanup = async () => {
		await db.delete(auditLogs).where(like(auditLogs.actorId, "system:email"));
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
			purpose: "Integration Test Email",
			startDate: new Date("2026-08-25T02:00:00.000Z"),
			endDate: new Date("2026-08-25T05:00:00.000Z"),
			status: "pending",
		})
		.returning();

	await t.test("sanitizes valid and invalid email addresses", () => {
		assert.strictEqual(sanitizeEmail("Test@Example.COM"), "test@example.com");
		assert.strictEqual(
			sanitizeEmail("  user.name+tag@sub.domain.co.id  "),
			"user.name+tag@sub.domain.co.id",
		);

		assert.strictEqual(sanitizeEmail(""), null);
		assert.strictEqual(sanitizeEmail("invalid-email"), null);
		assert.strictEqual(sanitizeEmail("@missing-user.com"), null);
		assert.strictEqual(sanitizeEmail("user@.com"), null);
		assert.strictEqual(sanitizeEmail(null), null);
		assert.strictEqual(sanitizeEmail(undefined), null);
	});

	await t.test(
		"sanitizes comma-separated and array email lists with deduplication",
		() => {
			const rawCsv =
				"admin@ppkasn.go.id,  operator@ppkasn.go.id , admin@ppkasn.go.id, invalid-mail";
			const sanitized = sanitizeEmailList(rawCsv);
			assert.deepStrictEqual(sanitized, [
				"admin@ppkasn.go.id",
				"operator@ppkasn.go.id",
			]);

			const rawArr = ["user1@test.com", "user2@test.com, user1@test.com", ""];
			const sanitizedArr = sanitizeEmailList(rawArr);
			assert.deepStrictEqual(sanitizedArr, [
				"user1@test.com",
				"user2@test.com",
			]);
		},
	);

	await t.test(
		"returns mock success when in test mode or API key missing (EMAIL-02)",
		async () => {
			const result = await sendEmail({
				to: "pemohon@example.com",
				subject: "Konfirmasi Pengajuan Booking #BKG-001",
				html: "<h1>Konfirmasi</h1><p>Permohonan booking diterima.</p>",
				text: "Konfirmasi: Permohonan booking diterima.",
				bookingId: booking.id,
				templateType: "BOOKING_SUBMITTED_REQUESTER",
			});

			assert.strictEqual(result.success, true);
			assert.strictEqual(result.mock, true);
			assert.ok(result.messageId?.startsWith("mock-email-"));

			// Verify audit log
			const logs = await getAuditLogsForEntity("booking", booking.id);
			assert.strictEqual(logs.length, 1);
			assert.strictEqual(logs[0].action, "notification.email_dispatch");
			assert.strictEqual(logs[0].actorId, "system:email");
			assert.deepStrictEqual((logs[0].metadata as any).target, [
				"pemohon@example.com",
			]);
			assert.strictEqual(
				(logs[0].metadata as any).template,
				"BOOKING_SUBMITTED_REQUESTER",
			);
			assert.strictEqual((logs[0].metadata as any).status, "mock");
			assert.strictEqual((logs[0].metadata as any).provider, "resend_mock");
		},
	);

	await t.test(
		"returns failure when recipient email list is invalid or empty without throwing (EMAIL-03)",
		async () => {
			const result = await sendEmail({
				to: "invalid-email, also-invalid",
				subject: "Test Invalid",
				html: "<p>Test</p>",
				text: "Test",
				bookingId: booking.id,
				templateType: "BOOKING_SUBMITTED_REQUESTER",
			});

			assert.strictEqual(result.success, false);
			assert.ok(result.error?.includes("Invalid or empty recipient email"));

			// Verify audit log recorded for failed target
			const logs = await getAuditLogsForEntity("booking", booking.id);
			assert.strictEqual(logs.length, 2);
			assert.strictEqual(logs[0].action, "notification.email_dispatch");
			assert.strictEqual((logs[0].metadata as any).status, "failed");
		},
	);

	await t.test(
		"safeDispatchEmail never throws and catches unexpected exceptions (EMAIL-04)",
		async () => {
			const result = await safeDispatchEmail({
				to: "valid@test.com",
				subject: "Safe Dispatch Test",
				html: "<p>Safe</p>",
				text: "Safe",
			});

			assert.strictEqual(result.success, true);
		},
	);

	await t.test(
		"formats real Resend API HTTP request correctly when API key provided",
		async () => {
			const originalFetch = globalThis.fetch;
			const originalKey = process.env.RESEND_API_KEY;
			const originalMock = process.env.RESEND_MOCK;
			const originalEnv = process.env.NODE_ENV;

			try {
				process.env.RESEND_API_KEY = "re_test_123456789";
				process.env.RESEND_MOCK = "false";
				(process.env as any).NODE_ENV = "production";

				let capturedUrl = "";
				let capturedOptions: RequestInit | undefined;

				globalThis.fetch = async (
					input: RequestInfo | URL,
					init?: RequestInit,
				) => {
					capturedUrl = String(input);
					capturedOptions = init;
					return new Response(JSON.stringify({ id: "resend_msg_98765" }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				};

				const result = await EmailService.sendEmail({
					to: "target@ppkasn.go.id",
					subject: "Real API Test",
					html: "<p>Real HTML</p>",
					text: "Real text",
					bookingId: booking.id,
					templateType: "BOOKING_APPROVED",
				});

				assert.strictEqual(result.success, true);
				assert.strictEqual(result.mock, false);
				assert.strictEqual(result.messageId, "resend_msg_98765");
				assert.strictEqual(capturedUrl, "https://api.resend.com/emails");
				assert.strictEqual(capturedOptions?.method, "POST");

				const headers = capturedOptions?.headers as Record<string, string>;
				assert.strictEqual(headers.Authorization, "Bearer re_test_123456789");
				assert.strictEqual(headers["Content-Type"], "application/json");

				const body = JSON.parse(String(capturedOptions?.body));
				assert.deepStrictEqual(body.to, ["target@ppkasn.go.id"]);
				assert.strictEqual(body.subject, "Real API Test");
				assert.strictEqual(body.html, "<p>Real HTML</p>");
				assert.strictEqual(body.text, "Real text");
			} finally {
				globalThis.fetch = originalFetch;
				process.env.RESEND_API_KEY = originalKey;
				process.env.RESEND_MOCK = originalMock;
				process.env.NODE_ENV = originalEnv;
			}
		},
	);

	await cleanup();
});
