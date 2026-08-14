export const WHATSAPP_TEMPLATE_TYPES = [
	"BOOKING_CREATED_REQUESTER",
	"BOOKING_CREATED_ADMIN",
	"BOOKING_APPROVED",
	"BOOKING_REJECTED",
	"BOOKING_CANCELLED",
] as const;

export type WhatsAppTemplateType = (typeof WHATSAPP_TEMPLATE_TYPES)[number];

export interface SendWhatsAppParams {
	target: string;
	message: string;
	bookingId?: string;
	templateType?: WhatsAppTemplateType;
}

export interface WhatsAppDispatchResult {
	success: boolean;
	mock?: boolean;
	messageId?: string;
	error?: string;
	rawResponse?: unknown;
}

export interface FonnteSendPayload {
	target: string;
	message: string;
	countryCode?: string;
}

export interface FonnteApiResponse {
	status?: boolean;
	id?: string;
	target?: string | string[];
	process?: string;
	reason?: string;
	[key: string]: unknown;
}

export interface BookingSubmissionRequesterData {
	bookingRef: string;
	requesterName: string;
	assetName: string;
	assetLocation?: string | null;
	startDate: Date | string;
	endDate: Date | string;
	purpose?: string | null;
	trackingUrl?: string;
}

export interface BookingSubmissionAdminData {
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

export interface BookingApprovalData {
	bookingRef: string;
	requesterName: string;
	assetName: string;
	assetLocation?: string | null;
	startDate: Date | string;
	endDate: Date | string;
	trackingUrl?: string;
}

export interface BookingRejectionData {
	bookingRef: string;
	requesterName: string;
	assetName: string;
	startDate: Date | string;
	endDate: Date | string;
	rejectionReason: string;
	trackingUrl?: string;
}

export interface BookingCancellationData {
	bookingRef: string;
	requesterName: string;
	assetName: string;
	startDate: Date | string;
	endDate: Date | string;
	reason?: string | null;
	cancelledBy?: string;
	trackingUrl?: string;
}
