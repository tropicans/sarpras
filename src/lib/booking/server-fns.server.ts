import { createServerFn } from "@tanstack/react-start";
import { requireMinRole } from "#/lib/auth.middleware";
import { BookingService } from "./service.server";
import {
	ApproveBookingInputSchema,
	CancelBookingInputSchema,
	CancelPublicBookingInputSchema,
	CreateBookingInputSchema,
	RejectBookingInputSchema,
} from "./types";

/**
 * Public Server Function: Submits a new booking request.
 */
export const submitBookingRequestFn = createServerFn({ method: "POST" })
	.validator((data: unknown) => CreateBookingInputSchema.parse(data))
	.handler(async ({ data }) => {
		return await BookingService.createBookingRequest(data);
	});

/**
 * Protected Server Function: Approves a booking request (Requires Operator or Admin role).
 */
export const approveBookingFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("operator")])
	.validator((data: unknown) => ApproveBookingInputSchema.parse(data))
	.handler(async ({ data, context }) => {
		return await BookingService.approveBooking(data.bookingId, context.user.id);
	});

/**
 * Protected Server Function: Rejects a booking request with reason (Requires Operator or Admin role).
 */
export const rejectBookingFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("operator")])
	.validator((data: unknown) => RejectBookingInputSchema.parse(data))
	.handler(async ({ data, context }) => {
		return await BookingService.rejectBooking(
			data.bookingId,
			context.user.id,
			data.rejectionReason,
		);
	});

/**
 * Protected Server Function: Cancels a booking by Administrator/Operator.
 */
export const cancelBookingByAdminFn = createServerFn({ method: "POST" })
	.middleware([requireMinRole("operator")])
	.validator((data: unknown) => CancelBookingInputSchema.parse(data))
	.handler(async ({ data, context }) => {
		return await BookingService.cancelBooking(
			data.bookingId,
			context.user.id,
			data.reason,
		);
	});

/**
 * Public Server Function: Cancels a booking using a reference token (e.g. requester email).
 */
export const cancelBookingByPublicReferenceFn = createServerFn({
	method: "POST",
})
	.validator((data: unknown) => CancelPublicBookingInputSchema.parse(data))
	.handler(async ({ data }) => {
		return await BookingService.cancelBookingByPublicReference(
			data.bookingId,
			data.referenceToken,
			data.reason,
		);
	});
