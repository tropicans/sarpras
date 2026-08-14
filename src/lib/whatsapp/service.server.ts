import { recordAuditEvent } from "../audit/audit.server";
import { sanitizeTarget } from "./phone";
import type {
	FonnteApiResponse,
	SendWhatsAppParams,
	WhatsAppDispatchResult,
} from "./types";

export class WhatsAppService {
	/**
	 * Sends a WhatsApp message via Fonnte gateway API, falling back to a structured console mock
	 * when in test/development mode or when FONNTE_API_TOKEN is not configured.
	 */
	static async sendWhatsAppMessage(
		params: SendWhatsAppParams,
	): Promise<WhatsAppDispatchResult> {
		const target = sanitizeTarget(params.target);

		if (!target) {
			const errorMsg = `Invalid or empty target phone number: "${params.target}"`;
			console.warn(`[WhatsAppService] ${errorMsg}`);

			if (params.bookingId) {
				try {
					await recordAuditEvent(null, {
						actorId: "system:whatsapp",
						actorType: "system",
						action: "notification.whatsapp_dispatch",
						entityType: "booking",
						entityId: params.bookingId,
						metadata: {
							rawTarget: params.target,
							template: params.templateType || null,
							status: "failed",
							error: errorMsg,
							timestamp: new Date().toISOString(),
						},
					});
				} catch (auditErr) {
					console.error(
						"[WhatsAppService] Failed to record audit log:",
						auditErr,
					);
				}
			}

			return { success: false, error: errorMsg };
		}

		const token = process.env.FONNTE_API_TOKEN?.trim();
		const isMockMode =
			!token ||
			process.env.FONNTE_MOCK === "true" ||
			process.env.NODE_ENV === "test";

		// 1. Mock Mode Fallback (WA-03)
		if (isMockMode) {
			const mockId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
			console.log(
				`\n┌── [MOCK WHATSAPP DISPATCH] ──────────────────────────┐\n` +
					`│ Target   : ${target.padEnd(42)} │\n` +
					`│ Template : ${(params.templateType || "CUSTOM").padEnd(42)} │\n` +
					`│ Booking  : ${(params.bookingId || "-").padEnd(42)} │\n` +
					`├──────────────────────────────────────────────────────┤\n` +
					`${params.message
						.split("\n")
						.map((line) => `│ ${line}`)
						.join("\n")}\n` +
					`└──────────────────────────────────────────────────────┘\n`,
			);

			if (params.bookingId) {
				try {
					await recordAuditEvent(null, {
						actorId: "system:whatsapp",
						actorType: "system",
						action: "notification.whatsapp_dispatch",
						entityType: "booking",
						entityId: params.bookingId,
						metadata: {
							target,
							template: params.templateType || null,
							status: "mock",
							provider: "fonnte_mock",
							messageId: mockId,
							timestamp: new Date().toISOString(),
						},
					});
				} catch (auditErr) {
					console.error(
						"[WhatsAppService] Failed to record audit log:",
						auditErr,
					);
				}
			}

			return {
				success: true,
				mock: true,
				messageId: mockId,
			};
		}

		// 2. Real HTTP Dispatch via Fonnte API (WA-01, WA-02)
		try {
			const response = await fetch("https://api.fonnte.com/send", {
				method: "POST",
				headers: {
					Authorization: token,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					target,
					message: params.message,
					countryCode: "62",
				}),
				signal: AbortSignal.timeout(10000),
			});

			const data = (await response.json()) as FonnteApiResponse;
			const isSuccess = response.ok && data.status !== false;
			const errorReason = isSuccess
				? undefined
				: data.reason || `HTTP ${response.status}: ${response.statusText}`;

			if (params.bookingId) {
				try {
					await recordAuditEvent(null, {
						actorId: "system:whatsapp",
						actorType: "system",
						action: "notification.whatsapp_dispatch",
						entityType: "booking",
						entityId: params.bookingId,
						metadata: {
							target,
							template: params.templateType || null,
							status: isSuccess ? "success" : "failed",
							provider: "fonnte",
							messageId: data.id || null,
							response: data,
							error: errorReason || null,
							timestamp: new Date().toISOString(),
						},
					});
				} catch (auditErr) {
					console.error(
						"[WhatsAppService] Failed to record audit log:",
						auditErr,
					);
				}
			}

			if (isSuccess) {
				return {
					success: true,
					mock: false,
					messageId: data.id,
					rawResponse: data,
				};
			}

			return {
				success: false,
				error: errorReason,
				rawResponse: data,
			};
		} catch (err: any) {
			const errorMsg =
				err?.message || "Unknown network error during WhatsApp dispatch";
			console.error(
				"[WhatsAppService] Error dispatching message to Fonnte:",
				errorMsg,
			);

			if (params.bookingId) {
				try {
					await recordAuditEvent(null, {
						actorId: "system:whatsapp",
						actorType: "system",
						action: "notification.whatsapp_dispatch",
						entityType: "booking",
						entityId: params.bookingId,
						metadata: {
							target,
							template: params.templateType || null,
							status: "failed",
							provider: "fonnte",
							error: errorMsg,
							timestamp: new Date().toISOString(),
						},
					});
				} catch (auditErr) {
					console.error(
						"[WhatsAppService] Failed to record audit log:",
						auditErr,
					);
				}
			}

			return {
				success: false,
				error: errorMsg,
			};
		}
	}
}

/**
 * Non-blocking, safe wrapper to trigger WhatsApp notification dispatch as a side-effect.
 * Ensures uncaught promise rejections or gateway failures never disrupt caller transactions.
 */
export async function safeDispatchNotification(
	params: SendWhatsAppParams,
): Promise<WhatsAppDispatchResult> {
	try {
		return await WhatsAppService.sendWhatsAppMessage(params);
	} catch (error: any) {
		console.error("[safeDispatchNotification] Unexpected exception:", error);
		return {
			success: false,
			error: error?.message || "Unexpected exception during dispatch",
		};
	}
}

export const sendWhatsAppMessage =
	WhatsAppService.sendWhatsAppMessage.bind(WhatsAppService);
