import { and, asc, eq, gt, lt, ne } from "drizzle-orm";
import { db } from "../../db/client.server";
import {
	assetAvailability,
	assetClosures,
	assets,
	bookings,
} from "../../db/schema";
import { recordAuditEvent } from "../audit/audit.server";
import { normalizeDate } from "../timezone/datetime";
import {
	dispatchBookingApprovedNotifications,
	dispatchBookingCancelledNotifications,
	dispatchBookingCreatedNotifications,
	dispatchBookingRejectedNotifications,
	safeDispatchBookingNotifications,
} from "../notifications/service.server";
import {
	checkRoomOverlap,
	validateAssetClosures,
	validateOperatingHours,
	validateRoomCapacity,
} from "./availability";
import { checkDormitoryCapacity } from "./dormitory";
import { validateBookingTransition } from "./state-machine";
import type {
	BookingStatus,
	CreateBatchBookingInput,
	CreateBookingInput,
} from "./types";

export class BookingConflictError extends Error {
	public readonly statusCode = 409;
	public readonly details?: Record<string, unknown>;

	constructor(message: string, details?: Record<string, unknown>) {
		super(message);
		this.name = "BookingConflictError";
		this.details = details;
	}
}

export class BookingNotFoundError extends Error {
	public readonly statusCode = 404;

	constructor(message: string = "Permohonan peminjaman tidak ditemukan") {
		super(message);
		this.name = "BookingNotFoundError";
	}
}

export class BookingService {
	/**
	 * Creates a new booking request within a transaction with row-level locking on the asset.
	 */
	static async createBookingRequest(
		input: CreateBookingInput,
		actorId?: string,
	) {
		const startDate = normalizeDate(input.startDate);
		const endDate = normalizeDate(input.endDate);
		const attendance = input.attendance ?? 1;

		const { newBooking, asset } = await db.transaction(async (tx) => {
			// 1. Lock the asset row using SELECT FOR UPDATE (D-01)
			const [asset] = await tx
				.select()
				.from(assets)
				.where(eq(assets.id, input.assetId))
				.for("update");

			if (!asset) {
				throw new BookingNotFoundError("Aset yang dipilih tidak ditemukan");
			}

			if (asset.status !== "active") {
				throw new BookingConflictError(
					`Aset "${asset.name}" saat ini tidak aktif (${asset.status}) dan tidak dapat dipinjam.`,
				);
			}

			// 2. Asset closures check (applies to both rooms and dormitories - D-11)
			const closures = await tx
				.select()
				.from(assetClosures)
				.where(eq(assetClosures.assetId, asset.id));

			const closureCheck = validateAssetClosures(startDate, endDate, closures);
			if (!closureCheck.valid) {
				throw new BookingConflictError(
					closureCheck.reason || "Aset sedang ditutup pada jadwal tersebut.",
					{ conflictingDate: closureCheck.conflictingDate },
				);
			}

			// 3. Asset-specific availability checks
			if (
				asset.type === "room" ||
				asset.type === "vehicle" ||
				asset.type === "field"
			) {
				// Capacity / Pax check
				const capCheck = validateRoomCapacity(attendance, asset.capacity);
				if (!capCheck.valid) {
					throw new BookingConflictError(
						capCheck.reason || "Jumlah peserta melebihi kapasitas fasilitas.",
					);
				}

				// Operating hours check (if configured)
				const schedules = await tx
					.select()
					.from(assetAvailability)
					.where(eq(assetAvailability.assetId, asset.id));

				if (schedules.length > 0) {
					const hoursCheck = validateOperatingHours(
						startDate,
						endDate,
						schedules,
					);
					if (!hoursCheck.valid) {
						throw new BookingConflictError(
							hoursCheck.reason ||
								"Jadwal peminjaman di luar jam operasional fasilitas.",
						);
					}
				}

				// Overlap check against existing APPROVED bookings
				const approvedBookings = await tx
					.select({
						id: bookings.id,
						startDate: bookings.startDate,
						endDate: bookings.endDate,
					})
					.from(bookings)
					.where(
						and(
							eq(bookings.assetId, asset.id),
							eq(bookings.status, "approved"),
							lt(bookings.startDate, endDate),
							gt(bookings.endDate, startDate),
						),
					);

				const overlapCheck = checkRoomOverlap(
					approvedBookings,
					startDate,
					endDate,
				);
				if (!overlapCheck.available) {
					throw new BookingConflictError(
						overlapCheck.conflictReason ||
							"Fasilitas sudah terisi untuk jadwal tersebut.",
						overlapCheck.details,
					);
				}
			} else if (asset.type === "dormitory" || asset.type === "equipment") {
				// Dormitory / Equipment shared capacity check
				const dormCheck = await checkDormitoryCapacity(
					tx,
					asset.id,
					asset.capacity,
					startDate,
					endDate,
					attendance,
				);

				if (!dormCheck.available) {
					throw new BookingConflictError(
						dormCheck.conflictReason ||
							"Kapasitas fasilitas penuh pada rentang waktu tersebut.",
						dormCheck.details,
					);
				}
			}

			// 4. Insert new booking with pending status
			const [newBooking] = await tx
				.insert(bookings)
				.values({
					assetId: input.assetId,
					groupId: input.groupId || null,
					requesterName: input.requesterName,
					requesterEmail: input.requesterEmail,
					requesterPhone: input.requesterPhone,
					requesterOrganization: input.requesterOrganization,
					purpose: input.purpose,
					attendance,
					roomLayout: input.roomLayout || null,
					startDate,
					endDate,
					timezone: input.timezone || "Asia/Jakarta",
					status: "pending",
					letterFileName: input.letterFileName || null,
					letterFileUrl: input.letterFileUrl || null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			// 5. Record atomic audit event (D-08, OPS-03)
			await recordAuditEvent(tx, {
				actorId: actorId || input.requesterEmail,
				actorType: actorId ? "user" : "system",
				action: "booking.create",
				entityType: "booking",
				entityId: newBooking.id,
				metadata: {
					groupId: input.groupId || null,
					newStatus: "pending",
					assetId: input.assetId,
					assetType: asset.type,
					requesterEmail: input.requesterEmail,
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					attendance,
				},
			});

			return { newBooking, asset };
		});

		// 6. Post-commit asynchronous dual-channel notification dispatches (NOTIF-01, NOTIF-02)
		void safeDispatchBookingNotifications(() =>
			dispatchBookingCreatedNotifications({
				bookingId: newBooking.id,
				bookingRef: newBooking.groupId || newBooking.id,
				requesterName: newBooking.requesterName,
				requesterEmail: newBooking.requesterEmail,
				requesterPhone: newBooking.requesterPhone,
				requesterOrganization: newBooking.requesterOrganization,
				assetName: asset.name,
				assetLocation: asset.location,
				startDate: newBooking.startDate,
				endDate: newBooking.endDate,
				attendance: newBooking.attendance ?? 1,
				purpose: newBooking.purpose,
			}),
		);

		return newBooking;
	}

	/**
	 * Creates a batch of room bookings sharing a common groupId within a single transaction.
	 * Authoritatively locks all selected assets and validates availability atomically.
	 */
	static async createBatchBookingRequest(
		input: CreateBatchBookingInput,
		actorId?: string,
	) {
		const groupId = `GRP-${crypto.randomUUID().slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

		const { createdBookings, assetMap } = await db.transaction(async (tx) => {
			const createdBookings = [];
			const assetMap = new Map<string, typeof assets.$inferSelect>();

			// 1. Check intra-batch duplicate assets with overlapping schedules
			for (let i = 0; i < input.items.length; i++) {
				for (let j = i + 1; j < input.items.length; j++) {
					const itemA = input.items[i];
					const itemB = input.items[j];
					if (itemA.assetId === itemB.assetId) {
						const startA = normalizeDate(itemA.startDate);
						const endA = normalizeDate(itemA.endDate);
						const startB = normalizeDate(itemB.startDate);
						const endB = normalizeDate(itemB.endDate);

						if (startA < endB && endA > startB) {
							throw new BookingConflictError(
								"Permohonan memilih fasilitas yang sama dengan jadwal yang saling bertumpuk.",
							);
						}
					}
				}
			}

			// 2. Lock and validate each asset
			for (const item of input.items) {
				const startDate = normalizeDate(item.startDate);
				const endDate = normalizeDate(item.endDate);
				const attendance = item.attendance ?? 1;

				// Lock asset
				const [asset] = await tx
					.select()
					.from(assets)
					.where(eq(assets.id, item.assetId))
					.for("update");

				if (!asset) {
					throw new BookingNotFoundError(`Aset (${item.assetId}) tidak ditemukan.`);
				}

				assetMap.set(asset.id, asset);

				if (asset.status !== "active") {
					throw new BookingConflictError(
						`Aset "${asset.name}" saat ini tidak aktif (${asset.status}) dan tidak dapat dipinjam.`,
					);
				}

				// Closures
				const closures = await tx
					.select()
					.from(assetClosures)
					.where(eq(assetClosures.assetId, asset.id));

				const closureCheck = validateAssetClosures(startDate, endDate, closures);
				if (!closureCheck.valid) {
					throw new BookingConflictError(
						`Aset "${asset.name}": ` +
							(closureCheck.reason || "Aset sedang ditutup pada jadwal tersebut."),
						{ conflictingDate: closureCheck.conflictingDate },
					);
				}

				// Room/vehicle/field validation
				if (
					asset.type === "room" ||
					asset.type === "vehicle" ||
					asset.type === "field"
				) {
					const capCheck = validateRoomCapacity(attendance, asset.capacity);
					if (!capCheck.valid) {
						throw new BookingConflictError(
							`Aset "${asset.name}": ` +
								(capCheck.reason || "Jumlah peserta melebihi kapasitas fasilitas."),
						);
					}

					const schedules = await tx
						.select()
						.from(assetAvailability)
						.where(eq(assetAvailability.assetId, asset.id));

					if (schedules.length > 0) {
						const hoursCheck = validateOperatingHours(
							startDate,
							endDate,
							schedules,
						);
						if (!hoursCheck.valid) {
							throw new BookingConflictError(
								`Aset "${asset.name}": ` +
									(hoursCheck.reason ||
										"Jadwal peminjaman di luar jam operasional fasilitas."),
							);
						}
					}

					const approvedBookings = await tx
						.select({
							id: bookings.id,
							startDate: bookings.startDate,
							endDate: bookings.endDate,
						})
						.from(bookings)
						.where(
							and(
								eq(bookings.assetId, asset.id),
								eq(bookings.status, "approved"),
								lt(bookings.startDate, endDate),
								gt(bookings.endDate, startDate),
							),
						);

					const overlapCheck = checkRoomOverlap(
						approvedBookings,
						startDate,
						endDate,
					);
					if (!overlapCheck.available) {
						throw new BookingConflictError(
							`Aset "${asset.name}": ` +
								(overlapCheck.conflictReason ||
									"Fasilitas sudah terisi untuk jadwal tersebut."),
							overlapCheck.details,
						);
					}
				} else if (asset.type === "dormitory" || asset.type === "equipment") {
					const dormCheck = await checkDormitoryCapacity(
						tx,
						asset.id,
						asset.capacity,
						startDate,
						endDate,
						attendance,
					);

					if (!dormCheck.available) {
						throw new BookingConflictError(
							`Aset "${asset.name}": ` +
								(dormCheck.conflictReason ||
									"Kapasitas fasilitas penuh pada rentang waktu tersebut."),
							dormCheck.details,
						);
					}
				}

				// Insert booking row
				const [newBooking] = await tx
					.insert(bookings)
					.values({
						assetId: item.assetId,
						groupId,
						requesterName: input.requesterName,
						requesterEmail: input.requesterEmail,
						requesterPhone: input.requesterPhone,
						requesterOrganization: input.requesterOrganization,
						purpose: input.purpose,
						attendance,
						roomLayout: item.roomLayout || null,
						startDate,
						endDate,
						timezone: input.timezone || "Asia/Jakarta",
						status: "pending",
						letterFileName: input.letterFileName || null,
						letterFileUrl: input.letterFileUrl || null,
						createdAt: new Date(),
						updatedAt: new Date(),
					})
					.returning();

				createdBookings.push(newBooking);

				// Audit event per booking
				await recordAuditEvent(tx, {
					actorId: actorId || input.requesterEmail,
					actorType: actorId ? "user" : "system",
					action: "booking.create",
					entityType: "booking",
					entityId: newBooking.id,
					metadata: {
						groupId,
						newStatus: "pending",
						assetId: item.assetId,
						assetType: asset.type,
						requesterEmail: input.requesterEmail,
						startDate: startDate.toISOString(),
						endDate: endDate.toISOString(),
						attendance,
					},
				});
			}

			// Record batch audit event
			await recordAuditEvent(tx, {
				actorId: actorId || input.requesterEmail,
				actorType: actorId ? "user" : "system",
				action: "booking.batch_create",
				entityType: "booking",
				entityId: groupId,
				metadata: {
					groupId,
					bookingCount: createdBookings.length,
					bookingIds: createdBookings.map((b) => b.id),
					requesterEmail: input.requesterEmail,
				},
			});

			return { createdBookings, assetMap };
		});

		// Post-commit async notifications
		for (const booking of createdBookings) {
			const asset = assetMap.get(booking.assetId);
			void safeDispatchBookingNotifications(() =>
				dispatchBookingCreatedNotifications({
					bookingId: booking.id,
					bookingRef: booking.groupId || booking.id,
					requesterName: booking.requesterName,
					requesterEmail: booking.requesterEmail,
					requesterPhone: booking.requesterPhone,
					requesterOrganization: booking.requesterOrganization,
					assetName: asset?.name || "Fasilitas",
					assetLocation: asset?.location || null,
					startDate: booking.startDate,
					endDate: booking.endDate,
					attendance: booking.attendance ?? 1,
					purpose: booking.purpose,
				}),
			);
		}

		return {
			groupId,
			bookings: createdBookings,
		};
	}

	/**
	 * Approves all pending bookings within a groupId atomically.
	 */
	static async batchApproveBookings(groupId: string, actorId: string) {
		const trimmed = groupId.trim();
		if (!trimmed) {
			throw new BookingConflictError("Group ID is required");
		}

		const groupBookings = await db
			.select()
			.from(bookings)
			.where(eq(bookings.groupId, trimmed));

		if (groupBookings.length === 0) {
			throw new BookingNotFoundError("Permohonan grup tidak ditemukan.");
		}

		const pendingBookings = groupBookings.filter((b) => b.status === "pending");
		if (pendingBookings.length === 0) {
			return groupBookings;
		}

		const results = [];
		for (const booking of pendingBookings) {
			const approved = await BookingService.approveBooking(booking.id, actorId);
			results.push(approved);
		}

		return results;
	}

	/**
	 * Approves a pending booking, authoritatively locking the asset and re-validating availability.
	 */
	static async approveBooking(bookingId: string, actorId: string) {
		const { updatedBooking, asset } = await db.transaction(async (tx) => {
			// 1. Lock the booking record
			const [booking] = await tx
				.select()
				.from(bookings)
				.where(eq(bookings.id, bookingId))
				.for("update");

			if (!booking) {
				throw new BookingNotFoundError();
			}

			// 2. Validate state machine transition (D-05)
			validateBookingTransition(booking.status as BookingStatus, "approved");

			// 3. Lock asset row (D-01)
			const [asset] = await tx
				.select()
				.from(assets)
				.where(eq(assets.id, booking.assetId))
				.for("update");

			if (!asset || asset.status !== "active") {
				throw new BookingConflictError(
					"Aset tidak aktif atau tidak ditemukan.",
				);
			}

			const startDate = normalizeDate(booking.startDate);
			const endDate = normalizeDate(booking.endDate);
			const attendance = booking.attendance ?? 1;

			// 4. Authoritatively re-check availability at approval time (FLOW-05)
			if (
				asset.type === "room" ||
				asset.type === "vehicle" ||
				asset.type === "field"
			) {
				const approvedBookings = await tx
					.select({
						id: bookings.id,
						startDate: bookings.startDate,
						endDate: bookings.endDate,
					})
					.from(bookings)
					.where(
						and(
							eq(bookings.assetId, asset.id),
							eq(bookings.status, "approved"),
							ne(bookings.id, booking.id),
							lt(bookings.startDate, endDate),
							gt(bookings.endDate, startDate),
						),
					);

				const overlapCheck = checkRoomOverlap(
					approvedBookings,
					startDate,
					endDate,
					booking.id,
				);
				if (!overlapCheck.available) {
					throw new BookingConflictError(
						"Tidak dapat menyetujui: Fasilitas sudah disetujui untuk peminjaman lain pada slot waktu tersebut.",
						overlapCheck.details,
					);
				}
			} else if (asset.type === "dormitory" || asset.type === "equipment") {
				const dormCheck = await checkDormitoryCapacity(
					tx,
					asset.id,
					asset.capacity,
					startDate,
					endDate,
					attendance,
					booking.id,
				);

				if (!dormCheck.available) {
					throw new BookingConflictError(
						"Tidak dapat menyetujui: Kapasitas fasilitas sudah terisi penuh oleh peminjaman yang telah disetujui.",
						dormCheck.details,
					);
				}
			}

			// 5. Update status to approved
			const [updatedBooking] = await tx
				.update(bookings)
				.set({
					status: "approved",
					updatedAt: new Date(),
				})
				.where(eq(bookings.id, booking.id))
				.returning();

			// 6. Record atomic audit event (D-08, OPS-03)
			await recordAuditEvent(tx, {
				actorId,
				actorType: "user",
				action: "booking.approve",
				entityType: "booking",
				entityId: booking.id,
				metadata: {
					oldStatus: booking.status,
					newStatus: "approved",
					assetId: booking.assetId,
					approvedAt: new Date().toISOString(),
				},
			});

			return { updatedBooking, asset };
		});

		// 7. Post-commit asynchronous dual-channel notification dispatch (NOTIF-01)
		void safeDispatchBookingNotifications(() =>
			dispatchBookingApprovedNotifications({
				bookingId: updatedBooking.id,
				bookingRef: updatedBooking.id,
				requesterName: updatedBooking.requesterName,
				requesterEmail: updatedBooking.requesterEmail,
				requesterPhone: updatedBooking.requesterPhone,
				assetName: asset.name,
				assetLocation: asset.location,
				startDate: updatedBooking.startDate,
				endDate: updatedBooking.endDate,
			}),
		);

		return updatedBooking;
	}

	/**
	 * Rejects a pending booking with a mandatory non-empty rejection reason.
	 */
	static async rejectBooking(
		bookingId: string,
		actorId: string,
		rejectionReason: string,
	) {
		const { updatedBooking, asset } = await db.transaction(async (tx) => {
			const [booking] = await tx
				.select()
				.from(bookings)
				.where(eq(bookings.id, bookingId))
				.for("update");

			if (!booking) {
				throw new BookingNotFoundError();
			}

			// Fetch asset for template context
			const [asset] = await tx
				.select()
				.from(assets)
				.where(eq(assets.id, booking.assetId));

			// Validate transition & required rejection reason (D-05, D-06)
			validateBookingTransition(
				booking.status as BookingStatus,
				"rejected",
				rejectionReason,
			);

			const [updatedBooking] = await tx
				.update(bookings)
				.set({
					status: "rejected",
					rejectionReason: rejectionReason.trim(),
					updatedAt: new Date(),
				})
				.where(eq(bookings.id, booking.id))
				.returning();

			// Record atomic audit event (D-08, OPS-03)
			await recordAuditEvent(tx, {
				actorId,
				actorType: "user",
				action: "booking.reject",
				entityType: "booking",
				entityId: booking.id,
				metadata: {
					oldStatus: booking.status,
					newStatus: "rejected",
					rejectionReason: rejectionReason.trim(),
					rejectedAt: new Date().toISOString(),
				},
			});

			return { updatedBooking, asset };
		});

		// Post-commit asynchronous dual-channel notification dispatch (NOTIF-01)
		void safeDispatchBookingNotifications(() =>
			dispatchBookingRejectedNotifications({
				bookingId: updatedBooking.id,
				bookingRef: updatedBooking.id,
				requesterName: updatedBooking.requesterName,
				requesterEmail: updatedBooking.requesterEmail,
				requesterPhone: updatedBooking.requesterPhone,
				assetName: asset?.name || "Fasilitas",
				startDate: updatedBooking.startDate,
				endDate: updatedBooking.endDate,
				rejectionReason: rejectionReason.trim(),
			}),
		);

		return updatedBooking;
	}

	/**
	 * Cancels an existing booking (pending or approved).
	 */
	static async cancelBooking(
		bookingId: string,
		actorId: string,
		reason?: string,
	) {
		const { updatedBooking, asset } = await db.transaction(async (tx) => {
			const [booking] = await tx
				.select()
				.from(bookings)
				.where(eq(bookings.id, bookingId))
				.for("update");

			if (!booking) {
				throw new BookingNotFoundError();
			}

			// Fetch asset for template context
			const [asset] = await tx
				.select()
				.from(assets)
				.where(eq(assets.id, booking.assetId));

			// Validate transition (D-05)
			validateBookingTransition(booking.status as BookingStatus, "cancelled");

			const [updatedBooking] = await tx
				.update(bookings)
				.set({
					status: "cancelled",
					updatedAt: new Date(),
				})
				.where(eq(bookings.id, booking.id))
				.returning();

			// Record atomic audit event (D-08, OPS-03)
			await recordAuditEvent(tx, {
				actorId,
				actorType: "user",
				action: "booking.cancel",
				entityType: "booking",
				entityId: booking.id,
				metadata: {
					oldStatus: booking.status,
					newStatus: "cancelled",
					reason: reason || null,
					cancelledAt: new Date().toISOString(),
				},
			});

			return { updatedBooking, asset };
		});

		// Post-commit asynchronous dual-channel notification dispatch
		void safeDispatchBookingNotifications(() =>
			dispatchBookingCancelledNotifications({
				bookingId: updatedBooking.id,
				bookingRef: updatedBooking.id,
				requesterName: updatedBooking.requesterName,
				requesterEmail: updatedBooking.requesterEmail,
				requesterPhone: updatedBooking.requesterPhone,
				assetName: asset?.name || "Fasilitas",
				startDate: updatedBooking.startDate,
				endDate: updatedBooking.endDate,
				reason: reason || null,
				cancelledBy: actorId,
			}),
		);

		return updatedBooking;
	}

	/**
	 * Public cancellation using booking ID and non-guessable reference (e.g. requester email or token) (D-07).
	 */
	static async cancelBookingByPublicReference(
		bookingId: string,
		referenceToken: string,
		reason: string,
	) {
		const trimmedReason = reason?.trim();
		if (!trimmedReason) {
			throw new BookingConflictError("Alasan pembatalan wajib diisi.");
		}

		const { updatedBooking, asset } = await db.transaction(async (tx) => {
			const [booking] = await tx
				.select()
				.from(bookings)
				.where(eq(bookings.id, bookingId))
				.for("update");

			if (!booking) {
				throw new BookingNotFoundError();
			}

			// Reference verification: match against ID or requesterEmail
			const isValidRef =
				referenceToken.trim().toLowerCase() ===
					booking.requesterEmail.trim().toLowerCase() ||
				referenceToken.trim() === booking.id;

			if (!isValidRef) {
				throw new BookingConflictError(
					"Kode referensi pembatalan tidak cocok dengan data permohonan.",
				);
			}

			// Fetch asset for template context
			const [asset] = await tx
				.select()
				.from(assets)
				.where(eq(assets.id, booking.assetId));

			validateBookingTransition(booking.status as BookingStatus, "cancelled");

			const [updatedBooking] = await tx
				.update(bookings)
				.set({
					status: "cancelled",
					updatedAt: new Date(),
				})
				.where(eq(bookings.id, booking.id))
				.returning();

			// Record atomic audit event (D-08, OPS-03)
			await recordAuditEvent(tx, {
				actorId: referenceToken,
				actorType: "user",
				action: "booking.cancel",
				entityType: "booking",
				entityId: booking.id,
				metadata: {
					oldStatus: booking.status,
					newStatus: "cancelled",
					reason: reason || null,
					cancelledVia: "public_reference",
					cancelledAt: new Date().toISOString(),
				},
			});

			return { updatedBooking, asset };
		});

		// Post-commit asynchronous dual-channel notification dispatch
		void safeDispatchBookingNotifications(() =>
			dispatchBookingCancelledNotifications({
				bookingId: updatedBooking.id,
				bookingRef: updatedBooking.id,
				requesterName: updatedBooking.requesterName,
				requesterEmail: updatedBooking.requesterEmail,
				requesterPhone: updatedBooking.requesterPhone,
				assetName: asset?.name || "Fasilitas",
				startDate: updatedBooking.startDate,
				endDate: updatedBooking.endDate,
				reason: reason || null,
				cancelledBy: "Pemohon",
			}),
		);

		return updatedBooking;
	}

	/**
	 * Preflight check for public availability without creating a booking.
	 */
	static async checkPreflightAvailability(input: {
		assetId: string;
		startDate: Date | string;
		endDate: Date | string;
		attendance?: number;
	}) {
		const startDate = normalizeDate(input.startDate);
		const endDate = normalizeDate(input.endDate);
		const attendance = input.attendance ?? 1;

		const [asset] = await db
			.select()
			.from(assets)
			.where(eq(assets.id, input.assetId));

		if (!asset) {
			return {
				available: false,
				reason: "Aset yang dipilih tidak ditemukan",
			};
		}

		if (asset.status !== "active") {
			return {
				available: false,
				reason: `Aset "${asset.name}" saat ini tidak aktif (${asset.status}) dan tidak dapat dipinjam.`,
			};
		}

		// Check asset closures
		const closures = await db
			.select()
			.from(assetClosures)
			.where(eq(assetClosures.assetId, asset.id));

		const closureCheck = validateAssetClosures(startDate, endDate, closures);
		if (!closureCheck.valid) {
			return {
				available: false,
				reason:
					closureCheck.reason || "Aset sedang ditutup pada jadwal tersebut.",
				details: { conflictingDate: closureCheck.conflictingDate },
			};
		}

		if (asset.type === "room") {
			const capCheck = validateRoomCapacity(attendance, asset.capacity);
			if (!capCheck.valid) {
				return {
					available: false,
					reason:
						capCheck.reason || "Jumlah peserta melebihi kapasitas ruangan.",
				};
			}

			const schedules = await db
				.select()
				.from(assetAvailability)
				.where(eq(assetAvailability.assetId, asset.id));

			if (schedules.length > 0) {
				const hoursCheck = validateOperatingHours(
					startDate,
					endDate,
					schedules,
				);
				if (!hoursCheck.valid) {
					return {
						available: false,
						reason:
							hoursCheck.reason ||
							"Jadwal peminjaman di luar jam operasional ruangan.",
					};
				}
			}

			const approvedBookings = await db
				.select({
					id: bookings.id,
					startDate: bookings.startDate,
					endDate: bookings.endDate,
				})
				.from(bookings)
				.where(
					and(
						eq(bookings.assetId, asset.id),
						eq(bookings.status, "approved"),
						lt(bookings.startDate, endDate),
						gt(bookings.endDate, startDate),
					),
				);

			const overlapCheck = checkRoomOverlap(
				approvedBookings,
				startDate,
				endDate,
			);
			if (!overlapCheck.available) {
				return {
					available: false,
					reason:
						overlapCheck.conflictReason ||
						"Ruangan sudah terisi untuk jadwal tersebut.",
					details: overlapCheck.details,
				};
			}
		} else if (asset.type === "dormitory") {
			const dormCheck = await checkDormitoryCapacity(
				db,
				asset.id,
				asset.capacity,
				startDate,
				endDate,
				attendance,
			);

			if (!dormCheck.available) {
				return {
					available: false,
					reason:
						dormCheck.conflictReason ||
						"Kapasitas asrama penuh pada rentang tanggal tersebut.",
					details: dormCheck.details,
				};
			}
		}

		return {
			available: true,
		};
	}

	/**
	 * Public query for sanitized booking status by ID or reference code (including group IDs).
	 * Projects ONLY privacy-safe fields, strictly omitting requester PII.
	 */
	static async getPublicBookingStatus(identifier: string) {
		const trimmed = identifier.trim();
		if (!trimmed) return null;

		// 1. Check if identifier matches a groupId directly
		const groupMatches = await db
			.select({
				id: bookings.id,
				groupId: bookings.groupId,
				assetId: bookings.assetId,
				assetName: assets.name,
				assetType: assets.type,
				assetLocation: assets.location,
				capacity: assets.capacity,
				startDate: bookings.startDate,
				endDate: bookings.endDate,
				attendance: bookings.attendance,
				roomLayout: bookings.roomLayout,
				status: bookings.status,
				rejectionReason: bookings.rejectionReason,
				letterFileName: bookings.letterFileName,
				letterFileUrl: bookings.letterFileUrl,
				createdAt: bookings.createdAt,
				updatedAt: bookings.updatedAt,
			})
			.from(bookings)
			.innerJoin(assets, eq(bookings.assetId, assets.id))
			.where(eq(bookings.groupId, trimmed))
			.orderBy(asc(bookings.startDate));

		if (groupMatches.length > 0) {
			const primary = groupMatches[0];
			return {
				...primary,
				isGroup: true,
				groupId: primary.groupId,
				items: groupMatches,
			};
		}

		// 2. Check if identifier matches a booking.id
		const [singleRecord] = await db
			.select({
				id: bookings.id,
				groupId: bookings.groupId,
				assetId: bookings.assetId,
				assetName: assets.name,
				assetType: assets.type,
				assetLocation: assets.location,
				capacity: assets.capacity,
				startDate: bookings.startDate,
				endDate: bookings.endDate,
				attendance: bookings.attendance,
				roomLayout: bookings.roomLayout,
				status: bookings.status,
				rejectionReason: bookings.rejectionReason,
				letterFileName: bookings.letterFileName,
				letterFileUrl: bookings.letterFileUrl,
				createdAt: bookings.createdAt,
				updatedAt: bookings.updatedAt,
			})
			.from(bookings)
			.innerJoin(assets, eq(bookings.assetId, assets.id))
			.where(eq(bookings.id, trimmed));

		if (!singleRecord) return null;

		// If single record belongs to a group, fetch all siblings
		if (singleRecord.groupId) {
			const allGroupItems = await db
				.select({
					id: bookings.id,
					groupId: bookings.groupId,
					assetId: bookings.assetId,
					assetName: assets.name,
					assetType: assets.type,
					assetLocation: assets.location,
					capacity: assets.capacity,
					startDate: bookings.startDate,
					endDate: bookings.endDate,
					attendance: bookings.attendance,
					roomLayout: bookings.roomLayout,
					status: bookings.status,
					rejectionReason: bookings.rejectionReason,
					letterFileName: bookings.letterFileName,
					letterFileUrl: bookings.letterFileUrl,
					createdAt: bookings.createdAt,
					updatedAt: bookings.updatedAt,
				})
				.from(bookings)
				.innerJoin(assets, eq(bookings.assetId, assets.id))
				.where(eq(bookings.groupId, singleRecord.groupId))
				.orderBy(asc(bookings.startDate));

			return {
				...singleRecord,
				isGroup: allGroupItems.length > 1,
				groupId: singleRecord.groupId,
				items: allGroupItems,
			};
		}

		return {
			...singleRecord,
			isGroup: false,
			groupId: null,
			items: [singleRecord],
		};
	}

	/**
	 * Real-time batch catalog availability calculation for a given time window.
	 */
	static async checkCatalogAvailability(input: {
		startDate: Date | string;
		endDate: Date | string;
	}) {
		const startDate = normalizeDate(input.startDate);
		const endDate = normalizeDate(input.endDate);

		const activeAssets = await db
			.select({
				id: assets.id,
				name: assets.name,
				type: assets.type,
				capacity: assets.capacity,
			})
			.from(assets)
			.where(eq(assets.status, "active"));

		const [allApprovedBookings, allClosures] = await Promise.all([
			db
				.select({
					assetId: bookings.assetId,
					startDate: bookings.startDate,
					endDate: bookings.endDate,
				})
				.from(bookings)
				.where(
					and(
						eq(bookings.status, "approved"),
						lt(bookings.startDate, endDate),
						gt(bookings.endDate, startDate),
					),
				),
			db
				.select({
					assetId: assetClosures.assetId,
					date: assetClosures.date,
					reason: assetClosures.reason,
				})
				.from(assetClosures),
		]);

		const results: Record<
			string,
			{
				available: boolean;
				reason?: string;
				bookedSessions: { startDate: string; endDate: string }[];
			}
		> = {};

		for (const asset of activeAssets) {
			// 1. Check closures
			const closures = allClosures.filter((c) => c.assetId === asset.id);
			const closureCheck = validateAssetClosures(startDate, endDate, closures);
			if (!closureCheck.valid) {
				results[asset.id] = {
					available: false,
					reason: closureCheck.reason || "Ditutup untuk pemeliharaan",
					bookedSessions: [],
				};
				continue;
			}

			// 2. Overlapping approved bookings
			const overlapping = allApprovedBookings.filter(
				(b) => b.assetId === asset.id,
			);

			if (
				asset.type === "room" ||
				asset.type === "vehicle" ||
				asset.type === "field"
			) {
				const overlapCheck = checkRoomOverlap(overlapping, startDate, endDate);
				results[asset.id] = {
					available: overlapCheck.available,
					reason: overlapCheck.conflictReason,
					bookedSessions: overlapping.map((b) => ({
						startDate: b.startDate.toISOString(),
						endDate: b.endDate.toISOString(),
					})),
				};
			} else {
				// dormitory / equipment
				results[asset.id] = {
					available: true,
					bookedSessions: overlapping.map((b) => ({
						startDate: b.startDate.toISOString(),
						endDate: b.endDate.toISOString(),
					})),
				};
			}
		}

		return results;
	}
}

