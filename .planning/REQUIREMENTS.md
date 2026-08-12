# Requirements: Sarpras PPKASN

**Defined:** 2026-08-12
**Core Value:** Users can confidently request an available room or dormitory, and administrators can make and track an accountable booking decision without conflicts or lost data.

## v1 Requirements

### Data Foundation & Migration

- [ ] **DATA-01**: Administrator can run an idempotent migration that imports legacy assets, bookings, and administrator accounts using preserved source identifiers.
- [ ] **DATA-02**: Administrator can review a migration reconciliation report containing source, imported, rejected, and exception counts without exposing credentials.
- [ ] **DATA-03**: System preserves legacy booking history and links each migrated booking to its migrated asset and requester data.
- [ ] **DATA-04**: System stores all booking date-time values with an explicit `Asia/Jakarta` interpretation and records the normalized value durably.

### Administrator Access

- [ ] **AUTH-01**: Administrator can sign in with a migrated or newly provisioned account using an email-and-password flow.
- [ ] **AUTH-02**: Administrator session remains protected by secure server-side session handling and can be ended by logout.
- [ ] **AUTH-03**: System enforces roles and permissions on every administrative data read and mutation, not only in the user interface.
- [ ] **AUTH-04**: Authorized administrator can deactivate an administrator account and revoke that account's active sessions.

### Assets & Availability

- [ ] **ASSET-01**: Authorized administrator can create and edit room and dormitory assets with name, type, location, capacity, and bookable status.
- [ ] **ASSET-02**: Authorized administrator can set operating availability and date-specific closures for an asset.
- [ ] **ASSET-03**: Authorized administrator can archive an asset without deleting its historical bookings or audit records.
- [ ] **ASSET-04**: Visitor can browse rooms and dormitories and filter availability by type and requested date/time without seeing another requester's personal data.

### Public Booking

- [ ] **BOOK-01**: Visitor can submit a responsive, accessible room booking request with requester, organization, contact, purpose, attendance, asset, date, and time details.
- [ ] **BOOK-02**: Visitor can submit a responsive, accessible dormitory booking request with the required stay dates and requester details.
- [ ] **BOOK-03**: System validates required fields, dates, times, capacity, operating availability, and closures before accepting a public request.
- [ ] **BOOK-04**: System returns a non-guessable reference and a clear `pending` confirmation after a valid request is submitted.
- [ ] **BOOK-05**: Visitor can view the privacy-safe status of a request using its reference without gaining access to administrative data.

### Booking Decisions & Integrity

- [ ] **FLOW-01**: System manages each booking through explicit `pending`, `approved`, `rejected`, and `cancelled` states.
- [ ] **FLOW-02**: Authorized administrator can review pending requests with the relevant asset, schedule, requester, and conflict context.
- [ ] **FLOW-03**: Authorized administrator can approve or reject a pending request, recording an explanation for rejections.
- [ ] **FLOW-04**: System prevents overlapping approved reservations for the same asset during concurrent booking or approval actions.
- [ ] **FLOW-05**: System rechecks authoritative availability when a booking is created or approved rather than relying solely on a client-side calendar.

### Operations & Audit

- [ ] **OPS-01**: Authorized administrator can use a dashboard to view summary counts and filter bookings by status, asset type, and date range.
- [ ] **OPS-02**: Authorized administrator can view an asset-centric administrative calendar showing booking and closure context.
- [ ] **OPS-03**: System records an append-only audit event for each migration, booking-state decision, material booking change, and administrative asset change.
- [ ] **OPS-04**: Authorized administrator can view audit history with actor, timestamp, action, and affected record context.

## v2 Requirements

### Notifications & Self-Service

- **NOTF-01**: Visitor receives email notifications for submission and booking-status changes.
- **BOOK-06**: Verified requester can cancel or reschedule a booking through a self-service flow.

### Integrations & Advanced Policy

- **INTG-01**: System synchronizes approved bookings with an external calendar.
- **INTG-02**: System sends booking notifications through SMS or a messaging channel.
- **POLY-01**: Authorized administrator can configure advanced per-asset booking policies through a generalized rule builder.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile application | A responsive web experience is the v1 delivery surface. |
| Payment collection | It does not support the core institutional request-and-approval workflow. |
| Public user registration | Public users submit requests; administrative identities are provisioned and migrated. |
| Waitlist and recurring booking series | Add policy and operational complexity before basic booking integrity is proven. |
| Public visibility of booking/requester details | Availability must be useful without disclosing personal or institutional information. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| AUTH-04 | Phase 2 | Pending |
| ASSET-01 | Phase 2 | Pending |
| ASSET-02 | Phase 2 | Pending |
| ASSET-03 | Phase 2 | Pending |
| ASSET-04 | Phase 4 | Pending |
| BOOK-01 | Phase 4 | Pending |
| BOOK-02 | Phase 4 | Pending |
| BOOK-03 | Phase 4 | Pending |
| BOOK-04 | Phase 4 | Pending |
| BOOK-05 | Phase 4 | Pending |
| FLOW-01 | Phase 3 | Pending |
| FLOW-02 | Phase 5 | Pending |
| FLOW-03 | Phase 5 | Pending |
| FLOW-04 | Phase 3 | Pending |
| FLOW-05 | Phase 3 | Pending |
| OPS-01 | Phase 5 | Pending |
| OPS-02 | Phase 5 | Pending |
| OPS-03 | Phase 3 | Pending |
| OPS-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-12*
*Last updated: 2026-08-12 after roadmap creation*
