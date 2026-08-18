import assert from "node:assert";
import test from "node:test";
import { and, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "../../db/client.server";
import {
	assetAvailability,
	assetClosures,
	assets,
	auditLogs,
	bookings,
	users,
} from "../../db/schema";
import { AdminAuditLogsFilterSchema } from "../audit/admin-fns.functions";
import { recordAuditEvent } from "../audit/audit.server";
import { AdminBookingsFilterSchema } from "./admin-fns.functions";
import { BookingService } from "./service.server";

test("Phase 5 Plan 01: Admin Decisions & Operations Tests", async (t) => {
	// Setup test user, assets, and seed data
	const testAdminId = "test-admin-" + Date.now();
	const testUserEmail = `admin-${Date.now()}@example.com`;

	await db.insert(users).values({
		id: testAdminId,
		name: "Administrator UAT",
		email: testUserEmail,
		role: "admin",
		status: "active",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	// Create test room asset
	const [testRoom] = await db
		.insert(assets)
		.values({
			name: `Ruang UAT Admin ${Date.now()}`,
			type: "room",
			location: "Lantai 3 Gedung A",
			capacity: 25,
			status: "active",
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.returning();

	// Create test dormitory asset
	await db.insert(assets).values({
		name: `Asrama UAT Admin ${Date.now()}`,
		type: "dormitory",
		location: "Wisma C",
		capacity: 10,
		status: "active",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	// Add room availability (Mon-Fri 08:00 - 18:00)
	for (let day = 1; day <= 5; day++) {
		await db.insert(assetAvailability).values({
			assetId: testRoom.id,
			dayOfWeek: day,
			openTime: "08:00",
			closeTime: "18:00",
		});
	}

	await t.test("FLOW-02: Live Conflict Detection & Context Logic", async () => {
		// Create base pending booking A
		const bookingA = await BookingService.createBookingRequest({
			assetId: testRoom.id,
			requesterName: "Pemohon A",
			requesterEmail: "pemohonA@example.com",
			requesterPhone: "081234567890",
			requesterOrganization: "Divisi Kepegawaian",
			purpose: "Rapat Koordinasi Internal",
			attendance: 15,
			startDate: new Date("2026-09-10T09:00:00+07:00"),
			endDate: new Date("2026-09-10T12:00:00+07:00"),
			timezone: "Asia/Jakarta",
			letterFileName: "surat_a.pdf",
			letterFileUrl: "/uploads/letters/surat_a.pdf",
		});

		// Create competing pending booking B on same slot (Soft Conflict)
		const bookingB = await BookingService.createBookingRequest({
			assetId: testRoom.id,
			requesterName: "Pemohon B (Kompetitor)",
			requesterEmail: "pemohonB@example.com",
			requesterPhone: "081298765432",
			requesterOrganization: "Divisi TI",
			purpose: "Pelatihan IT Sarpras",
			attendance: 10,
			startDate: new Date("2026-09-10T10:00:00+07:00"),
			endDate: new Date("2026-09-10T13:00:00+07:00"),
			timezone: "Asia/Jakarta",
			letterFileName: "surat_b.pdf",
			letterFileUrl: "/uploads/letters/surat_b.pdf",
		});

		// Check conflict context for booking A before any approval
		// Both are pending, so booking A should have soft conflict (booking B) and 0 hard conflicts
		const contextBeforeApprove = await db
			.select({
				id: bookings.id,
				assetId: bookings.assetId,
				requesterName: bookings.requesterName,
				startDate: bookings.startDate,
				endDate: bookings.endDate,
				status: bookings.status,
			})
			.from(bookings)
			.where(
				and(
					eq(bookings.assetId, testRoom.id),
					ne(bookings.id, bookingA.id),
					eq(bookings.status, "pending"),
				),
			);

		assert.strictEqual(contextBeforeApprove.length >= 1, true);

		// Approve booking A
		await BookingService.approveBooking(bookingA.id, testAdminId);

		// Now check conflict context for booking B:
		// Booking A is approved and overlaps booking B -> Booking B has a HARD conflict!
		const approvedOverlapsForB = await db
			.select()
			.from(bookings)
			.where(
				and(
					eq(bookings.assetId, testRoom.id),
					eq(bookings.status, "approved"),
					ne(bookings.id, bookingB.id),
				),
			);

		assert.strictEqual(
			approvedOverlapsForB.some((b) => b.id === bookingA.id),
			true,
		);
	});

	await t.test(
		"FLOW-03: Accountable Decision Execution (Approve/Reject)",
		async () => {
			// Create a pending booking to reject
			const bookingToReject = await BookingService.createBookingRequest({
				assetId: testRoom.id,
				requesterName: "Pemohon Tolak",
				requesterEmail: "tolak@example.com",
				purpose: "Kegiatan yang Ditolak",
				attendance: 5,
				startDate: new Date("2026-09-15T09:00:00+07:00"),
				endDate: new Date("2026-09-15T11:00:00+07:00"),
				timezone: "Asia/Jakarta",
				letterFileName: "surat_tolak.pdf",
				letterFileUrl: "/uploads/letters/surat_tolak.pdf",
			});

			// Rejection without reason must fail
			await assert.rejects(
				async () => {
					await BookingService.rejectBooking(
						bookingToReject.id,
						testAdminId,
						"",
					);
				},
				{
					message: /Alasan penolakan/,
				},
			);

			// Rejection with reason succeeds
			const rejected = await BookingService.rejectBooking(
				bookingToReject.id,
				testAdminId,
				"Ruangan digunakan untuk agenda pimpinan mendesak",
			);

			assert.strictEqual(rejected.status, "rejected");
			assert.strictEqual(
				rejected.rejectionReason,
				"Ruangan digunakan untuk agenda pimpinan mendesak",
			);

			// Verify audit log recorded for rejection
			const [rejectAudit] = await db
				.select()
				.from(auditLogs)
				.where(
					and(
						eq(auditLogs.entityId, bookingToReject.id),
						eq(auditLogs.action, "booking.reject"),
					),
				);

			assert.ok(rejectAudit);
			assert.strictEqual(rejectAudit.actorId, testAdminId);
			assert.strictEqual(
				rejectAudit.metadata?.rejectionReason,
				"Ruangan digunakan untuk agenda pimpinan mendesak",
			);
		},
	);

	await t.test(
		"OPS-01: Dashboard Overview KPIs & Filter Validation",
		async () => {
			// Test Filter schema parsing
			const filterAll = AdminBookingsFilterSchema.parse({});
			assert.strictEqual(filterAll.status, "all");
			assert.strictEqual(filterAll.assetType, "all");
			assert.strictEqual(filterAll.page, 1);
			assert.strictEqual(filterAll.limit, 10);

			const filterCustom = AdminBookingsFilterSchema.parse({
				status: "pending",
				assetType: "room",
				search: "Divisi TI",
				page: "2",
				limit: "25",
			});
			assert.strictEqual(filterCustom.status, "pending");
			assert.strictEqual(filterCustom.assetType, "room");
			assert.strictEqual(filterCustom.search, "Divisi TI");
			assert.strictEqual(filterCustom.page, 2);
			assert.strictEqual(filterCustom.limit, 25);

			// Test actual search query with UUID pattern and terms
			const testSearchBooking = await BookingService.createBookingRequest({
				assetId: testRoom.id,
				requesterName: "Pemohon Search Test",
				requesterEmail: "searchtest@example.com",
				requesterPhone: "081211112222",
				requesterOrganization: "Biro Perencanaan",
				purpose: "Uji Pencarian UUID dan Kata Kunci",
				attendance: 5,
				startDate: new Date("2026-09-25T08:00:00+07:00"),
				endDate: new Date("2026-09-25T10:00:00+07:00"),
				timezone: "Asia/Jakarta",
			});

			const term = `%${testSearchBooking.id}%`;
			const searchResults = await db
				.select({
					id: bookings.id,
					requesterName: bookings.requesterName,
				})
				.from(bookings)
				.innerJoin(assets, eq(bookings.assetId, assets.id))
				.where(
					or(
						ilike(bookings.requesterName, term),
						ilike(bookings.requesterEmail, term),
						ilike(bookings.requesterOrganization, term),
						ilike(bookings.purpose, term),
						ilike(assets.name, term),
						ilike(bookings.groupId, term),
						sql`CAST(${bookings.id} AS TEXT) ILIKE ${term}`,
					),
				);
			assert.ok(searchResults.length >= 1);
			assert.strictEqual(searchResults[0].id, testSearchBooking.id);
		},
	);

	await t.test(
		"OPS-02: Calendar Events Query (Bookings & Closures)",
		async () => {
			// Add a closure date to testRoom
			const closureDate = new Date("2026-09-20T00:00:00+07:00");
			const [closure] = await db
				.insert(assetClosures)
				.values({
					assetId: testRoom.id,
					date: closureDate,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			// Query closures for September 2026
			const closuresInRange = await db
				.select()
				.from(assetClosures)
				.where(
					and(
						eq(assetClosures.assetId, testRoom.id),
						eq(assetClosures.date, closureDate),
					),
				);

			assert.strictEqual(closuresInRange.length, 1);
			assert.strictEqual(closuresInRange[0].id, closure.id);
		},
	);

	await t.test("OPS-04: System Audit History Query & Details", async () => {
		// Test audit filter schema
		const auditFilter = AdminAuditLogsFilterSchema.parse({
			action: "booking.approve",
			entityType: "booking",
			page: 1,
			limit: 10,
		});

		assert.strictEqual(auditFilter.action, "booking.approve");
		assert.strictEqual(auditFilter.entityType, "booking");

		// Record custom audit event
		const customAudit = await recordAuditEvent(db, {
			actorId: testAdminId,
			actorType: "user",
			action: "asset.update",
			entityType: "asset",
			entityId: testRoom.id,
			metadata: {
				field: "capacity",
				oldValue: 20,
				newValue: 25,
			},
		});

		assert.ok(customAudit);
		assert.strictEqual(customAudit.action, "asset.update");
		assert.strictEqual(customAudit.entityId, testRoom.id);
	});
});
