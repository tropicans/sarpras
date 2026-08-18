# Sarpras PPKASN

## What This Is

Sarpras PPKASN is a full-stack web application for managing facilities at Pusat Pengembangan Kompetensi Aparatur Sipil Negara. It lets visitors submit room and dormitory booking requests and track their status in real-time, while administrators manage assets, schedules, conflict detection, and approvals through a secure operational dashboard.

This project successfully replaced the legacy deployment with a maintainable TanStack Start implementation, a concurrency-safe booking workflow, complete legacy data migration, role-based access control (RBAC), automated dual-channel (Resend Email + Fonnte WhatsApp) notification workflows, and robust authentication security.

## Core Value

Users can confidently request an available room or dormitory, and administrators can make and track an accountable booking decision without conflicts or lost data.

## Current State

**Current Milestone:** Complete (v1.5 Shipped)
**Shipped:** v1.5 Dynamic Asset Facilities & Tags (2026-08-18)

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
- ✓ Database schema & migration for custom facilities/tags JSONB array on assets — validated in Phase 10: Dynamic Asset Facilities & Tags (v1.5).
- ✓ Asset CRUD server functions validate, persist, and retrieve custom facilities/tags list — validated in Phase 10: Dynamic Asset Facilities & Tags (v1.5).
- ✓ Admin asset management form provides UI to add, edit, and remove tags with category-based suggestions — validated in Phase 10: Dynamic Asset Facilities & Tags (v1.5).
- ✓ Public discovery asset cards display dynamic facility tags saved in the database — validated in Phase 10: Dynamic Asset Facilities & Tags (v1.5).
- ✓ Public discovery asset cards gracefully fall back to sensible category presets when tags are empty — validated in Phase 10: Dynamic Asset Facilities & Tags (v1.5).
- ✓ Asset schedule modal and booking page surfaces asset-specific facility badges — validated in Phase 10: Dynamic Asset Facilities & Tags (v1.5).

### Active

(None currently active — run `/gsd-new-milestone` to define next milestone scope)

### Out of Scope

- Native mobile applications — v1 is a responsive web application designed for mobile and desktop viewports.
- Hardware security keys (WebAuthn / FIDO2 / Passkeys) — TOTP Authenticator app (Google Authenticator, Microsoft Authenticator, Authy) and backup recovery codes are supported.
- SMS-based 2FA — TOTP authenticator app chosen for superior security and zero carrier cost.
- Asset image upload storage / CDN — v1 utilizes SVG badges and metadata tags for facility representation.

## Context

- Shipped v1.0 MVP, v1.1 RBAC Enforcement, v1.2 WhatsApp Integration, v1.3 Dual-Channel Notification Integration, v1.4 Google 2FA & Account Security, and v1.5 Dynamic Asset Facilities & Tags with 96 passing automated tests across 20 test suites.
- Tech Stack: TanStack Start, React 19, TypeScript, PostgreSQL (Neon / Drizzle ORM), Better Auth (Two-Factor Plugin with `allowPasswordless: true`), Tailwind CSS, Lucide React, date-fns-tz (Asia/Jakarta WIB), Resend Email API, Fonnte WhatsApp API.
- Codebase documentation and architecture maps are maintained in `.planning/codebase/`.

## Constraints

- **Backwards Compatibility**: Assets without custom facilities must seamlessly fall back to default type tags without runtime errors or layout breaks.
- **Admin UX**: Tag input must be intuitive with quick suggestion chips (presets) and arbitrary custom badge entry.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dynamic Facility Badges | Moving from static hardcoded strings in UI to database-persisted JSON arrays allows operators to customize exact equipment/facilities per room/field/dormitory. | ✓ Good — Shipped in v1.5 |

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
*Last updated: 2026-08-18 after v1.5 milestone*
