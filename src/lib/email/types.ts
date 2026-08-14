export type EmailTemplateType =
	| "BOOKING_SUBMITTED_REQUESTER"
	| "BOOKING_SUBMITTED_ADMIN"
	| "BOOKING_APPROVED"
	| "BOOKING_REJECTED"
	| "BOOKING_CANCELLED";

export interface EmailDispatchResult {
	success: boolean;
	mock?: boolean;
	messageId?: string;
	error?: string;
	rawResponse?: unknown;
}

export interface SendEmailParams {
	to: string | string[];
	subject: string;
	html: string;
	text: string;
	bookingId?: string;
	templateType?: EmailTemplateType;
}

export interface EmailTemplateOutput {
	subject: string;
	html: string;
	text: string;
}

export interface BookingSubmissionRequesterEmailData {
	bookingRef: string;
	requesterName: string;
	assetName: string;
	assetLocation?: string | null;
	startDate: Date | string;
	endDate: Date | string;
	purpose?: string | null;
	trackingUrl?: string;
}

export interface BookingSubmissionAdminEmailData {
	bookingRef: string;
	requesterName: string;
	requesterOrganization?: string | null;
	assetName: string;
	startDate: Date | string;
	endDate: Date | string;
	attendance: number;
	purpose?: string | null;
	adminApprovalUrl?: string;
}

export interface BookingApprovalEmailData {
	bookingRef: string;
	requesterName: string;
	assetName: string;
	assetLocation?: string | null;
	startDate: Date | string;
	endDate: Date | string;
	trackingUrl?: string;
}

export interface BookingRejectionEmailData {
	bookingRef: string;
	requesterName: string;
	assetName: string;
	startDate: Date | string;
	endDate: Date | string;
	rejectionReason: string;
	trackingUrl?: string;
}

export interface BookingCancellationEmailData {
	bookingRef: string;
	requesterName: string;
	assetName: string;
	startDate: Date | string;
	endDate: Date | string;
	reason?: string | null;
	cancelledBy?: string | null;
}
