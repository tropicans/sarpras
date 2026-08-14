# Phase 8: Dual-Channel Notification Integration - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate Resend Email Gateway (`https://api.resend.com/emails`) alongside the existing Fonnte WhatsApp Gateway for automated, reliable, and branded dual-channel notifications. Deliver responsive Indonesian HTML and plaintext email templates for booking submission confirmation, admin operational alerts, approval confirmations, and rejection notices (with reasons). Unify non-blocking asynchronous dispatches in `BookingService` lifecycle hooks with independent failure isolation, mock logger fallbacks, and multi-channel audit logging.

</domain>

<decisions>
## Implementation Decisions

### Desain & Struktur Template Email Resend (HTML & Plaintext)
- **D-01:** Responsive Indonesian HTML email templates featuring institutional PPKASN branding (header banner / institution title), status color badges (Pending: Amber/Yellow, Disetujui: Green, Ditolak: Red), structured table layout for Asia/Jakarta (WIB) schedules and facility details, prominent action CTA buttons ("Cek Status Permohonan" / "Tinjau Pengajuan"), and official footer.
- **D-02:** Dual-body dispatch: Every transactional email sent via Resend automatically includes both responsive HTML (`html`) and cleanly formatted plaintext (`text`) bodies for maximum email client accessibility and spam filter compliance.
- **D-03:** Dynamic URL resolution: Action CTA buttons and links use `APP_BASE_URL` (production default `https://sarpras.ppkasn.id`, development fallback `http://localhost:3002`).

### Strategi Orkestrasi Dual-Channel (Concurrency & Fault Isolation)
- **D-04:** Non-blocking concurrent dispatch (`Promise.allSettled`): `BookingService` triggers Email and WhatsApp dispatches concurrently after database transaction commit. Latency, network timeouts, or failures in one channel never affect or abort the other channel, and never rollback or delay PostgreSQL database booking operations.
- **D-05:** Graceful recipient handling:
  - If requester provides both email and valid phone: Dispatch to both Email (Resend) and WhatsApp (Fonnte).
  - If requester provides only email: Dispatch to Email, skip WhatsApp gracefully with informational log.
  - If requester provides only phone: Dispatch to WhatsApp, skip Email gracefully with informational log.
  - Email addresses are validated and sanitized (RFC 5322 regex / standard format check). Invalid or missing email addresses are skipped without throwing unhandled exceptions.

### Konfigurasi Notifikasi Admin & Mock Mode
- **D-06:** Multi-target Admin Emails: Parse `ADMIN_DEFAULT_EMAIL` supporting comma-separated lists (e.g. `admin@ppkasn.go.id,tropicans@gmail.com`). Send operational alert emails to all configured admin recipients upon new pending booking submissions.
- **D-07:** Resend Mock Logger: When `RESEND_API_KEY` is missing, when `RESEND_MOCK=true`, or in test/development environments, the system activates a Resend Mock Logger that outputs pretty-printed ASCII boxes of the email payload (To, From, Subject, Text snippet) to the console and returns simulated success results.

### Skema Audit Trail Dispatch Notifikasi
- **D-08:** Channel-specific audit actions: Log each channel dispatch attempt independently to the PostgreSQL `audit_logs` table:
  - Email dispatches: `action: "notification.email_dispatch"`
  - WhatsApp dispatches: `action: "notification.whatsapp_dispatch"`
  - Metadata payload includes: `target` (recipient email/phone), `templateType` (e.g., `BOOKING_SUBMITTED_REQUESTER`, `BOOKING_SUBMITTED_ADMIN`, `BOOKING_APPROVED`, `BOOKING_REJECTED`), `status` (`sent` | `mocked` | `failed`), `referenceCode` / `bookingId`, and `error` / `gatewayResponse` details.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — Milestone v1.3 Dual-Channel Notification Integration requirements (EMAIL-01 to EMAIL-08, NOTIF-01, NOTIF-02).
- `.planning/ROADMAP.md` § Phase 8 — Milestone v1.3 scope, deliverables, and success criteria.
- `.planning/PROJECT.md` — Project architecture, constraints, and operational decisions.

### Existing Domain Services & Notification Modules
- `src/lib/whatsapp/service.server.ts` — Fonnte WhatsApp dispatch service, mock logger, and safe wrapper.
- `src/lib/whatsapp/templates.ts` — Reference message templates and WIB datetime formatting.
- `src/lib/whatsapp/phone.ts` — Phone number sanitization and Indonesian normalization.
- `src/lib/booking/service.server.ts` — Core transactional booking operations (`createBookingRequest`, `approveBooking`, `rejectBooking`, `cancelBooking`).
- `src/lib/audit/audit.server.ts` — Immutable audit logging service (`recordAuditEvent`).
- `src/lib/timezone/datetime.ts` — Date/time normalization and formatting for Asia/Jakarta (WIB).
- `src/db/schema.ts` — Drizzle schema for bookings and audit logs.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `recordAuditEvent` in `src/lib/audit/audit.server.ts`: Reusable for recording `notification.email_dispatch` audit entries.
- `formatDisplayDate` / `formatDisplayTime` in `src/lib/timezone/datetime.ts`: Reusable for rendering consistent Indonesian WIB dates and times in email templates.
- Mock logging pattern in `src/lib/whatsapp/service.server.ts`: Pattern to emulate for Resend Mock Logger with structured console output.

### Established Patterns
- Server-side isolation (`*.server.ts`): API keys (`RESEND_API_KEY`, `FONNTE_API_TOKEN`) and outbound fetch calls remain strictly on the server.
- Post-commit async execution: Side effects execute outside database transactions (`SELECT FOR UPDATE` blocks) to protect ACID guarantees.
- Mock fallback for test suites: Test environment uses mock gateways to ensure zero flaky network dependencies and 100% test reliability.

### Integration Points
- `src/lib/email/service.server.ts` (New): Resend API adapter, email validator, mock logger, and dispatch functions.
- `src/lib/email/templates.ts` (New): HTML & plaintext email generators with Indonesian copy and branding.
- `src/lib/notifications/service.server.ts` (New / Unified Orchestrator): Orchestrates concurrent dual-channel dispatches for `BookingService`.
- `src/lib/booking/service.server.ts`: Hook into lifecycle events (`createBookingRequest`, `approveBooking`, `rejectBooking`, `cancelBooking`) via unified notification orchestrator.

</code_context>

<specifics>
## Specific Ideas

- Responsive HTML templates with container width 600px, clean border-radius, modern system fonts (`Geist`, `Inter`, `system-ui`), and clear action buttons.
- Pretty console mock output for Resend:
  ```
  ┌─────────────────────────────────────────────────────────────┐
  │ [MOCK RESEND EMAIL] To: requester@example.com                │
  │ Subject: Konfirmasi Pengajuan Peminjaman Fasilitas PPKASN   │
  │ Kode Ref : #BKG-12345                                       │
  │ Fasilitas: Auditorium Utama                                 │
  │ Jadwal   : 15 Ags 2026 08:00 - 16:00 WIB                    │
  │ Status   : Menunggu Persetujuan                             │
  │ Link     : https://sarpras.ppkasn.id/cek-status/abc           │
  └─────────────────────────────────────────────────────────────┘
  ```

</specifics>

<deferred>
## Deferred Ideas

- Inbound email webhook parsing / automatic replies (future milestone).
- PDF attachment generation (surat izin peminjaman / e-ticket) attached to approval emails (future enhancement).

</deferred>

---

*Phase: 08-dual-channel-notification-integration*
*Context gathered: 2026-08-14*
