import { recordAuditEvent } from "../audit/audit.server";
import type { EmailDispatchResult, SendEmailParams } from "./types";

const RFC_5322_EMAIL_REGEX =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Sanitizes and validates an email address.
 * Returns normalized lowercase email string if valid, or null if invalid/empty.
 */
export function sanitizeEmail(email: unknown): string | null {
	if (typeof email !== "string") return null;
	const trimmed = email.trim().toLowerCase();
	if (!trimmed || trimmed.length > 254) return null;
	if (!RFC_5322_EMAIL_REGEX.test(trimmed)) return null;
	return trimmed;
}

/**
 * Sanitizes a single email string, comma-separated list of emails, or array of emails.
 * Deduplicates and filters out invalid addresses.
 */
export function sanitizeEmailList(emails: unknown): string[] {
	if (!emails) return [];

	let candidates: string[] = [];
	if (Array.isArray(emails)) {
		candidates = emails.flatMap((item) =>
			typeof item === "string" ? item.split(",") : [],
		);
	} else if (typeof emails === "string") {
		candidates = emails.split(",");
	}

	const sanitizedSet = new Set<string>();
	for (const candidate of candidates) {
		const valid = sanitizeEmail(candidate);
		if (valid) {
			sanitizedSet.add(valid);
		}
	}

	return Array.from(sanitizedSet);
}

export class EmailService {
	/**
	 * Sends a transactional email via Resend API, falling back to structured console mock
	 * when in test/development mode or when RESEND_API_KEY is not configured.
	 */
	static async sendEmail(
		params: SendEmailParams,
	): Promise<EmailDispatchResult> {
		const sanitizedTo = sanitizeEmailList(params.to);

		if (sanitizedTo.length === 0) {
			const errorMsg = `Invalid or empty recipient email(s): "${JSON.stringify(params.to)}"`;
			console.warn(`[EmailService] ${errorMsg}`);

			if (params.bookingId) {
				try {
					await recordAuditEvent(null, {
						actorId: "system:email",
						actorType: "system",
						action: "notification.email_dispatch",
						entityType: "booking",
						entityId: params.bookingId,
						metadata: {
							rawTarget: params.to,
							template: params.templateType || null,
							status: "failed",
							error: errorMsg,
							timestamp: new Date().toISOString(),
						},
					});
				} catch (auditErr) {
					console.error("[EmailService] Failed to record audit log:", auditErr);
				}
			}

			return { success: false, error: errorMsg };
		}

		const apiKey = process.env.RESEND_API_KEY?.trim();
		const isMockMode =
			!apiKey ||
			process.env.RESEND_MOCK === "true" ||
			process.env.NODE_ENV === "test";

		// 1. Mock Mode Fallback (EMAIL-02)
		if (isMockMode) {
			const mockId = `mock-email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
			const fromAddr =
				process.env.EMAIL_FROM?.trim() ||
				"Sarpras PPKASN <noreply@sarpras.ppkasn.id>";
			const toStr = sanitizedTo.join(", ");

			console.log(
				`\n┌── [MOCK RESEND EMAIL DISPATCH] ─────────────────────┐\n` +
					`│ To       : ${toStr.padEnd(41)} │\n` +
					`│ From     : ${fromAddr.padEnd(41)} │\n` +
					`│ Subject  : ${params.subject.slice(0, 41).padEnd(41)} │\n` +
					`│ Template : ${(params.templateType || "CUSTOM").padEnd(41)} │\n` +
					`│ Booking  : ${(params.bookingId || "-").padEnd(41)} │\n` +
					`├─────────────────────────────────────────────────────┤\n` +
					`${params.text
						.split("\n")
						.slice(0, 10)
						.map((line) => `│ ${line.slice(0, 51).padEnd(51)} │`)
						.join("\n")}\n` +
					`└─────────────────────────────────────────────────────┘\n`,
			);

			if (params.bookingId) {
				try {
					await recordAuditEvent(null, {
						actorId: "system:email",
						actorType: "system",
						action: "notification.email_dispatch",
						entityType: "booking",
						entityId: params.bookingId,
						metadata: {
							target: sanitizedTo,
							template: params.templateType || null,
							status: "mock",
							provider: "resend_mock",
							messageId: mockId,
							subject: params.subject,
							timestamp: new Date().toISOString(),
						},
					});
				} catch (auditErr) {
					console.error("[EmailService] Failed to record audit log:", auditErr);
				}
			}

			return {
				success: true,
				mock: true,
				messageId: mockId,
			};
		}

		// 2. Real HTTP Dispatch via Resend API (EMAIL-01)
		const from =
			process.env.EMAIL_FROM?.trim() ||
			"Sarpras PPKASN <noreply@sarpras.ppkasn.id>";

		try {
			const response = await fetch("https://api.resend.com/emails", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					from,
					to: sanitizedTo,
					subject: params.subject,
					html: params.html,
					text: params.text,
				}),
				signal: AbortSignal.timeout(10000),
			});

			const data = (await response.json()) as {
				id?: string;
				message?: string;
				name?: string;
			};
			const isSuccess = response.ok && !!data?.id;
			const errorReason = isSuccess
				? undefined
				: data?.message || `HTTP ${response.status}: ${response.statusText}`;

			if (params.bookingId) {
				try {
					await recordAuditEvent(null, {
						actorId: "system:email",
						actorType: "system",
						action: "notification.email_dispatch",
						entityType: "booking",
						entityId: params.bookingId,
						metadata: {
							target: sanitizedTo,
							template: params.templateType || null,
							status: isSuccess ? "success" : "failed",
							provider: "resend",
							messageId: data?.id || null,
							response: data,
							error: errorReason || null,
							timestamp: new Date().toISOString(),
						},
					});
				} catch (auditErr) {
					console.error("[EmailService] Failed to record audit log:", auditErr);
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
				err?.message || "Unknown network error during email dispatch";
			console.error(
				"[EmailService] Error dispatching email to Resend:",
				errorMsg,
			);

			if (params.bookingId) {
				try {
					await recordAuditEvent(null, {
						actorId: "system:email",
						actorType: "system",
						action: "notification.email_dispatch",
						entityType: "booking",
						entityId: params.bookingId,
						metadata: {
							target: sanitizedTo,
							template: params.templateType || null,
							status: "failed",
							provider: "resend",
							error: errorMsg,
							timestamp: new Date().toISOString(),
						},
					});
				} catch (auditErr) {
					console.error("[EmailService] Failed to record audit log:", auditErr);
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
 * Non-blocking, safe wrapper to trigger email dispatch as a side-effect.
 * Ensures uncaught promise rejections or gateway failures never disrupt caller transactions.
 */
export async function safeDispatchEmail(
	params: SendEmailParams,
): Promise<EmailDispatchResult> {
	try {
		return await EmailService.sendEmail(params);
	} catch (error: any) {
		console.error("[safeDispatchEmail] Unexpected exception:", error);
		return {
			success: false,
			error: error?.message || "Unexpected exception during email dispatch",
		};
	}
}

export const sendEmail = EmailService.sendEmail.bind(EmailService);
