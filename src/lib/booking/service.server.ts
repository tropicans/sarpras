import { and, eq, gt, lt, ne } from "drizzle-orm";
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
import type { BookingStatus, CreateBookingInput } from "./types";

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
					requesterName: input.requesterName,
					requesterEmail: input.requesterEmail,
					requesterPhone: input.requesterPhone,
					requesterOrganization: input.requesterOrganization,
					purpose: input.purpose,
					attendance,
					startDate,
					endDate,
					timezone: input.timezone || "Asia/Jakarta",
					status: "pending",
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
				bookingRef: newBooking.id,
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
	 * Public query for sanitized booking status by ID or reference code.
	 * Projects ONLY privacy-safe fields, strictly omitting requester PII.
	 */
	static async getPublicBookingStatus(identifier: string) {
		const trimmed = identifier.trim();
		if (!trimmed) return null;

		const [record] = await db
			.select({
				id: bookings.id,
				assetId: bookings.assetId,
				assetName: assets.name,
				assetType: assets.type,
				assetLocation: assets.location,
				capacity: assets.capacity,
				startDate: bookings.startDate,
				endDate: bookings.endDate,
				attendance: bookings.attendance,
				status: bookings.status,
				rejectionReason: bookings.rejectionReason,
				createdAt: bookings.createdAt,
				updatedAt: bookings.updatedAt,
			})
			.from(bookings)
			.innerJoin(assets, eq(bookings.assetId, assets.id))
			.where(eq(bookings.id, trimmed));

		if (!record) return null;

		return record;
	}
}
