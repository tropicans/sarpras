# Sarpras PPKASN

## What This Is

Sarpras PPKASN is a full-stack web application for managing facilities at Pusat Pengembangan Kompetensi Aparatur Sipil Negara. It lets visitors submit room and dormitory booking requests and track their status in real-time, while administrators manage assets, schedules, conflict detection, and approvals through a secure operational dashboard.

This project successfully replaced the legacy deployment with a maintainable TanStack Start implementation, a concurrency-safe booking workflow, and complete migration of legacy assets, bookings, and administrator accounts.

## Core Value

Users can confidently request an available room or dormitory, and administrators can make and track an accountable booking decision without conflicts or lost data.

## Requirements

### Validated

- ✓ A TanStack Start application can render a public route — existing `src/routes/index.tsx`.
- ✓ File-based routing and the application shell are established — existing `src/router.tsx` and `src/routes/__root.tsx`.
- ✓ Durable storage and migrated legacy assets, bookings, and administrator accounts — validated in Phase 1: Canonical Data & Migration.
- ✓ Authenticated, role-based administration for assets, schedules, and user management — validated in Phase 2: Secure Administration & Asset Setup.
- ✓ Explicit booking state machine, concurrency controls, and immutable audit logs — validated in Phase 3: Booking Integrity & Audit Core.
- ✓ Public discovery portal, privacy-safe schedules, responsive 3-step booking wizard, and self-service cancellation — validated in Phase 4: Public Discovery & Booking Requests.
- ✓ Administrative decision queue, live conflict analysis, operations calendar, KPI dashboard, and audit history explorer — validated in Phase 5: Administrative Decisions & Operations.
- ✓ Restricted administrative views, routes, and server function endpoints based on admin, operator, and pimpinan roles — validated in Phase 6: Role-Based Access Control.

### Active

- [ ] WhatsApp notification client service and environment configuration (Fonnte API adapter).
- [ ] Automated WhatsApp notifications sent to requester on booking submission (reference code & summary).
- [ ] Instant WhatsApp notification to administrator/operator group or numbers for pending reviews.
- [ ] Automated approval and rejection notification to requester with reasons and status tracking links.
- [ ] Safe delivery failure handling and notification audit logs.

### Out of Scope

- Native mobile applications — v1 is a responsive web application designed for mobile and desktop viewports.
- Replacing the organization’s upstream identity system — v1 migrates and manages the existing administrator accounts with Better Auth.
- Real-time chat or public social features — not relevant to facility booking workflows.
- Two-way interactive bot conversations — v1.2 focuses on transactional and operational push notifications.

## Context

- Shipped v1.0 MVP & v1.1 RBAC Enforcement with 31 passing automated tests.
- Tech Stack: TanStack Start, React 19, TypeScript, PostgreSQL (Neon / Drizzle ORM), Better Auth, Tailwind CSS, Lucide React, date-fns-tz (Asia/Jakarta WIB).
- Codebase documentation and architecture maps are maintained in `.planning/codebase/`.

## Constraints

- **Migration**: Existing assets, booking records, and administrator accounts preserved with historical relational integrity.
- **Compatibility**: Built on TanStack Start, React, TypeScript, Vite, Tailwind CSS, and Drizzle ORM.
- **Security**: Server boundary authorization, session revocation on deactivation, and privacy-safe public projections with zero PII exposure.
- **Availability**: Authoritative server-side booking conflict checks with PostgreSQL row-level locks (`SELECT FOR UPDATE`).
- **Resilience**: WhatsApp delivery failures should not roll back database booking transactions (asynchronous/non-blocking dispatch).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebuild the full application | The starter lacked domain workflows while legacy required a maintainable modern architecture. | ✓ Good — full-stack TanStack Start application shipped |
| Migrate assets, bookings, and administrator accounts | The replacement must preserve existing operational history. | ✓ Good — migrated via idempotent CLI importer with 100% test coverage |
| Enhance rather than clone the current application | The rebuilt product improves validation, conflict detection, usability, and audit tracking. | ✓ Good — privacy-safe schedule modals & live conflict drawer added |
| Prioritize booking integrity | Preventing double-bookings and retaining accountable decisions is the core value. | ✓ Good — transactional state machine with row locks & dormitory capacity calculations |
| Fonnte WhatsApp Gateway | Popular, reliable, and lightweight gateway for Indonesian numbers with straightforward token auth. | — Pending v1.2 implementation |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-14 for v1.2 WhatsApp Integration milestone start*
