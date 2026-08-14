import assert from "node:assert";
import test from "node:test";
import { eq, like } from "drizzle-orm";
import { db } from "./client.server";
import {
	assetAvailability,
	assetClosures,
	assets,
	auditLogs,
	sessions,
	users,
} from "./schema";

test("Phase 2 Secure Administration & Asset Setup - DB & Logic Tests", async (t) => {
	const testPrefix = "test-auth-";

	// Cleanup leftover test records
	await db.delete(auditLogs).where(like(auditLogs.actorId, `${testPrefix}%`));
	await db.delete(sessions).where(like(sessions.id, `${testPrefix}%`));
	await db
		.delete(assetAvailability)
		.where(like(assetAvailability.openTime, `${testPrefix}%`));
	await db
		.delete(assetClosures)
		.where(eq(assetClosures.id, "00000000-0000-0000-0000-000000000000")); // dummy check
	await db.delete(users).where(like(users.email, `${testPrefix}%`));
	await db.delete(assets).where(like(assets.legacyId, `${testPrefix}%`));

	await t.test("D-14: Users Status and reset password columns", async () => {
		const testEmail = `${testPrefix}user@example.com`;
		const userResult = await db
			.insert(users)
			.values({
				id: `${testPrefix}uid-1`,
				name: "Test Admin",
				email: testEmail,
				role: "admin",
				status: "active",
				mustResetPassword: true,
			})
			.returning();

		assert.strictEqual(userResult[0].status, "active");
		assert.strictEqual(userResult[0].mustResetPassword, true);

		// Verify update status
		await db
			.update(users)
			.set({ status: "inactive" })
			.where(eq(users.id, `${testPrefix}uid-1`));
		const updatedUser = await db
			.select()
			.from(users)
			.where(eq(users.id, `${testPrefix}uid-1`));
		assert.strictEqual(updatedUser[0].status, "inactive");
	});

	await t.test(
		"D-13 & D-15 & D-16: User Deactivation and Session Revocation",
		async () => {
			const targetUserId = `${testPrefix}uid-target`;
			const actorUserId = `${testPrefix}uid-actor`;

			// Setup actor and target users
			await db.insert(users).values([
				{
					id: actorUserId,
					name: "Actor Admin",
					email: `${testPrefix}actor@example.com`,
					role: "admin",
				},
				{
					id: targetUserId,
					name: "Target Operator",
					email: `${testPrefix}target@example.com`,
					role: "operator",
					status: "active",
				},
			]);

			// Setup active session for target user
			const sessionId = `${testPrefix}session-1`;
			await db.insert(sessions).values({
				id: sessionId,
				token: `${testPrefix}token-1`,
				userId: targetUserId,
				expiresAt: new Date(Date.now() + 3600 * 1000),
			});

			// Verify session exists
			const activeSessionsBefore = await db
				.select()
				.from(sessions)
				.where(eq(sessions.userId, targetUserId));
			assert.strictEqual(activeSessionsBefore.length, 1);

			// Simulate Deactivation (from D-13, D-15, D-16)
			// 1. Update target user status to 'inactive'
			await db
				.update(users)
				.set({ status: "inactive" })
				.where(eq(users.id, targetUserId));

			// 2. Delete all sessions for target user
			await db.delete(sessions).where(eq(sessions.userId, targetUserId));

			// 3. Write audit log
			await db.insert(auditLogs).values({
				actorId: actorUserId,
				actorType: "user",
				action: "user.deactivate",
				entityType: "user",
				entityId: targetUserId,
				metadata: {
					deactivatedBy: actorUserId,
					timestamp: new Date().toISOString(),
				},
			});

			// Assertions
			const targetUserInDb = await db
				.select()
				.from(users)
				.where(eq(users.id, targetUserId));
			assert.strictEqual(targetUserInDb[0].status, "inactive");

			const activeSessionsAfter = await db
				.select()
				.from(sessions)
				.where(eq(sessions.userId, targetUserId));
			assert.strictEqual(activeSessionsAfter.length, 0); // sessions must be deleted!

			const logs = await db
				.select()
				.from(auditLogs)
				.where(eq(auditLogs.entityId, targetUserId));
			assert.strictEqual(logs.length, 1);
			assert.strictEqual(logs[0].action, "user.deactivate");
		},
	);

	await t.test("D-09: Asset Availability Table insertions", async () => {
		// Insert asset
		const assetResult = await db
			.insert(assets)
			.values({
				name: "Test Room Availability",
				type: "room",
				capacity: 5,
				legacyId: `${testPrefix}asset-avail-1`,
			})
			.returning();

		const assetId = assetResult[0].id;

		// Insert availability
		const availResult = await db
			.insert(assetAvailability)
			.values({
				assetId,
				dayOfWeek: 1, // Monday
				openTime: `${testPrefix}08:00`,
				closeTime: `${testPrefix}16:00`,
			})
			.returning();

		assert.ok(availResult[0].id);
		assert.strictEqual(availResult[0].dayOfWeek, 1);

		// Query availability
		const avails = await db
			.select()
			.from(assetAvailability)
			.where(eq(assetAvailability.assetId, assetId));
		assert.strictEqual(avails.length, 1);
		assert.strictEqual(avails[0].dayOfWeek, 1);
	});

	await t.test("D-10: Asset Closures Table insertions", async () => {
		// Insert asset
		const assetResult = await db
			.insert(assets)
			.values({
				name: "Test Room Closures",
				type: "room",
				capacity: 5,
				legacyId: `${testPrefix}asset-closures-1`,
			})
			.returning();

		const assetId = assetResult[0].id;
		const closureDate = new Date("2026-08-15T00:00:00.000Z");

		// Insert closure
		const closureResult = await db
			.insert(assetClosures)
			.values({
				assetId,
				date: closureDate,
			})
			.returning();

		assert.ok(closureResult[0].id);

		// Query closures
		const closures = await db
			.select()
			.from(assetClosures)
			.where(eq(assetClosures.assetId, assetId));
		assert.strictEqual(closures.length, 1);
		assert.strictEqual(closures[0].date.getTime(), closureDate.getTime());
	});

	await t.test(
		"D-11 & D-12: Asset archiving and Timezone validation",
		async () => {
			// 1. Asset archiving sets status to 'archived'
			const assetResult = await db
				.insert(assets)
				.values({
					name: "Test Room Archiving",
					type: "room",
					capacity: 5,
					legacyId: `${testPrefix}asset-archive-1`,
				})
				.returning();

			const assetId = assetResult[0].id;
			await db
				.update(assets)
				.set({ status: "archived" })
				.where(eq(assets.id, assetId));

			const archivedAsset = await db
				.select()
				.from(assets)
				.where(eq(assets.id, assetId));
			assert.strictEqual(archivedAsset[0].status, "archived");

			// 2. Timezone validation: verifying date interpretation in Asia/Jakarta
			const { toDate } = await import("date-fns-tz");
			const inputDateStr = "2026-08-15";
			const localDate = toDate(inputDateStr, { timeZone: "Asia/Jakarta" });

			// In WIB (UTC+7), 2026-08-15 00:00:00 WIB is 2026-08-14 17:00:00 UTC
			assert.strictEqual(localDate.getUTCHours(), 17);
			assert.strictEqual(localDate.getUTCDate(), 14);
		},
	);

	// Post-test cleanup
	await db.delete(auditLogs).where(like(auditLogs.actorId, `${testPrefix}%`));
	await db
		.delete(assetAvailability)
		.where(like(assetAvailability.openTime, `${testPrefix}%`));
	await db.delete(users).where(like(users.email, `${testPrefix}%`));
	await db.delete(assets).where(like(assets.legacyId, `${testPrefix}%`));
});
