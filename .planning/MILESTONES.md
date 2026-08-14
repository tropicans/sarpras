# Milestones

## v1.2 WhatsApp Integration (Shipped: 2026-08-14)

**Phases completed:** 1 phase (Phase 7), 2 plans, 5 tasks, 22 automated tests (53 total passing)

**Key accomplishments:**

1. Built core Fonnte WhatsApp API gateway client with Indonesian phone number normalizer (`phone.ts`), safe mock logger fallback for dev/test environments, and robust audit dispatch logging (`service.ts`).
2. Engineered Indonesian markdown message template engine (`templates.ts`) with Asia/Jakarta WIB wall-clock time formatting, deep tracking URLs, and mandatory rejection reason formatting.
3. Integrated non-blocking post-commit async notification triggers into `BookingService.createBookingRequest` sending confirmation messages to requesters and operational alerts to administrators.
4. Integrated requester approval and rejection WhatsApp notifications into `BookingService.approveBooking` and `BookingService.rejectBooking` with structured status tracking links and rejection reasons.
5. Implemented comprehensive test suites (`phone.test.ts`, `templates.test.ts`, `service.test.ts`) validating 100% pass rate across mock fallbacks, phone sanitization, template builders, and non-blocking lifecycle hooks.

---

## v1.1 RBAC Enforcement (Shipped: 2026-08-14)

**Phases completed:** 1 phase (Phase 6), 1 plan, 6 automated tests

**Key accomplishments:**

1. Defined role hierarchy ranks (admin, operator, pimpinan) and implemented email-based effective role resolution fallback in `role-helper.ts`.
2. Secured backend server function boundaries with strict min-role check middleware (`requireMinRole`) on all user management, audit logs, and booking administrative actions.
3. Implemented route-level checks and redirects for `/admin/users` and `/admin/audit` to redirect unauthorized roles back to `/admin`.
4. Dynamically hid navigation items in the sidebar and action shortcuts on the dashboard to reflect active user permissions.
5. Enforced view-only monitoring for the Pimpinan role by hiding all asset and booking actions (addition, editing, archive, approval, and rejection) in the UI and drawer components.
6. Verified RBAC integration with a new test suite confirming middleware rank checks and role hierarchy logic.

---

## v1.0 v1.0 MVP (Shipped: 2026-08-14)

**Phases completed:** 5 phases, 13 plans, 33 automated tests

**Key accomplishments:**

1. Established durable PostgreSQL schemas and idempotent legacy migration CLI importing assets, bookings, and users with zero credential leakage.
2. Built secure Better Auth session authentication, server boundary role hierarchy middleware, asset/schedule management, and instant session revocation on deactivation.
3. Engineered authoritative booking state machine, concurrency control (`SELECT FOR UPDATE`), dormitory shared capacity calculations, and append-only audit logging.
4. Delivered public discovery portal (`/`), privacy-safe schedule modals, responsive 3-step booking wizard (`/book/$assetId`), and token-based public tracking with self-service cancellation (`/status/$ref`).
5. Deployed administrative operations queue with slide-out review drawer and live conflict analysis (`/admin/bookings`), structured rejection modal with mandatory justification, monthly/weekly operations calendar (`/admin/calendar`), and system audit history explorer (`/admin/audit`).

---
