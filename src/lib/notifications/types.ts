import type { EmailDispatchResult } from "../email/types";
import type { WhatsAppDispatchResult } from "../whatsapp/types";

export interface BookingCreatedNotificationData {
	bookingId: string;
	bookingRef: string;
	requesterName: string;
	requesterEmail?: string | null;
	requesterPhone?: string | null;
	requesterOrganization?: string | null;
	assetName: string;
	assetLocation?: string | null;
	startDate: Date | string;
	endDate: Date | string;
	attendance: number;
	purpose?: string | null;
}

export interface BookingApprovedNotificationData {
	bookingId: string;
	bookingRef: string;
	requesterName: string;
	requesterEmail?: string | null;
	requesterPhone?: string | null;
	assetName: string;
	assetLocation?: string | null;
	startDate: Date | string;
	endDate: Date | string;
}

export interface BookingRejectedNotificationData {
	bookingId: string;
	bookingRef: string;
	requesterName: string;
	requesterEmail?: string | null;
	requesterPhone?: string | null;
	assetName: string;
	startDate: Date | string;
	endDate: Date | string;
	rejectionReason: string;
}

export interface BookingCancelledNotificationData {
	bookingId: string;
	bookingRef: string;
	requesterName: string;
	requesterEmail?: string | null;
	requesterPhone?: string | null;
	assetName: string;
	startDate: Date | string;
	endDate: Date | string;
	reason?: string | null;
	cancelledBy?: string | null;
}

export interface DualChannelDispatchSummary {
	emailResults: EmailDispatchResult[];
	whatsappResults: WhatsAppDispatchResult[];
}
