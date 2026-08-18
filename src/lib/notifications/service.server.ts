import { safeDispatchEmail, sanitizeEmailList } from "../email/service.server";
import {
	buildBookingApprovalEmail,
	buildBookingCancellationEmail,
	buildBookingRejectionEmail,
	buildBookingSubmissionAdminEmail,
	buildBookingSubmissionRequesterEmail,
} from "../email/templates";
import type { EmailDispatchResult } from "../email/types";
import { safeDispatchNotification } from "../whatsapp/service.server";
import {
	buildBookingApprovalMessage,
	buildBookingCancellationMessage,
	buildBookingRejectionMessage,
	buildBookingSubmissionAdminMessage,
	buildBookingSubmissionRequesterMessage,
} from "../whatsapp/templates";
import type { WhatsAppDispatchResult } from "../whatsapp/types";
import type {
	BookingApprovedNotificationData,
	BookingCancelledNotificationData,
	BookingCreatedNotificationData,
	BookingRejectedNotificationData,
	DualChannelDispatchSummary,
} from "./types";

/**
 * Unified notification orchestrator for dispatching concurrent Email (Resend)
 * and WhatsApp (Fonnte) notifications across booking lifecycle events.
 */

/**
 * Dispatches creation notifications:
 * - Email to requester (if requesterEmail is present)
 * - WhatsApp to requester (if requesterPhone is present)
 * - Email to admins (for each recipient in ADMIN_DEFAULT_EMAIL)
 * - WhatsApp to admin (if FONNTE_ADMIN_TARGET is set)
 */
export async function dispatchBookingCreatedNotifications(
	data: BookingCreatedNotificationData,
): Promise<DualChannelDispatchSummary> {
	const emailPromises: Promise<EmailDispatchResult>[] = [];
	const whatsappPromises: Promise<WhatsAppDispatchResult>[] = [];

	// 1. Requester Email
	if (data.requesterEmail?.trim()) {
		const emailContent = buildBookingSubmissionRequesterEmail({
			bookingRef: data.bookingRef,
			requesterName: data.requesterName,
			assetName: data.assetName,
			assetLocation: data.assetLocation,
			startDate: data.startDate,
			endDate: data.endDate,
			purpose: data.purpose,
		});

		emailPromises.push(
			safeDispatchEmail({
				to: data.requesterEmail.trim(),
				subject: emailContent.subject,
				html: emailContent.html,
				text: emailContent.text,
				bookingId: data.bookingId,
				templateType: "BOOKING_SUBMITTED_REQUESTER",
			}),
		);
	}

	// 2. Requester WhatsApp
	if (data.requesterPhone?.trim()) {
		const waMessage = buildBookingSubmissionRequesterMessage({
			bookingRef: data.bookingRef,
			requesterName: data.requesterName,
			assetName: data.assetName,
			assetLocation: data.assetLocation,
			startDate: data.startDate,
			endDate: data.endDate,
			purpose: data.purpose,
		});

		whatsappPromises.push(
			safeDispatchNotification({
				target: data.requesterPhone.trim(),
				message: waMessage,
				bookingId: data.bookingId,
				templateType: "BOOKING_CREATED_REQUESTER",
			}),
		);
	}

	// 3. Admin Email(s)
	const rawAdminEmails =
		process.env.ADMIN_DEFAULT_EMAIL || "admin@ppkasn.go.id";
	const adminEmailList = sanitizeEmailList(rawAdminEmails);

	if (adminEmailList.length > 0) {
		const adminEmailContent = buildBookingSubmissionAdminEmail({
			bookingRef: data.bookingRef,
			requesterName: data.requesterName,
			requesterOrganization: data.requesterOrganization,
			assetName: data.assetName,
			startDate: data.startDate,
			endDate: data.endDate,
			attendance: data.attendance,
			purpose: data.purpose,
		});

		for (const adminEmail of adminEmailList) {
			emailPromises.push(
				safeDispatchEmail({
					to: adminEmail,
					subject: adminEmailContent.subject,
					html: adminEmailContent.html,
					text: adminEmailContent.text,
					bookingId: data.bookingId,
					templateType: "BOOKING_SUBMITTED_ADMIN",
				}),
			);
		}
	}

	// 4. Admin WhatsApp
	const adminWaTarget = process.env.FONNTE_ADMIN_TARGET?.trim();
	if (adminWaTarget) {
		const adminWaMessage = buildBookingSubmissionAdminMessage({
			bookingRef: data.bookingRef,
			requesterName: data.requesterName,
			requesterOrganization: data.requesterOrganization,
			assetName: data.assetName,
			startDate: data.startDate,
			endDate: data.endDate,
			attendance: data.attendance,
			purpose: data.purpose,
		});

		whatsappPromises.push(
			safeDispatchNotification({
				target: adminWaTarget,
				message: adminWaMessage,
				bookingId: data.bookingId,
				templateType: "BOOKING_CREATED_ADMIN",
			}),
		);
	}

	// Execute concurrently without cross-channel blocking
	const [emailSettled, whatsappSettled] = await Promise.all([
		Promise.allSettled(emailPromises),
		Promise.allSettled(whatsappPromises),
	]);

	const emailResults: EmailDispatchResult[] = emailSettled.map((res) =>
		res.status === "fulfilled"
			? res.value
			: {
					success: false,
					error:
						res.reason instanceof Error
							? res.reason.message
							: String(res.reason),
				},
	);

	const whatsappResults: WhatsAppDispatchResult[] = whatsappSettled.map((res) =>
		res.status === "fulfilled"
			? res.value
			: {
					success: false,
					error:
						res.reason instanceof Error
							? res.reason.message
							: String(res.reason),
				},
	);

	return { emailResults, whatsappResults };
}

/**
 * Dispatches approval notifications:
 * - Email to requester (if requesterEmail is present)
 * - WhatsApp to requester (if requesterPhone is present)
 */
export async function dispatchBookingApprovedNotifications(
	data: BookingApprovedNotificationData,
): Promise<DualChannelDispatchSummary> {
	const emailPromises: Promise<EmailDispatchResult>[] = [];
	const whatsappPromises: Promise<WhatsAppDispatchResult>[] = [];

	if (data.requesterEmail?.trim()) {
		const emailContent = buildBookingApprovalEmail({
			bookingRef: data.bookingRef,
			requesterName: data.requesterName,
			assetName: data.assetName,
			assetLocation: data.assetLocation,
			startDate: data.startDate,
			endDate: data.endDate,
		});

		emailPromises.push(
			safeDispatchEmail({
				to: data.requesterEmail.trim(),
				subject: emailContent.subject,
				html: emailContent.html,
				text: emailContent.text,
				bookingId: data.bookingId,
				templateType: "BOOKING_APPROVED",
			}),
		);
	}

	if (data.requesterPhone?.trim()) {
		const waMessage = buildBookingApprovalMessage({
			bookingRef: data.bookingRef,
			requesterName: data.requesterName,
			assetName: data.assetName,
			assetLocation: data.assetLocation,
			startDate: data.startDate,
			endDate: data.endDate,
		});

		whatsappPromises.push(
			safeDispatchNotification({
				target: data.requesterPhone.trim(),
				message: waMessage,
				bookingId: data.bookingId,
				templateType: "BOOKING_APPROVED",
			}),
		);
	}

	const [emailSettled, whatsappSettled] = await Promise.all([
		Promise.allSettled(emailPromises),
		Promise.allSettled(whatsappPromises),
	]);

	const emailResults: EmailDispatchResult[] = emailSettled.map((res) =>
		res.status === "fulfilled"
			? res.value
			: {
					success: false,
					error:
						res.reason instanceof Error
							? res.reason.message
							: String(res.reason),
				},
	);

	const whatsappResults: WhatsAppDispatchResult[] = whatsappSettled.map((res) =>
		res.status === "fulfilled"
			? res.value
			: {
					success: false,
					error:
						res.reason instanceof Error
							? res.reason.message
							: String(res.reason),
				},
	);

	return { emailResults, whatsappResults };
}

/**
 * Dispatches rejection notifications:
 * - Email to requester (if requesterEmail is present)
 * - WhatsApp to requester (if requesterPhone is present)
 */
export async function dispatchBookingRejectedNotifications(
	data: BookingRejectedNotificationData,
): Promise<DualChannelDispatchSummary> {
	const emailPromises: Promise<EmailDispatchResult>[] = [];
	const whatsappPromises: Promise<WhatsAppDispatchResult>[] = [];

	if (data.requesterEmail?.trim()) {
		const emailContent = buildBookingRejectionEmail({
			bookingRef: data.bookingRef,
			requesterName: data.requesterName,
			assetName: data.assetName,
			startDate: data.startDate,
			endDate: data.endDate,
			rejectionReason: data.rejectionReason,
		});

		emailPromises.push(
			safeDispatchEmail({
				to: data.requesterEmail.trim(),
				subject: emailContent.subject,
				html: emailContent.html,
				text: emailContent.text,
				bookingId: data.bookingId,
				templateType: "BOOKING_REJECTED",
			}),
		);
	}

	if (data.requesterPhone?.trim()) {
		const waMessage = buildBookingRejectionMessage({
			bookingRef: data.bookingRef,
			requesterName: data.requesterName,
			assetName: data.assetName,
			startDate: data.startDate,
			endDate: data.endDate,
			rejectionReason: data.rejectionReason,
		});

		whatsappPromises.push(
			safeDispatchNotification({
				target: data.requesterPhone.trim(),
				message: waMessage,
				bookingId: data.bookingId,
				templateType: "BOOKING_REJECTED",
			}),
		);
	}

	const [emailSettled, whatsappSettled] = await Promise.all([
		Promise.allSettled(emailPromises),
		Promise.allSettled(whatsappPromises),
	]);

	const emailResults: EmailDispatchResult[] = emailSettled.map((res) =>
		res.status === "fulfilled"
			? res.value
			: {
					success: false,
					error:
						res.reason instanceof Error
							? res.reason.message
							: String(res.reason),
				},
	);

	const whatsappResults: WhatsAppDispatchResult[] = whatsappSettled.map((res) =>
		res.status === "fulfilled"
			? res.value
			: {
					success: false,
					error:
						res.reason instanceof Error
							? res.reason.message
							: String(res.reason),
				},
	);

	return { emailResults, whatsappResults };
}

/**
 * Dispatches cancellation notifications:
 * - Email to requester (if requesterEmail is present)
 * - WhatsApp to requester (if requesterPhone is present)
 */
export async function dispatchBookingCancelledNotifications(
	data: BookingCancelledNotificationData,
): Promise<DualChannelDispatchSummary> {
	const emailPromises: Promise<EmailDispatchResult>[] = [];
	const whatsappPromises: Promise<WhatsAppDispatchResult>[] = [];

	if (data.requesterEmail?.trim()) {
		const emailContent = buildBookingCancellationEmail({
			bookingRef: data.bookingRef,
			requesterName: data.requesterName,
			assetName: data.assetName,
			startDate: data.startDate,
			endDate: data.endDate,
			reason: data.reason,
			cancelledBy: data.cancelledBy,
		});

		emailPromises.push(
			safeDispatchEmail({
				to: data.requesterEmail.trim(),
				subject: emailContent.subject,
				html: emailContent.html,
				text: emailContent.text,
				bookingId: data.bookingId,
				templateType: "BOOKING_CANCELLED",
			}),
		);
	}

	if (data.requesterPhone?.trim()) {
		const waMessage = buildBookingCancellationMessage({
			bookingRef: data.bookingRef,
			requesterName: data.requesterName,
			assetName: data.assetName,
			startDate: data.startDate,
			endDate: data.endDate,
			reason: data.reason,
			cancelledBy: data.cancelledBy || undefined,
		});

		whatsappPromises.push(
			safeDispatchNotification({
				target: data.requesterPhone.trim(),
				message: waMessage,
				bookingId: data.bookingId,
				templateType: "BOOKING_CANCELLED",
			}),
		);
	}

	const [emailSettled, whatsappSettled] = await Promise.all([
		Promise.allSettled(emailPromises),
		Promise.allSettled(whatsappPromises),
	]);

	const emailResults: EmailDispatchResult[] = emailSettled.map((res) =>
		res.status === "fulfilled"
			? res.value
			: {
					success: false,
					error:
						res.reason instanceof Error
							? res.reason.message
							: String(res.reason),
				},
	);

	const whatsappResults: WhatsAppDispatchResult[] = whatsappSettled.map((res) =>
		res.status === "fulfilled"
			? res.value
			: {
					success: false,
					error:
						res.reason instanceof Error
							? res.reason.message
							: String(res.reason),
				},
	);

	return { emailResults, whatsappResults };
}

/**
 * Non-blocking, safe wrapper to execute unified notification dispatches as a fire-and-forget side effect.
 * Guarantees uncaught promise rejections never disrupt caller transactions.
 */
export async function safeDispatchBookingNotifications<T>(
	fn: () => Promise<T>,
): Promise<T | null> {
	try {
		return await fn();
	} catch (error: any) {
		console.error(
			"[safeDispatchBookingNotifications] Unexpected notification error:",
			error,
		);
		return null;
	}
}
