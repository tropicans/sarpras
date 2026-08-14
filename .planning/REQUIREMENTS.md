# Requirements: Milestone v1.2 - WhatsApp Notification & Integration

## Core Value
Users (requesters) receive instant, reliable WhatsApp updates on their booking status (submission, approval, and rejection with reasons), while administrators and operators receive real-time operational notifications for new incoming requests.

## Requirements

### WhatsApp Service & Gateway Layer

- [ ] **WA-01**: System can send WhatsApp text messages via Fonnte API (`https://api.fonnte.com/send`) using a configured authorization token (`FONNTE_API_TOKEN`).
- [ ] **WA-02**: System provides an automatic mock/logger fallback provider when `FONNTE_API_TOKEN` is missing or in test/development mode to prevent runtime errors.
- [ ] **WA-03**: System dispatches WhatsApp notifications asynchronously and non-blockingly so external gateway latency or failures never roll back database transactions.

### Requester Notifications

- [ ] **WA-04**: System automatically sends a WhatsApp confirmation message to the requester upon successful booking submission, including reference code, asset details, scheduled times, and tracking link.
- [ ] **WA-05**: System automatically sends a WhatsApp notification to the requester when their booking is approved, including reference code, asset location, and schedule confirmation.
- [ ] **WA-06**: System automatically sends a WhatsApp notification to the requester when their booking is rejected, including reference code and the explicit rejection reason.

### Administrative Operational Notifications

- [ ] **WA-07**: System automatically dispatches an alert message to configured operator/admin WhatsApp contact numbers (`FONNTE_ADMIN_TARGET`) when a new pending booking is submitted.
- [ ] **WA-08**: Administrative alert messages provide a structured summary and direct URL link to the admin booking review queue.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WA-01 | Phase 7 | Pending |
| WA-02 | Phase 7 | Pending |
| WA-03 | Phase 7 | Pending |
| WA-04 | Phase 7 | Pending |
| WA-05 | Phase 7 | Pending |
| WA-06 | Phase 7 | Pending |
| WA-07 | Phase 7 | Pending |
| WA-08 | Phase 7 | Pending |

---
*Requirements defined: 2026-08-14*
