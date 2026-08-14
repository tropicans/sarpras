# Milestones

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
