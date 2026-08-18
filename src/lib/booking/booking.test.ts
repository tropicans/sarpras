import assert from "node:assert";
import test from "node:test";

process.env.NODE_ENV = "test";

import { and, eq, like } from "drizzle-orm";
import { db } from "../../db/client.server";
import { assets, auditLogs, bookings } from "../../db/schema";
import { getAuditLogsForEntity } from "../audit/audit.server";
import {
	getJakartaDateKey,
	getJakartaDayOfWeek,
	getJakartaTimeString,
} from "../timezone/datetime";
import {
	checkRoomOverlap,
	validateAssetClosures,
	validateOperatingHours,
	validateRoomCapacity,
} from "./availability";
import { BookingService } from "./service.server";
import {
	canTransition,
	getAllowedNextStatuses,
	validateBookingTransition,
} from "./state-machine";
import { BookingStatusSchema, RejectBookingInputSchema } from "./types";

test("Wave 1: Booking State Machine & Domain Logic", async (t) => {
	await t.test("D-05: State Machine Lifecycle Transitions", () => {
		assert.strictEqual(canTransition("pending", "approved"), true);
		assert.strictEqual(canTransition("pending", "rejected"), true);
		assert.strictEqual(canTransition("pending", "cancelled"), true);
		assert.deepStrictEqual(getAllowedNextStatuses("pending"), [
			"approved",
			"rejected",
			"cancelled",
		]);

		assert.strictEqual(canTransition("approved", "cancelled"), true);
		assert.strictEqual(canTransition("approved", "pending"), false);
		assert.strictEqual(canTransition("approved", "rejected"), false);
		assert.deepStrictEqual(getAllowedNextStatuses("approved"), ["cancelled"]);

		assert.strictEqual(canTransition("rejected", "pending"), false);
		assert.strictEqual(canTransition("rejected", "approved"), false);
		assert.strictEqual(canTransition("rejected", "cancelled"), false);
		assert.deepStrictEqual(getAllowedNextStatuses("rejected"), []);

		assert.strictEqual(canTransition("cancelled", "pending"), false);
		assert.strictEqual(canTransition("cancelled", "approved"), false);
		assert.strictEqual(canTransition("cancelled", "rejected"), false);
		assert.deepStrictEqual(getAllowedNextStatuses("cancelled"), []);
	});

	await t.test("D-06: Rejection Reason Validation", () => {
		assert.doesNotThrow(() => {
			validateBookingTransition(
				"pending",
				"rejected",
				"Ruangan sedang dalam perbaikan",
			);
		});

		assert.throws(() => {
			validateBookingTransition("pending", "rejected", "");
		}, /Alasan penolakan/);

		assert.throws(() => {
			validateBookingTransition("pending", "rejected", "    ");
		}, /Alasan penolakan/);

		assert.throws(() => {
			validateBookingTransition("rejected", "approved");
		}, /Perubahan status tidak valid/);
	});

	await t.test("Zod Schemas Validation", () => {
		assert.strictEqual(BookingStatusSchema.safeParse("pending").success, true);
		assert.strictEqual(BookingStatusSchema.safeParse("approved").success, true);
		assert.strictEqual(BookingStatusSchema.safeParse("rejected").success, true);
		assert.strictEqual(
			BookingStatusSchema.safeParse("cancelled").success,
			true,
		);
		assert.strictEqual(BookingStatusSchema.safeParse("unknown").success, false);

		const validReject = RejectBookingInputSchema.safeParse({
			bookingId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			rejectionReason: "Jadwal bertabrakan",
		});
		assert.strictEqual(validReject.success, true);

		const invalidReject = RejectBookingInputSchema.safeParse({
			bookingId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			rejectionReason: "  ",
		});
		assert.strictEqual(invalidReject.success, false);
	});
});

test("Wave 1: Timezone Normalization & Operating Availability", async (t) => {
	await t.test("D-03: Asia/Jakarta Timezone Normalization", () => {
		const utcDate = new Date("2026-08-17T01:00:00.000Z");
		assert.strictEqual(getJakartaTimeString(utcDate), "08:00");
		assert.strictEqual(getJakartaDateKey(utcDate), "2026-08-17");
		assert.strictEqual(getJakartaDayOfWeek(utcDate), 1);

		const lateUtc = new Date("2026-08-17T23:00:00.000Z");
		assert.strictEqual(getJakartaDateKey(lateUtc), "2026-08-18");
		assert.strictEqual(getJakartaTimeString(lateUtc), "06:00");
		assert.strictEqual(getJakartaDayOfWeek(lateUtc), 2);
	});

	await t.test("D-11: Room Operating Hours Validation", () => {
		const operatingSchedules = [
			{ dayOfWeek: 1, openTime: "08:00", closeTime: "17:00" },
			{ dayOfWeek: 2, openTime: "08:00", closeTime: "17:00" },
		];

		const validStart = new Date("2026-08-17T02:00:00.000Z");
		const validEnd = new Date("2026-08-17T08:00:00.000Z");
		const validResult = validateOperatingHours(
			validStart,
			validEnd,
			operatingSchedules,
		);
		assert.strictEqual(validResult.valid, true);

		const earlyStart = new Date("2026-08-17T00:00:00.000Z");
		const earlyEnd = new Date("2026-08-17T03:00:00.000Z");
		const earlyResult = validateOperatingHours(
			earlyStart,
			earlyEnd,
			operatingSchedules,
		);
		assert.strictEqual(earlyResult.valid, false);

		const lateStart = new Date("2026-08-17T03:00:00.000Z");
		const lateEnd = new Date("2026-08-17T11:00:00.000Z");
		const lateResult = validateOperatingHours(
			lateStart,
			lateEnd,
			operatingSchedules,
		);
		assert.strictEqual(lateResult.valid, false);

		const sundayStart = new Date("2026-08-16T02:00:00.000Z");
		const sundayEnd = new Date("2026-08-16T05:00:00.000Z");
		const sundayResult = validateOperatingHours(
			sundayStart,
			sundayEnd,
			operatingSchedules,
		);
		assert.strictEqual(sundayResult.valid, false);
	});

	await t.test("D-11: Asset Closures Validation", () => {
		const closures = [{ date: new Date("2026-08-17T00:00:00.000Z") }];

		const bookingStart = new Date("2026-08-17T02:00:00.000Z");
		const bookingEnd = new Date("2026-08-17T05:00:00.000Z");
		const closureResult = validateAssetClosures(
			bookingStart,
			bookingEnd,
			closures,
		);
		assert.strictEqual(closureResult.valid, false);

		const openStart = new Date("2026-08-18T02:00:00.000Z");
		const openEnd = new Date("2026-08-18T05:00:00.000Z");
		const openResult = validateAssetClosures(openStart, openEnd, closures);
		assert.strictEqual(openResult.valid, true);
	});

	await t.test("D-04 & D-10: Room Overlap & Exclusivity", () => {
		const existingApproved = [
			{
				id: "booking-1",
				startDate: new Date("2026-08-18T02:00:00.000Z"),
				endDate: new Date("2026-08-18T05:00:00.000Z"),
			},
		];

		const overlapRes = checkRoomOverlap(
			existingApproved,
			new Date("2026-08-18T03:00:00.000Z"),
			new Date("2026-08-18T07:00:00.000Z"),
		);
		assert.strictEqual(overlapRes.available, false);
		assert.strictEqual(overlapRes.conflictingBookingId, "booking-1");

		const nonOverlapRes = checkRoomOverlap(
			existingApproved,
			new Date("2026-08-18T06:00:00.000Z"),
			new Date("2026-08-18T08:00:00.000Z"),
		);
		assert.strictEqual(nonOverlapRes.available, true);
	});

	await t.test("D-10: Room Capacity Validation", () => {
		assert.strictEqual(validateRoomCapacity(20, 25).valid, true);
		assert.strictEqual(validateRoomCapacity(25, 25).valid, true);
		assert.strictEqual(validateRoomCapacity(30, 25).valid, false);
		assert.strictEqual(validateRoomCapacity(0, 25).valid, false);
	});
});

test("Wave 2 & Wave 3: Transactional Booking Service, Concurrency & Audit Trail", async (t) => {
	const prefix = "test-bkg-";
	const savedAdminTarget = process.env.FONNTE_ADMIN_TARGET;
	delete process.env.FONNTE_ADMIN_TARGET;

	const cleanup = async () => {
		await db.delete(auditLogs).where(like(auditLogs.actorId, `${prefix}%`));
		await db
			.delete(bookings)
			.where(like(bookings.requesterEmail, `${prefix}%`));
		await db.delete(assets).where(like(assets.name, `${prefix}%`));
	};

	await cleanup();

	await t.test(
		"D-09 & D-12: Dormitory Shared Capacity Multi-Booking Aggregation",
		async () => {
			const [dorm] = await db
				.insert(assets)
				.values({
					name: `${prefix}Dormitory Alpha`,
					type: "dormitory",
					capacity: 10,
				})
				.returning();

			// Booking 1: Aug 20 to Aug 23, 4 guests -> Approved
			const b1 = await BookingService.createBookingRequest({
				assetId: dorm.id,
				requesterName: "User 1",
				requesterEmail: `${prefix}user1@example.com`,
				attendance: 4,
				startDate: new Date("2026-08-20T00:00:00.000Z"),
				endDate: new Date("2026-08-23T00:00:00.000Z"),
				timezone: "Asia/Jakarta",
				letterFileName: "surat_tugas_user1.pdf",
				letterFileUrl: "/uploads/letters/surat_tugas_user1.pdf",
			});
			await BookingService.approveBooking(b1.id, `${prefix}admin-1`);

			// Booking 2: Aug 21 to Aug 24, 4 guests -> Approved
			const b2 = await BookingService.createBookingRequest({
				assetId: dorm.id,
				requesterName: "User 2",
				requesterEmail: `${prefix}user2@example.com`,
				attendance: 4,
				startDate: new Date("2026-08-21T00:00:00.000Z"),
				endDate: new Date("2026-08-24T00:00:00.000Z"),
				timezone: "Asia/Jakarta",
				letterFileName: "surat_tugas_user2.pdf",
				letterFileUrl: "/uploads/letters/surat_tugas_user2.pdf",
			});
			await BookingService.approveBooking(b2.id, `${prefix}admin-1`);

			// Booking 3: Exceeds capacity
			await assert.rejects(
				async () => {
					await BookingService.createBookingRequest({
						assetId: dorm.id,
						requesterName: "User 3",
						requesterEmail: `${prefix}user3@example.com`,
						attendance: 3,
						startDate: new Date("2026-08-22T00:00:00.000Z"),
						endDate: new Date("2026-08-25T00:00:00.000Z"),
						timezone: "Asia/Jakarta",
						letterFileName: "surat_tugas_user3.pdf",
						letterFileUrl: "/uploads/letters/surat_tugas_user3.pdf",
					});
				},
				(err: any) => {
					assert.strictEqual(err.statusCode, 409);
					assert.match(err.message, /Kapasitas asrama/);
					return true;
				},
			);
		},
	);

	await t.test(
		"D-01 & D-02 & D-08 & OPS-03: Room Approval, Rejection & Atomic Audit Logging",
		async () => {
			const [room] = await db
				.insert(assets)
				.values({
					name: `${prefix}Meeting Room Beta`,
					type: "room",
					capacity: 20,
				})
				.returning();

			const slotStart = new Date("2026-08-28T02:00:00.000Z");
			const slotEnd = new Date("2026-08-28T05:00:00.000Z");

			// 1. Create booking A
			const reqA = await BookingService.createBookingRequest({
				assetId: room.id,
				requesterName: "Team A",
				requesterEmail: `${prefix}teama@example.com`,
				attendance: 10,
				startDate: slotStart,
				endDate: slotEnd,
				timezone: "Asia/Jakarta",
				letterFileName: "surat_teama.pdf",
				letterFileUrl: "/uploads/letters/surat_teama.pdf",
			});

			// Verify booking.create audit event
			const logsAfterCreate = await getAuditLogsForEntity("booking", reqA.id);
			const createLog = logsAfterCreate.find((l) => l.action === "booking.create");
			assert.ok(createLog);
			assert.strictEqual(createLog.metadata.newStatus, "pending");

			// 2. Create booking B
			const reqB = await BookingService.createBookingRequest({
				assetId: room.id,
				requesterName: "Team B",
				requesterEmail: `${prefix}teamb@example.com`,
				attendance: 15,
				startDate: slotStart,
				endDate: slotEnd,
				timezone: "Asia/Jakarta",
				letterFileName: "surat_teamb.pdf",
				letterFileUrl: "/uploads/letters/surat_teamb.pdf",
			});

			// 3. Approve booking A
			await BookingService.approveBooking(reqA.id, `${prefix}admin-1`);

			// Verify booking.approve audit event
			const logsAfterApprove = await getAuditLogsForEntity("booking", reqA.id);
			const approveLog = logsAfterApprove.find((l) => l.action === "booking.approve");
			assert.ok(approveLog);
			assert.strictEqual(approveLog.metadata.oldStatus, "pending");
			assert.strictEqual(approveLog.metadata.newStatus, "approved");

			// 4. Attempting to approve booking B must fail with 409 Conflict
			await assert.rejects(
				async () => {
					await BookingService.approveBooking(reqB.id, `${prefix}admin-1`);
				},
				(err: any) => {
					assert.strictEqual(err.statusCode, 409);
					return true;
				},
			);

			// 5. Reject booking B with reason
			await BookingService.rejectBooking(
				reqB.id,
				`${prefix}admin-1`,
				"Slot waktu sudah terisi oleh permohonan lain",
			);

			// Verify booking.reject audit event
			const logsB = await getAuditLogsForEntity("booking", reqB.id);
			const rejectLog = logsB.find((l) => l.action === "booking.reject");
			assert.ok(rejectLog);
			assert.strictEqual(
				rejectLog.metadata.rejectionReason,
				"Slot waktu sudah terisi oleh permohonan lain",
			);
		},
	);

	await t.test("D-07 & D-08: Cancellation and Audit Trail", async () => {
		const [room] = await db
			.insert(assets)
			.values({
				name: `${prefix}Meeting Room Gamma`,
				type: "room",
				capacity: 15,
			})
			.returning();

		const booking = await BookingService.createBookingRequest({
			assetId: room.id,
			requesterName: "User Gamma",
			requesterEmail: `${prefix}gamma@example.com`,
			attendance: 5,
			startDate: new Date("2026-08-29T02:00:00.000Z"),
			endDate: new Date("2026-08-29T05:00:00.000Z"),
			timezone: "Asia/Jakarta",
			letterFileName: "surat_gamma.pdf",
			letterFileUrl: "/uploads/letters/surat_gamma.pdf",
		});

		await assert.rejects(
			async () => {
				await BookingService.cancelBookingByPublicReference(
					booking.id,
					`${prefix}gamma@example.com`,
					"",
				);
			},
			{
				message: /Alasan pembatalan wajib diisi/,
			},
		);

		const cancelled = await BookingService.cancelBookingByPublicReference(
			booking.id,
			`${prefix}gamma@example.com`,
			"Acara dibatalkan",
		);
		assert.strictEqual(cancelled.status, "cancelled");

		const logs = await getAuditLogsForEntity("booking", booking.id);
		const cancelLog = logs.find((l) => l.action === "booking.cancel");
		assert.ok(cancelLog);
		assert.strictEqual(cancelLog.metadata.cancelledVia, "public_reference");
	});

	await cleanup();
	if (savedAdminTarget !== undefined) {
		process.env.FONNTE_ADMIN_TARGET = savedAdminTarget;
	}
});

test("Phase 4 Wave 1: Public Discovery, Schedule Projections & Pre-flight Availability", async (t) => {
	const prefix = "test-pub-";

	const cleanup = async () => {
		await db.delete(auditLogs).where(like(auditLogs.actorId, `${prefix}%`));
		await db
			.delete(bookings)
			.where(like(bookings.requesterEmail, `${prefix}%`));
		await db.delete(assets).where(like(assets.name, `${prefix}%`));
	};

	await cleanup();

	await t.test(
		"ASSET-04 & D-01: Privacy-Safe Public Schedule Projections",
		async () => {
			const [room] = await db
				.insert(assets)
				.values({
					name: `${prefix}Auditorium Delta`,
					type: "room",
					capacity: 50,
					status: "active",
				})
				.returning();

			// Create and approve a booking with confidential requester info
			const bkg = await BookingService.createBookingRequest({
				assetId: room.id,
				requesterName: "Budi confidential",
				requesterEmail: `${prefix}budi@confidential.gov.id`,
				requesterPhone: "081234567890",
				requesterOrganization: "Divisi Rahasia",
				purpose: "Rapat Khusus Tingkat Tinggi",
				attendance: 30,
				startDate: new Date("2026-09-01T02:00:00.000Z"),
				endDate: new Date("2026-09-01T06:00:00.000Z"),
				timezone: "Asia/Jakarta",
			});
			await BookingService.approveBooking(bkg.id, `${prefix}admin`);

			// Query public schedule via server fn handler logic
			const approvedBookings = await db
				.select({
					startDate: bookings.startDate,
					endDate: bookings.endDate,
				})
				.from(bookings)
				.where(
					and(eq(bookings.assetId, room.id), eq(bookings.status, "approved")),
				);

			const projection = approvedBookings.map((b) => ({
				startDate: b.startDate.toISOString(),
				endDate: b.endDate.toISOString(),
				status: "booked" as const,
			}));

			assert.strictEqual(projection.length, 1);
			assert.strictEqual(projection[0].status, "booked");
			assert.strictEqual((projection[0] as any).requesterName, undefined);
			assert.strictEqual((projection[0] as any).requesterEmail, undefined);
			assert.strictEqual((projection[0] as any).requesterPhone, undefined);
			assert.strictEqual(
				(projection[0] as any).requesterOrganization,
				undefined,
			);
			assert.strictEqual((projection[0] as any).purpose, undefined);
		},
	);

	await t.test(
		"BOOK-03 & D-04: Real-Time Availability Pre-flight Checks",
		async () => {
			const [room] = await db
				.insert(assets)
				.values({
					name: `${prefix}Classroom Epsilon`,
					type: "room",
					capacity: 20,
					status: "active",
				})
				.returning();

			// 1. Open slot preflight check -> available: true
			const check1 = await BookingService.checkPreflightAvailability({
				assetId: room.id,
				startDate: new Date("2026-09-02T02:00:00.000Z"),
				endDate: new Date("2026-09-02T05:00:00.000Z"),
				attendance: 15,
			});
			assert.strictEqual(check1.available, true);

			// 2. Capacity exceeded -> available: false
			const checkCap = await BookingService.checkPreflightAvailability({
				assetId: room.id,
				startDate: new Date("2026-09-02T02:00:00.000Z"),
				endDate: new Date("2026-09-02T05:00:00.000Z"),
				attendance: 25,
			});
			assert.strictEqual(checkCap.available, false);
			assert.match(checkCap.reason || "", /kapasitas/i);

			// 3. Create approved booking on slot
			const bkg = await BookingService.createBookingRequest({
				assetId: room.id,
				requesterName: "User 1",
				requesterEmail: `${prefix}u1@example.com`,
				attendance: 10,
				startDate: new Date("2026-09-02T02:00:00.000Z"),
				endDate: new Date("2026-09-02T05:00:00.000Z"),
				timezone: "Asia/Jakarta",
				letterFileName: "surat_u1.pdf",
				letterFileUrl: "/uploads/letters/surat_u1.pdf",
			});
			await BookingService.approveBooking(bkg.id, `${prefix}admin`);

			// 4. Overlapping preflight check -> available: false
			const checkOverlap = await BookingService.checkPreflightAvailability({
				assetId: room.id,
				startDate: new Date("2026-09-02T04:00:00.000Z"),
				endDate: new Date("2026-09-02T07:00:00.000Z"),
				attendance: 10,
			});
			assert.strictEqual(checkOverlap.available, false);
			assert.match(checkOverlap.reason || "", /disetujui|terisi|konflik/i);
		},
	);

	await t.test(
		"BOOK-05 & D-06: Sanitized Public Booking Status Lookup",
		async () => {
			const [room] = await db
				.insert(assets)
				.values({
					name: `${prefix}Meeting Room Zeta`,
					type: "room",
					capacity: 10,
					status: "active",
				})
				.returning();

			const bkg = await BookingService.createBookingRequest({
				assetId: room.id,
				requesterName: "Private Requester",
				requesterEmail: `${prefix}private@example.com`,
				requesterPhone: "0899999999",
				requesterOrganization: "Org Secret",
				purpose: "Private Project Discussion",
				attendance: 5,
				startDate: new Date("2026-09-03T02:00:00.000Z"),
				endDate: new Date("2026-09-03T05:00:00.000Z"),
				timezone: "Asia/Jakarta",
				letterFileName: "surat_rahasia.pdf",
				letterFileUrl: "/uploads/letters/surat_rahasia.pdf",
			});

			// Lookup by ID
			const status = await BookingService.getPublicBookingStatus(bkg.id);
			assert.ok(status);
			assert.strictEqual(status.id, bkg.id);
			assert.strictEqual(status.assetName, `${prefix}Meeting Room Zeta`);
			assert.strictEqual(status.status, "pending");
			assert.strictEqual(status.letterFileName, "surat_rahasia.pdf");
			assert.strictEqual(status.letterFileUrl, "/uploads/letters/surat_rahasia.pdf");
			assert.strictEqual((status as any).requesterName, undefined);
			assert.strictEqual((status as any).requesterEmail, undefined);
			assert.strictEqual((status as any).requesterPhone, undefined);
			assert.strictEqual((status as any).requesterOrganization, undefined);
			assert.strictEqual((status as any).purpose, undefined);

			// Non-existent ID
			const notFound = await BookingService.getPublicBookingStatus(
				"00000000-0000-0000-0000-000000000000",
			);
			assert.strictEqual(notFound, null);
		},
	);

	await cleanup();
});

test("Phase 7 Wave 7: WhatsApp Notification & Integration Triggers (WA-04, WA-05, WA-06, WA-07, WA-08)", async (t) => {
	const prefix = "test-wa-trig-";

	const cleanup = async () => {
		await db
			.delete(auditLogs)
			.where(like(auditLogs.actorId, "system:whatsapp"));
		await db.delete(auditLogs).where(like(auditLogs.actorId, `${prefix}%`));
		await db
			.delete(bookings)
			.where(like(bookings.requesterEmail, `${prefix}%`));
		await db.delete(assets).where(like(assets.name, `${prefix}%`));
	};

	await cleanup();

	const [room] = await db
		.insert(assets)
		.values({
			name: `${prefix}Executive Boardroom`,
			type: "room",
			capacity: 20,
			status: "active",
			location: "Gedung Utama Lt. 3",
		})
		.returning();

	await t.test(
		"WA-04 & WA-07 & WA-08: Booking Creation triggers Requester and Admin WhatsApp notifications",
		async () => {
			process.env.FONNTE_ADMIN_TARGET = "6289999999999";

			const booking = await BookingService.createBookingRequest({
				assetId: room.id,
				requesterName: "Ahmad Dahlan",
				requesterEmail: `${prefix}ahmad@example.com`,
				requesterPhone: "081234567890",
				requesterOrganization: "Pusat Data dan Informasi",
				purpose: "Rapat Koordinasi Infrastruktur",
				attendance: 12,
				startDate: new Date("2026-09-10T02:00:00.000Z"),
				endDate: new Date("2026-09-10T05:00:00.000Z"),
				timezone: "Asia/Jakarta",
				letterFileName: "surat_permohonan_ahmad.pdf",
				letterFileUrl: "/uploads/letters/surat_permohonan_ahmad.pdf",
			});

			assert.ok(booking.id);
			assert.strictEqual(booking.status, "pending");

			// Allow async non-blocking task to write audit logs with resilient polling
			let dispatchLogs: any[] = [];
			for (let i = 0; i < 20; i++) {
				const auditEntries = await getAuditLogsForEntity("booking", booking.id);
				dispatchLogs = auditEntries.filter(
					(l) => l.action === "notification.whatsapp_dispatch",
				);
				if (dispatchLogs.length >= 2) break;
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
			assert.strictEqual(dispatchLogs.length, 2);

			const requesterLog = dispatchLogs.find(
				(l) => (l.metadata as any)?.template === "BOOKING_CREATED_REQUESTER",
			);
			assert.ok(requesterLog);
			assert.strictEqual(
				(requesterLog.metadata as any)?.target,
				"6281234567890",
			);
			assert.strictEqual((requesterLog.metadata as any)?.status, "mock");

			const adminLog = dispatchLogs.find(
				(l) => (l.metadata as any)?.template === "BOOKING_CREATED_ADMIN",
			);
			assert.ok(adminLog);
			assert.strictEqual((adminLog.metadata as any)?.target, "6289999999999");
			assert.strictEqual((adminLog.metadata as any)?.status, "mock");
		},
	);

	await t.test(
		"WA-05: Booking Approval triggers Requester WhatsApp approval notification",
		async () => {
			const booking = await BookingService.createBookingRequest({
				assetId: room.id,
				requesterName: "Siti Rahma",
				requesterEmail: `${prefix}siti@example.com`,
				requesterPhone: "+628111222333",
				purpose: "Workshop UI/UX",
				attendance: 10,
				startDate: new Date("2026-09-11T02:00:00.000Z"),
				endDate: new Date("2026-09-11T05:00:00.000Z"),
				timezone: "Asia/Jakarta",
				letterFileName: "surat_siti.pdf",
				letterFileUrl: "/uploads/letters/surat_siti.pdf",
			});

			await BookingService.approveBooking(
				booking.id,
				`${prefix}admin-approver`,
			);

			let approveDispatch: any = null;
			for (let i = 0; i < 20; i++) {
				const auditEntries = await getAuditLogsForEntity("booking", booking.id);
				approveDispatch = auditEntries.find(
					(l) =>
						l.action === "notification.whatsapp_dispatch" &&
						(l.metadata as any)?.template === "BOOKING_APPROVED",
				);
				if (approveDispatch) break;
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			assert.ok(approveDispatch);
			assert.strictEqual(
				(approveDispatch.metadata as any)?.target,
				"628111222333",
			);
			assert.strictEqual((approveDispatch.metadata as any)?.status, "mock");
		},
	);

	await t.test(
		"WA-06: Booking Rejection triggers Requester WhatsApp rejection notification with reason",
		async () => {
			const booking = await BookingService.createBookingRequest({
				assetId: room.id,
				requesterName: "Hendra Wijaya",
				requesterEmail: `${prefix}hendra@example.com`,
				requesterPhone: "087788990011",
				purpose: "Seminar Internal",
				attendance: 15,
				startDate: new Date("2026-09-12T02:00:00.000Z"),
				endDate: new Date("2026-09-12T05:00:00.000Z"),
				timezone: "Asia/Jakarta",
				letterFileName: "surat_hendra.pdf",
				letterFileUrl: "/uploads/letters/surat_hendra.pdf",
			});

			const rejectionReason =
				"Ruangan digunakan untuk kunjungan tamu kementerian";
			await BookingService.rejectBooking(
				booking.id,
				`${prefix}admin-rejector`,
				rejectionReason,
			);

			let rejectDispatch: any = null;
			for (let i = 0; i < 20; i++) {
				const auditEntries = await getAuditLogsForEntity("booking", booking.id);
				rejectDispatch = auditEntries.find(
					(l) =>
						l.action === "notification.whatsapp_dispatch" &&
						(l.metadata as any)?.template === "BOOKING_REJECTED",
				);
				if (rejectDispatch) break;
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			assert.ok(rejectDispatch);
			assert.strictEqual(
				(rejectDispatch.metadata as any)?.target,
				"6287788990011",
			);
			assert.strictEqual((rejectDispatch.metadata as any)?.status, "mock");
		},
	);

	await t.test(
		"Non-blocking resilience: Missing or null phone does not break booking lifecycle",
		async () => {
			// Create booking with no phone number
			const booking = await BookingService.createBookingRequest({
				assetId: room.id,
				requesterName: "No Phone User",
				requesterEmail: `${prefix}nophone@example.com`,
				requesterPhone: null,
				purpose: "Silent Meeting",
				attendance: 5,
				startDate: new Date("2026-09-13T02:00:00.000Z"),
				endDate: new Date("2026-09-13T05:00:00.000Z"),
				timezone: "Asia/Jakarta",
			});

			assert.strictEqual(booking.status, "pending");

			const approved = await BookingService.approveBooking(
				booking.id,
				`${prefix}admin`,
			);
			assert.strictEqual(approved.status, "approved");

			const cancelled = await BookingService.cancelBooking(
				booking.id,
				`${prefix}admin`,
				"User request",
			);
			assert.strictEqual(cancelled.status, "cancelled");
		},
	);

	await cleanup();
});

test("Phase Multi-Room: Batch / Multi-Room Booking Verification", async (t) => {
	const prefix = "test-multi-room-";

	const cleanup = async () => {
		await db.delete(auditLogs).where(like(auditLogs.actorId, `${prefix}%`));
		await db
			.delete(bookings)
			.where(like(bookings.requesterEmail, `${prefix}%`));
		await db.delete(assets).where(like(assets.name, `${prefix}%`));
	};

	await cleanup();

	// Create test assets
	const [roomA, roomB, roomC] = await db
		.insert(assets)
		.values([
			{
				name: `${prefix}Ruang Seminar Utama`,
				type: "room",
				capacity: 50,
				status: "active",
				location: "Gedung A Lt. 1",
			},
			{
				name: `${prefix}Ruang Breakout A`,
				type: "room",
				capacity: 20,
				status: "active",
				location: "Gedung A Lt. 2",
			},
			{
				name: `${prefix}Ruang Breakout B`,
				type: "room",
				capacity: 15,
				status: "active",
				location: "Gedung A Lt. 2",
			},
		])
		.returning();

	await t.test(
		"createBatchBookingRequest creates all rooms atomically with shared groupId and saves attached PDF letter",
		async () => {
			const start1 = new Date("2026-10-10T02:00:00.000Z");
			const end1 = new Date("2026-10-10T06:00:00.000Z");

			const result = await BookingService.createBatchBookingRequest({
				items: [
					{
						assetId: roomA.id,
						startDate: start1,
						endDate: end1,
						attendance: 35,
					},
					{
						assetId: roomB.id,
						startDate: start1,
						endDate: end1,
						attendance: 15,
					},
				],
				requesterName: "Dr. Multi Room",
				requesterEmail: `${prefix}multi@example.com`,
				requesterPhone: "08123456789",
				requesterOrganization: "Pusbang ASN",
				purpose: "Lokakarya Nasional Multi Ruang",
				letterFileName: "surat_permohonan_multi.pdf",
				letterFileUrl: "/uploads/letters/surat_permohonan_multi.pdf",
				timezone: "Asia/Jakarta",
			});

			assert.ok(result.groupId.startsWith("GRP-"));
			assert.strictEqual(result.bookings.length, 2);
			assert.strictEqual(result.bookings[0].groupId, result.groupId);
			assert.strictEqual(result.bookings[1].groupId, result.groupId);
			assert.strictEqual(result.bookings[0].status, "pending");
			assert.strictEqual(result.bookings[1].status, "pending");
			assert.strictEqual(
				result.bookings[0].letterFileName,
				"surat_permohonan_multi.pdf",
			);
			assert.strictEqual(
				result.bookings[0].letterFileUrl,
				"/uploads/letters/surat_permohonan_multi.pdf",
			);

			// Query public status by groupId
			const groupStatus = await BookingService.getPublicBookingStatus(
				result.groupId,
			);
			assert.ok(groupStatus);
			assert.strictEqual(groupStatus.groupId, result.groupId);
			assert.strictEqual(groupStatus.isGroup, true);
			assert.strictEqual(groupStatus.items?.length, 2);
			assert.strictEqual(
				groupStatus.letterFileName,
				"surat_permohonan_multi.pdf",
			);
			assert.strictEqual(
				groupStatus.letterFileUrl,
				"/uploads/letters/surat_permohonan_multi.pdf",
			);

			// Query public status by child booking id
			const childStatus = await BookingService.getPublicBookingStatus(
				result.bookings[0].id,
			);
			assert.ok(childStatus);
			assert.strictEqual(childStatus.groupId, result.groupId);
			assert.strictEqual(childStatus.items?.length, 2);
			assert.strictEqual(
				childStatus.letterFileName,
				"surat_permohonan_multi.pdf",
			);
			assert.strictEqual(
				childStatus.letterFileUrl,
				"/uploads/letters/surat_permohonan_multi.pdf",
			);
		},
	);

	await t.test(
		"createBatchBookingRequest rolls back all items atomically on conflict or capacity error",
		async () => {
			const start = new Date("2026-10-11T02:00:00.000Z");
			const end = new Date("2026-10-11T06:00:00.000Z");

			// 1. Create and approve booking for roomA
			const existing = await BookingService.createBookingRequest({
				assetId: roomA.id,
				requesterName: "Prior Owner",
				requesterEmail: `${prefix}prior@example.com`,
				requesterPhone: "0811111111",
				purpose: "Existing Booking",
				attendance: 10,
				startDate: start,
				endDate: end,
				timezone: "Asia/Jakarta",
				letterFileName: "surat_prior.pdf",
				letterFileUrl: "/uploads/letters/surat_prior.pdf",
			});
			await BookingService.approveBooking(existing.id, `${prefix}admin`);

			// 2. Attempt batch booking including roomA (conflict) and roomC (available)
			await assert.rejects(
				async () => {
					await BookingService.createBatchBookingRequest({
						items: [
							{
								assetId: roomC.id, // valid
								startDate: start,
								endDate: end,
								attendance: 10,
							},
							{
								assetId: roomA.id, // conflicts with approved
								startDate: start,
								endDate: end,
								attendance: 10,
							},
						],
						requesterName: "Failed Batch",
						requesterEmail: `${prefix}failed@example.com`,
						purpose: "Should rollback everything",
						timezone: "Asia/Jakarta",
						letterFileName: "surat_failed.pdf",
						letterFileUrl: "/uploads/letters/surat_failed.pdf",
					});
				},
				{
					message: /sudah disetujui/i,
				},
			);

			// Verify roomC was NOT booked (atomicity)
			const roomCBookings = await db
				.select()
				.from(bookings)
				.where(like(bookings.requesterEmail, `${prefix}failed%`));
			assert.strictEqual(roomCBookings.length, 0);
		},
	);

	await t.test(
		"batchApproveBookings approves all items in group atomically",
		async () => {
			const start = new Date("2026-10-12T02:00:00.000Z");
			const end = new Date("2026-10-12T06:00:00.000Z");

			const result = await BookingService.createBatchBookingRequest({
				items: [
					{
						assetId: roomB.id,
						startDate: start,
						endDate: end,
						attendance: 10,
					},
					{
						assetId: roomC.id,
						startDate: start,
						endDate: end,
						attendance: 10,
					},
				],
				requesterName: "Batch Approval Tester",
				requesterEmail: `${prefix}batchapprove@example.com`,
				purpose: "Batch Approval Event",
				timezone: "Asia/Jakarta",
				letterFileName: "surat_batch.pdf",
				letterFileUrl: "/uploads/letters/surat_batch.pdf",
			});

			const approved = await BookingService.batchApproveBookings(
				result.groupId,
				`${prefix}admin`,
			);

			assert.strictEqual(approved.length, 2);
			assert.ok(approved.every((b) => b.status === "approved"));
		},
	);

	await t.test(
		"createBatchBookingRequest allows booking the same asset on multiple distinct dates in a single request",
		async () => {
			// Session 1: 19 Oct 2026
			const start1 = new Date("2026-10-19T02:00:00.000Z");
			const end1 = new Date("2026-10-19T06:00:00.000Z");
			// Session 2: 25 Oct 2026 (same roomA - Auditorium)
			const start2 = new Date("2026-10-25T02:00:00.000Z");
			const end2 = new Date("2026-10-25T06:00:00.000Z");

			const result = await BookingService.createBatchBookingRequest({
				items: [
					{
						assetId: roomA.id,
						startDate: start1,
						endDate: end1,
						attendance: 40,
					},
					{
						assetId: roomA.id, // Same Auditorium on another date!
						startDate: start2,
						endDate: end2,
						attendance: 40,
					},
				],
				requesterName: "Dr. Multi Date",
				requesterEmail: `${prefix}multidate@example.com`,
				purpose: "Lokakarya 2 Sesi Auditorium",
				timezone: "Asia/Jakarta",
				letterFileName: "surat_lokakarya.pdf",
				letterFileUrl: "/uploads/letters/surat_lokakarya.pdf",
			});

			assert.ok(result.groupId.startsWith("GRP-"));
			assert.strictEqual(result.bookings.length, 2);
			assert.strictEqual(result.bookings[0].assetId, roomA.id);
			assert.strictEqual(result.bookings[1].assetId, roomA.id);
			assert.strictEqual(result.bookings[0].groupId, result.groupId);
			assert.strictEqual(result.bookings[1].groupId, result.groupId);
		},
	);

	await cleanup();
});


