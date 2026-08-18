import assert from "node:assert";
import test from "node:test";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { eq, like } from "drizzle-orm";
import { db } from "./client.server";
import { assets, bookings } from "./schema";

test("Phase 1 Canonical Data & Migration Tests", async (t) => {
	// Setup clean test data prefix
	const testPrefix = "test-mig-";

	// Cleanup any leftover test records before testing
	await db.delete(bookings).where(like(bookings.legacyId, `${testPrefix}%`));
	await db.delete(assets).where(like(assets.legacyId, `${testPrefix}%`));

	await t.test("DATA-04: Timezone Interpretation & Normalization", () => {
		const rawDateStr = "2026-08-15T09:00:00"; // local time without offset

		// Interpret date in Asia/Jakarta
		const interpretedDate = toDate(rawDateStr, { timeZone: "Asia/Jakarta" });

		// 09:00:00 WIB (UTC+7) is 02:00:00 UTC
		assert.strictEqual(interpretedDate.getUTCHours(), 2);
		assert.strictEqual(interpretedDate.getUTCMinutes(), 0);
		assert.strictEqual(interpretedDate.getUTCDate(), 15);
		assert.strictEqual(interpretedDate.getUTCMonth(), 7); // August is 7 (0-indexed)
		assert.strictEqual(interpretedDate.getUTCFullYear(), 2026);

		// Format back to Asia/Jakarta to verify exact representation
		const formatted = formatInTimeZone(
			interpretedDate,
			"Asia/Jakarta",
			"yyyy-MM-dd HH:mm:ss",
		);
		assert.strictEqual(formatted, "2026-08-15 09:00:00");
	});

	await t.test(
		"DATA-01 & DATA-03: Idempotency and Database Integrity",
		async () => {
			// 1. Insert test asset
			const testAssetLegacyId = `${testPrefix}asset-1`;
			const assetResult = await db
				.insert(assets)
				.values({
					name: "Test Room",
					type: "room",
					capacity: 10,
					legacyId: testAssetLegacyId,
				})
				.returning();

			assert.ok(assetResult[0].id);

			// Verify asset is present
			const assetInDb = await db
				.select()
				.from(assets)
				.where(eq(assets.legacyId, testAssetLegacyId));
			assert.strictEqual(assetInDb.length, 1);

			// Try inserting duplicate asset (simulating migration re-run)
			// In our migration script, we explicitly skip if it already exists.
			// Here we test that the unique constraint on legacy_id prevents duplicate values.
			await assert.rejects(
				async () => {
					await db.insert(assets).values({
						name: "Test Room Duplicate",
						type: "room",
						capacity: 10,
						legacyId: testAssetLegacyId,
					});
				},
				(err: any) =>
					err instanceof Error && err.message.includes("Failed query"),
			);

			// 2. Insert test booking linked to asset
			const testBookingLegacyId = `${testPrefix}booking-1`;
			const startLocal = toDate("2026-08-15T09:00:00", {
				timeZone: "Asia/Jakarta",
			});
			const endLocal = toDate("2026-08-15T12:00:00", {
				timeZone: "Asia/Jakarta",
			});

			const bookingResult = await db
				.insert(bookings)
				.values({
					assetId: assetResult[0].id,
					requesterName: "Test Guest",
					requesterEmail: "test@example.com",
					startDate: startLocal,
					endDate: endLocal,
					timezone: "Asia/Jakarta",
					legacyId: testBookingLegacyId,
				})
				.returning();

			assert.ok(bookingResult[0].id);
			assert.strictEqual(bookingResult[0].assetId, assetResult[0].id);

			// Verify booking is linked to asset
			const bookingInDb = await db
				.select()
				.from(bookings)
				.where(eq(bookings.legacyId, testBookingLegacyId));
			assert.strictEqual(bookingInDb.length, 1);
			assert.strictEqual(bookingInDb[0].assetId, assetResult[0].id);

			// Try inserting duplicate booking
			await assert.rejects(
				async () => {
					await db.insert(bookings).values({
						assetId: assetResult[0].id,
						requesterName: "Test Guest Duplicate",
						requesterEmail: "test@example.com",
						startDate: startLocal,
						endDate: endLocal,
						timezone: "Asia/Jakarta",
						legacyId: testBookingLegacyId,
					});
				},
				(err: any) =>
					err instanceof Error && err.message.includes("Failed query"),
			);
		},
	);

	await t.test(
		"ASSET-FAC-01 & ASSET-FAC-02: Assets facilities JSONB column persistence",
		async () => {
			const testFacilities = [
				'Smart TV 75"',
				"Proyektor Laser",
				"Sound System",
			];
			const testAssetLegacyId = `${testPrefix}asset-facilities`;

			const [inserted] = await db
				.insert(assets)
				.values({
					name: "Auditorium VIP",
					type: "room",
					capacity: 50,
					facilities: testFacilities,
					legacyId: testAssetLegacyId,
				})
				.returning();

			assert.ok(inserted.id);
			assert.deepStrictEqual(inserted.facilities, testFacilities);

			const fetched = await db
				.select()
				.from(assets)
				.where(eq(assets.legacyId, testAssetLegacyId));

			assert.strictEqual(fetched.length, 1);
			assert.deepStrictEqual(fetched[0].facilities, testFacilities);
		},
	);

	// Post-test cleanup
	await db.delete(bookings).where(like(bookings.legacyId, `${testPrefix}%`));
	await db.delete(assets).where(like(assets.legacyId, `${testPrefix}%`));
});
