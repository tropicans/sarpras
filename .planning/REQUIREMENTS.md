# Requirements: Milestone v1.3 - Dual-Channel Notification Integration

## Core Value

Requesters and administrators receive reliable, timely, and branded transactional email notifications via Resend in tandem with WhatsApp alerts, guaranteeing operational awareness and transparent status updates across multiple communication channels.

## Requirements

### Email Service & Resend Adapter Layer

- [x] **EMAIL-01**: System can send transactional emails via Resend API using configured `RESEND_API_KEY` and `EMAIL_FROM` sender address.
- [x] **EMAIL-02**: System provides an automatic mock/logger fallback provider when `RESEND_API_KEY` is missing or in test/development mode to prevent runtime errors.
- [x] **EMAIL-03**: System validates and sanitizes recipient email addresses, with graceful handling of missing or malformed addresses.
- [x] **EMAIL-04**: System dispatches email notifications asynchronously and non-blockingly so external gateway latency or failures never affect database transactions.

### Email Templates (Responsive HTML & Plaintext)

- [x] **EMAIL-05**: System renders a responsive Indonesian booking submission confirmation email to the requester with reference code, asset details, Asia/Jakarta (WIB) schedule, and tracking link.
- [x] **EMAIL-06**: System renders an operational alert email to configured administrator recipients (`ADMIN_DEFAULT_EMAIL`) when a new pending booking is submitted, with requester details and a direct URL to the review queue.
- [x] **EMAIL-07**: System renders an approval notification email to the requester upon booking approval with asset location, schedule confirmation, notes, and tracking link.
- [x] **EMAIL-08**: System renders a rejection notification email to the requester upon booking rejection including reference code, mandatory rejection reason, and tracking link.

### Dual-Channel Orchestration & Audit Logging

- [x] **NOTIF-01**: System unifies notification triggers in `BookingService` lifecycle hooks (`createBookingRequest`, `approveBooking`, `rejectBooking`) to dispatch both Email (Resend) and WhatsApp (Fonnte) notifications concurrently.
- [x] **NOTIF-02**: Notification dispatch logging records channel-specific execution (`email` vs `whatsapp`), recipient target, reference code, dispatch status (`sent`, `failed`, `mocked`), timestamp, and error details.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EMAIL-01 | Phase 8 | Complete |
| EMAIL-02 | Phase 8 | Complete |
| EMAIL-03 | Phase 8 | Complete |
| EMAIL-04 | Phase 8 | Complete |
| EMAIL-05 | Phase 8 | Complete |
| EMAIL-06 | Phase 8 | Complete |
| EMAIL-07 | Phase 8 | Complete |
| EMAIL-08 | Phase 8 | Complete |
| NOTIF-01 | Phase 8 | Complete |
| NOTIF-02 | Phase 8 | Complete |

---
*Requirements defined: 2026-08-14*
