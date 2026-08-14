# Phase 7: WhatsApp Notification & Integration - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate Fonnte WhatsApp Gateway (`https://api.fonnte.com/send`) for automated booking confirmations, approval notifications, rejection messages (with reason and advice), and operational alerts to administrators/operators, powered by an asynchronous non-blocking dispatch layer and mock/logger fallback.

</domain>

<decisions>
## Implementation Decisions

### Template Pesan WhatsApp (Format & Structure)
- **D-01:** WhatsApp templates use a semi-formal structure with emoji status headers (📋 *PENGAJUAN BOOKING BARU*, ✅ *PERMOHONAN DISETUJUI*, ❌ *PERMOHONAN DITOLAK*, 🔔 *ALERT OPERATOR*), bold key-value fields (Kode Referensi, Fasilitas, Jadwal WIB, Pemohon), tracking links, and institutional footer.
- **D-02:** Tracking and admin action links embedded in messages are dynamically constructed using `APP_BASE_URL` (production default: `https://sarpras.ppkasn.id`, fallback `http://localhost:3000` in local dev).
- **D-03:** Rejection notification messages explicitly include `*Alasan Penolakan:* [rejectionReason]` plus contact recommendations or suggestions for alternative booking slots.

### Format & Validasi Nomor Telepon (Sanitization)
- **D-04:** Aggressive phone number sanitization: strip non-numeric characters, normalize Indonesian prefixes (`08...` and `+628...` become `628...`), and validate standard length (10–15 digits). If empty or invalid, safely skip WhatsApp dispatch with a warning log without throwing runtime exceptions or blocking database operations.
- **D-05:** Public booking wizard form includes explicit UI hint ("Nomor WhatsApp Aktif: contoh 08123456789") with client/server validation in the Zod schema.

### Target Notifikasi Admin & Operator
- **D-06:** `FONNTE_ADMIN_TARGET` supports single phone numbers, comma-separated numbers (`628111,628222`), or Fonnte WhatsApp Group IDs (`120363xxx@g.us`). The WhatsApp service automatically dispatches to individual numbers or groups as configured.
- **D-07:** Admin operational alerts are triggered on: (1) New pending booking submission (WA-07, WA-08), and (2) Self-service booking cancellation by the requester.

### Logging & Audit Dispatch Notifikasi
- **D-08:** Every notification dispatch attempt is logged to the PostgreSQL `audit_logs` table (`action: "notification.whatsapp_dispatch"`, `entityType: "booking"`, `metadata` containing target, template type, status `success`/`failed`/`mock`, and gateway response/error details).
- **D-09:** When `FONNTE_API_TOKEN` is missing, in development, or in automated test environments, the system uses a Pretty-printed Mock Logger that prints structured WhatsApp message boxes to the console and returns simulated success payloads so test suites and dev workflows execute cleanly.
- **D-10:** All WhatsApp network requests run asynchronously in a non-blocking execution block (`void dispatchNotification(...)` or safe try/catch wrapper) so Fonnte API latency, timeouts, or downtime never rollback or delay PostgreSQL booking transactions.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — WhatsApp Notification & Integration requirements (WA-01 to WA-08).
- `.planning/ROADMAP.md` § Phase 7 — Milestone v1.2 scope and success criteria.
- `.planning/PROJECT.md` — Project context, constraints, and key architectural decisions.

### Existing Domain Services
- `src/lib/booking/service.server.ts` — Core transactional booking operations (`createBookingRequest`, `approveBooking`, `rejectBooking`, `cancelBooking`).
- `src/lib/audit/audit.server.ts` — Immutable audit logging service (`recordAuditEvent`).
- `src/lib/timezone/datetime.ts` — Date/time normalization and formatting for Asia/Jakarta (WIB).
- `src/db/schema.ts` — Drizzle schema for bookings and audit logs.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `recordAuditEvent` in `src/lib/audit/audit.server.ts`: Reusable for recording `notification.whatsapp_dispatch` events with detailed metadata.
- `formatDisplayDate` / `formatDisplayTime` in `src/lib/timezone/datetime.ts`: Reusable for formatting start/end times in Indonesian WIB representation for message templates.
- Booking schemas & types in `src/lib/booking/types.ts`: Reusable booking data models for template payloads.

### Established Patterns
- Server-side isolation (`*.server.ts`): External API calls and token access remain strictly on the server.
- Transaction integrity: External API side-effects must not execute inside database transaction locks; side-effects run post-commit or via decoupled async dispatch.

### Integration Points
- `BookingService.createBookingRequest`: Trigger submission confirmation to requester and operational alert to admin.
- `BookingService.approveBooking`: Trigger approval notification to requester.
- `BookingService.rejectBooking`: Trigger rejection notification with reason to requester.
- `BookingService.cancelBooking`: Trigger cancellation alert to admin / requester.

</code_context>

<specifics>
## Specific Ideas

- Semi-formal WhatsApp message formatting with distinct emoji headers and clear bold summary lines.
- Pretty console mock output during local development:
  ```
  ┌─────────────────────────────────────────────────────────────┐
  │ [MOCK WHATSAPP] To: 6281234567890                           │
  │ 📋 *PENGAJUAN BOOKING SARPRAS PPKASN*                       │
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

- Interactive two-way chatbot / WhatsApp interactive buttons (future milestone).
- SMS gateway / Email notification channels.

</deferred>

---

*Phase: 07-whatsapp-notification-integration*
*Context gathered: 2026-08-14*
