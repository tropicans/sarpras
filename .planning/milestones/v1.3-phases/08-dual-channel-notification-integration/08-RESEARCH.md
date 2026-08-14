# Phase 8: Dual-Channel Notification Integration - Research

**Researched:** 2026-08-14
**Status:** Complete

## Executive Summary

Phase 8 introduces transactional email delivery powered by Resend (`https://api.resend.com/emails`) alongside the existing Fonnte WhatsApp integration (established in Phase 7). This creates a resilient, dual-channel notification system for Sarpras PPKASN.

The technical architecture follows a lightweight, dependency-free design utilizing standard `fetch` for Resend REST API calls, structured HTML/plaintext template builders with Asia/Jakarta (WIB) time formatting, an isolated mock provider for local development and CI testing, and an asynchronous dual-channel orchestrator employing `Promise.allSettled` so that third-party gateway latency or network errors never impact database transactions or user response times.

---

## 1. Resend API Architecture & Integration Pattern

### 1.1. Gateway API Specification
- **Endpoint:** `POST https://api.resend.com/emails`
- **Authentication:** `Authorization: Bearer ${RESEND_API_KEY}`
- **Headers:** `Content-Type: application/json`
- **Request Payload:**
  ```json
  {
    "from": "PPKASN Sarpras <onboarding@resend.dev>",
    "to": ["requester@example.com"],
    "subject": "Konfirmasi Pengajuan Peminjaman Fasilitas PPKASN",
    "html": "<!DOCTYPE html>...",
    "text": "Plaintext version..."
  }
  ```
- **Response Format:**
  - Success (HTTP 200/201): `{"id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"}`
  - Error (HTTP 4xx/5xx): `{"name": "validation_error", "message": "The to field is required."}`

### 1.2. Environment Variables & Defaults
| Variable | Description | Default / Fallback |
|---|---|---|
| `RESEND_API_KEY` | Resend API Bearer Token | `undefined` (triggers mock mode) |
| `RESEND_MOCK` | Explicit toggle to force mock mode | `"false"` (or `"true"` in tests) |
| `EMAIL_FROM` | Transactional sender address | `"PPKASN Sarpras <onboarding@resend.dev>"` |
| `ADMIN_DEFAULT_EMAIL` | Admin recipient email address(es) | `"admin@ppkasn.go.id"` (supports comma-separated) |
| `APP_BASE_URL` | Base URL for action CTAs & tracking links | `http://localhost:3000` (or `https://sarpras.ppkasn.id`) |

### 1.3. Mock Logger Fallback (EMAIL-02)
When `RESEND_API_KEY` is not configured, `RESEND_MOCK=true`, or `NODE_ENV === "test"`, the email service switches to mock mode:
- Generates a mock identifier: `mock-email-${Date.now()}-${random}`
- Emits formatted ASCII debug box to `console.log`
- Records audit log with `status: "mock"`, `provider: "resend_mock"`
- Returns `{ success: true, mock: true, messageId: mockId }`

---

## 2. Email Template Engine (Responsive HTML & Plaintext)

### 2.1. Design System & Constraints
To ensure compatibility across major email clients (Gmail, Outlook, Apple Mail, Yahoo), templates use inline CSS and structured tables:
- **Container:** Max width 600px, centered, neutral `#f8fafc` background.
- **Card:** White `#ffffff`, 8px border-radius, subtle border `#e2e8f0`.
- **Palette:**
  - Navy Primary: `#1e3a8a` (Header, borders, primary action buttons)
  - Pending Badge: `#fef3c7` bg, `#92400e` text (Amber)
  - Approved Badge: `#dcfce7` bg, `#166534` text (Green)
  - Rejected Badge: `#fee2e2` bg, `#991b1b` text (Red)
  - Neutral / Muted: `#64748b`
- **Typography:** System fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`).
- **Date/Time Display:** Asia/Jakarta (WIB) wall-clock formatting (`dd/MM/yyyy HH:mm 'WIB'`).

### 2.2. Dual-Body Output (HTML & Plaintext)
Every template generator returns `{ subject: string, html: string, text: string }`.

1. **`buildBookingSubmissionRequesterEmail` (EMAIL-05)**:
   - Subject: `[Sarpras PPKASN] Konfirmasi Pengajuan Booking - #{bookingRef}`
   - Details: Requester name, asset name & location, start/end WIB schedule, purpose, status "Menunggu Persetujuan".
   - CTA: "Cek Status Permohonan" (`{baseUrl}/check-booking?ref={bookingRef}`).

2. **`buildBookingSubmissionAdminEmail` (EMAIL-06)**:
   - Subject: `[Sarpras PPKASN] Permohonan Booking Baru Butuh Verifikasi - #{bookingRef}`
   - Details: Requester name, organization, asset name, start/end schedule, attendance, purpose.
   - CTA: "Tinjau di Panel Admin" (`{baseUrl}/admin/approval`).

3. **`buildBookingApprovalEmail` (EMAIL-07)**:
   - Subject: `[Sarpras PPKASN] Pengajuan Booking DISETUJUI - #{bookingRef}`
   - Details: Asset name & location, confirmed schedule, notes/guidelines.
   - CTA: "Lihat Rincian Booking" (`{baseUrl}/check-booking?ref={bookingRef}`).

4. **`buildBookingRejectionEmail` (EMAIL-08)**:
   - Subject: `[Sarpras PPKASN] Pengajuan Booking DITOLAK - #{bookingRef}`
   - Details: Asset name, schedule, highlighted rejection reason box.
   - CTA: "Cek Status Permohonan" (`{baseUrl}/check-booking?ref={bookingRef}`).

5. **`buildBookingCancellationEmail`**:
   - Subject: `[Sarpras PPKASN] Pengajuan Booking DIBATALKAN - #{bookingRef}`
   - Details: Asset name, schedule, cancellation reason (if any).

---

## 3. Dual-Channel Notification Orchestrator

### 3.1. Concurrency & Failure Isolation (NOTIF-01, EMAIL-04)
The unified notification orchestrator (`src/lib/notifications/service.server.ts`) triggers dispatches after database transaction commits:
- Uses `Promise.allSettled` across all dispatch promises.
- Dispatches:
  1. WhatsApp to Requester (if `requesterPhone` is present and valid).
  2. Email to Requester (if `requesterEmail` is present and valid).
  3. WhatsApp to Admin (if `FONNTE_ADMIN_TARGET` is configured, on submission).
  4. Email to Admins (for each comma-separated email in `ADMIN_DEFAULT_EMAIL`, on submission).
- Non-blocking execution (`void safeDispatchBookingNotifications(...)`).

### 3.2. Email Address Validation & Sanitization (EMAIL-03)
- Trim and lowercase input email.
- Regex validation against standard RFC 5322 compliant pattern.
- If email is missing or malformed, log a warning and return `{ success: false, error: "..." }` without throwing.

---

## 4. Multi-Channel Audit Logging (NOTIF-02)

Dispatches record immutable events in the PostgreSQL `audit_logs` table via `recordAuditEvent`:
- **Email:** `action: "notification.email_dispatch"`
- **WhatsApp:** `action: "notification.whatsapp_dispatch"`
- **Metadata schema:**
  ```json
  {
    "target": "requester@example.com",
    "template": "BOOKING_SUBMITTED_REQUESTER",
    "status": "sent" | "mock" | "failed",
    "provider": "resend" | "resend_mock" | "fonnte" | "fonnte_mock",
    "messageId": "...",
    "error": "...",
    "timestamp": "2026-08-14T04:50:00.000Z"
  }
  ```

---

## 5. Validation Architecture & Test Strategy

### 5.1. Automated Test Boundaries
1. **Email Templates Test (`src/lib/email/templates.test.ts`)**:
   - Verify HTML structure, headers, color badges, button URLs, and plaintext outputs.
   - Verify WIB date/time representations.
   - Verify XSS escaping for user-supplied strings (requesterName, purpose, rejectionReason).

2. **Email Service Test (`src/lib/email/service.test.ts`)**:
   - Verify email validation and sanitization.
   - Verify mock mode outputs and audit logging.
   - Verify HTTP payload structure and header formatting with mocked `fetch`.
   - Verify graceful failure handling and error return types.

3. **Notification Orchestrator Test (`src/lib/notifications/service.test.ts`)**:
   - Verify dual dispatch when both phone and email are provided.
   - Verify single dispatch when only phone or only email is provided.
   - Verify multi-admin email parsing and dispatch.
   - Verify fault isolation (email failure does not prevent WhatsApp dispatch and vice versa).

---

## 6. Implementation Plan Decomposition

- **Plan 08-01: Resend Email Gateway Service & Responsive Templates**
  - Implement `src/lib/email/types.ts`, `src/lib/email/templates.ts`, `src/lib/email/service.server.ts`.
  - Implement unit tests in `src/lib/email/templates.test.ts` and `src/lib/email/service.test.ts`.

- **Plan 08-02: Unified Dual-Channel Notification Orchestrator & Booking Integration**
  - Implement `src/lib/notifications/types.ts` and `src/lib/notifications/service.server.ts`.
  - Refactor `src/lib/booking/service.server.ts` to dispatch via the unified orchestrator.
  - Implement integration tests in `src/lib/notifications/service.test.ts`.
  - Update `package.json` test script.
