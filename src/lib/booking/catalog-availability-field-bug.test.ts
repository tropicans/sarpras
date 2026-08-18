import assert from "node:assert";
import test from "node:test";

process.env.NODE_ENV = "test";

import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.server";
import { assets, bookings } from "../../db/schema";
import { BookingService } from "./service.server";

test("Field (Lapangan) Availability & Catalog Filtering Bug Reproduction", async (t) => {
	const fieldId = crypto.randomUUID();

	t.before(async () => {
		// Clean up previous test runs if any
		await db.delete(bookings).where(eq(bookings.assetId, fieldId));
		await db.delete(assets).where(eq(assets.id, fieldId));

		// Insert a field asset (Lapangan Voli)
		await db.insert(assets).values({
			id: fieldId,
			name: "Lapangan Voli Test",
			type: "field",
			location: "Area Olah Raga",
			capacity: 12,
			status: "active",
		});
	});

	t.after(async () => {
		await db.delete(bookings).where(eq(bookings.assetId, fieldId));
		await db.delete(assets).where(eq(assets.id, fieldId));
	});

	await t.test(
		"Bug 1: checkPreflightAvailability must check overlap for type 'field' assets",
		async () => {
			const startIso = "2026-08-19T08:00:00.000Z";
			const endIso = "2026-08-19T17:00:00.000Z";

			// Insert an approved booking for Lapangan Voli on 19 Aug 2026
			const [bkg] = await db
				.insert(bookings)
				.values({
					assetId: fieldId,
					requesterName: "Peminjam Voli",
					requesterEmail: "voli@example.com",
					requesterPhone: "081234567890",
					startDate: new Date(startIso),
					endDate: new Date(endIso),
					status: "approved",
				})
				.returning();

			try {
				// Preflight check for the same slot
				const res = await BookingService.checkPreflightAvailability({
					assetId: fieldId,
					startDate: startIso,
					endDate: endIso,
					attendance: 10,
				});

				// Must NOT be available because it overlaps with an approved booking
				assert.strictEqual(
					res.available,
					false,
					"checkPreflightAvailability should mark field as unavailable when an approved booking overlaps",
				);
			} finally {
				if (bkg) {
					await db.delete(bookings).where(eq(bookings.id, bkg.id));
				}
			}
		},
	);

	await t.test(
		"Bug 2: checkCatalogAvailability should detect pending/approved bookings for fields",
		async () => {
			const startIso = "2026-08-19T01:00:00.000Z"; // 08:00 WIB
			const endIso = "2026-08-19T10:00:00.000Z"; // 17:00 WIB

			// Insert a pending booking for Lapangan Voli
			const [bkg] = await db
				.insert(bookings)
				.values({
					assetId: fieldId,
					requesterName: "Peminjam Pending Voli",
					requesterEmail: "pending_voli@example.com",
					requesterPhone: "081234567890",
					startDate: new Date("2026-08-19T02:00:00.000Z"), // 09:00 WIB
					endDate: new Date("2026-08-19T04:00:00.000Z"), // 11:00 WIB
					status: "pending",
				})
				.returning();

			try {
				const catalogResults = await BookingService.checkCatalogAvailability({
					startDate: startIso,
					endDate: endIso,
				});

				const fieldStatus = catalogResults[fieldId];
				assert.ok(fieldStatus, "Field status should exist in catalog results");
				assert.strictEqual(
					fieldStatus.available,
					false,
					"Catalog should show field as unavailable/occupied when there is an active (approved or pending) booking",
				);
			} finally {
				if (bkg) {
					await db.delete(bookings).where(eq(bookings.id, bkg.id));
				}
			}
		},
	);
});
