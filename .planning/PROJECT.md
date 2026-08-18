# Sarpras PPKASN

## What This Is

Sarpras PPKASN is a full-stack web application for managing facilities at Pusat Pengembangan Kompetensi Aparatur Sipil Negara. It lets visitors submit room and dormitory booking requests and track their status in real-time, while administrators manage assets, schedules, conflict detection, and approvals through a secure operational dashboard.

This project successfully replaced the legacy deployment with a maintainable TanStack Start implementation, a concurrency-safe booking workflow, complete legacy data migration, role-based access control (RBAC), automated dual-channel (Resend Email + Fonnte WhatsApp) notification workflows, and robust authentication security.

## Core Value

Users can confidently request an available room or dormitory, and administrators can make and track an accountable booking decision without conflicts or lost data.

## Current State

**Shipped:** v1.4 Google 2FA & Account Security (2026-08-18)

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
- ✓ WhatsApp notification client service and environment configuration (Fonnte API adapter) with mock fallback and phone normalization — validated in Phase 7: WhatsApp Notification Integration.
- ✓ Automated WhatsApp notifications sent to requester on booking submission (reference code & summary) and operational alerts to administrators — validated in Phase 7: WhatsApp Notification Integration.
- ✓ Automated approval and rejection notification to requester with reasons and status tracking links — validated in Phase 7: WhatsApp Notification Integration.
- ✓ Non-blocking post-commit async dispatches and notification dispatch audit logging — validated in Phase 7: WhatsApp Notification Integration.
- ✓ Resend transactional email gateway integration with environment config (`RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_DEFAULT_EMAIL`), mock fallback, and RFC 5322 validation — validated in Phase 8: Dual-Channel Notification Integration.
- ✓ Responsive Indonesian HTML & plaintext email templates for booking submission confirmation, admin alerts, approval, and rejection with mandatory justification — validated in Phase 8: Dual-Channel Notification Integration.
- ✓ Unified dual-channel asynchronous orchestrator executing Email and WhatsApp dispatches concurrently via `Promise.allSettled` across all `BookingService` lifecycle hooks — validated in Phase 8: Dual-Channel Notification Integration.
- ✓ Channel-specific notification dispatch audit logging (`notification.email_dispatch` and `notification.whatsapp_dispatch`) — validated in Phase 8: Dual-Channel Notification Integration.
- ✓ Passwordless 2FA enablement, TOTP QR/secret setup, backup recovery codes, login challenges, and safe disabling — validated in Phase 9: Google 2FA Fix & Multi-Factor Security (v1.4).

### Active

(None currently active — define in next milestone via `/gsd-new-milestone`)

### Out of Scope

- Native mobile applications — v1 is a responsive web application designed for mobile and desktop viewports.
- Hardware security keys (WebAuthn / FIDO2 / Passkeys) — TOTP Authenticator app (Google Authenticator, Microsoft Authenticator, Authy) and backup recovery codes are supported.
- SMS-based 2FA — TOTP authenticator app chosen for superior security and zero carrier cost.
- Replacing the organization’s upstream identity system — v1 migrates and manages existing administrator accounts with Better Auth.

## Context

- Shipped v1.0 MVP, v1.1 RBAC Enforcement, v1.2 WhatsApp Integration, v1.3 Dual-Channel Notification Integration, and v1.4 Google 2FA & Account Security with 87 passing automated tests across 18 test suites.
- Tech Stack: TanStack Start, React 19, TypeScript, PostgreSQL (Neon / Drizzle ORM), Better Auth (Two-Factor Plugin with `allowPasswordless: true`), Tailwind CSS, Lucide React, date-fns-tz (Asia/Jakarta WIB), Resend Email API, Fonnte WhatsApp API.
- Codebase documentation and architecture maps are maintained in `.planning/codebase/`.

## Constraints

- **Security**: TOTP secrets and backup codes must remain encrypted in database storage.
- **Compatibility**: TanStack Start server functions and Better Auth client/server plugin consistency.
- **Resilience**: Two-factor authentication must not lock out valid Google OAuth administrators.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebuild the full application | The starter lacked domain workflows while legacy required a maintainable modern architecture. | ✓ Good — full-stack TanStack Start application shipped |
| Migrate assets, bookings, and administrator accounts | The replacement must preserve existing operational history. | ✓ Good — migrated via idempotent CLI importer with 100% test coverage |
| Enhance rather than clone the current application | The rebuilt product improves validation, conflict detection, usability, and audit tracking. | ✓ Good — privacy-safe schedule modals & live conflict drawer added |
| Prioritize booking integrity | Preventing double-bookings and retaining accountable decisions is the core value. | ✓ Good — transactional state machine with row locks & dormitory capacity calculations |
| Fonnte WhatsApp Gateway & Mock Logger | Standard Indonesian number normalizer, non-blocking post-commit dispatch, and console mock fallback. | ✓ Good — zero-latency impact on booking db transactions, full audit trail |
| Resend Email Gateway & Responsive Templates | Indonesian branded HTML/plaintext email delivery with RFC 5322 validation and mock logger fallback. | ✓ Good — professional transactional email communication with zero runtime errors |
| Concurrent Dual-Channel Orchestration (`Promise.allSettled`) | Simultaneously dispatches Email and WhatsApp notifications without letting one channel's failure affect the other. | ✓ Good — independent fault isolation and full audit visibility across both channels |
| Better Auth TOTP Two-Factor Plugin with `allowPasswordless: true` | Built-in twoFactor plugin provides standard RFC 6238 TOTP and encrypted backup codes without blocking passwordless/OAuth users. | ✓ Good — seamless 2FA enablement, recovery codes, and verification challenges |

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
*Last updated: 2026-08-18 after v1.4 milestone*
