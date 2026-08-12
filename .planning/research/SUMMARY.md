# Project Research Summary

**Project:** Sarpras PPKASN  
**Domain:** Public institutional room and dormitory reservation with administrative operations  
**Researched:** 2026-08-12  
**Confidence:** HIGH

## Executive Summary

Sarpras PPKASN should be rebuilt as a modular full-stack TanStack Start application backed by PostgreSQL, preserving the existing React, TypeScript, Vite, Tailwind, and Biome foundation. The MVP is an accountable public request and administrative decision system: visitors discover rooms or dormitories, submit a mobile-friendly request, and administrators securely manage assets, schedules, and approvals while retaining a complete operational history.

The core design decision is to make PostgreSQL—not the client calendar or a pre-submit check—the final authority on booking conflicts. A transactional booking service, half-open time ranges, and a database exclusion constraint must prevent overlapping capacity-reserving allocations under concurrent requests. Server-side authentication/RBAC, append-only audit events, and privacy-filtered public availability complete the trustworthy workflow.

The largest delivery risks are operational rather than visual: unrehearsed migration of assets, booking history, and administrator accounts; ambiguous policies for pending requests, dorm capacity, and timezones; and credentials whose legacy hash scheme is unknown. Address these with a mapping contract, staged and idempotent imports, reconciliation and cutover rehearsal, forced password reset where legacy verification is unsafe, and early stakeholder agreement on booking lifecycle and allocation rules.

## Key Findings

### Recommended Stack

Retain TanStack Start as the full-stack application boundary and deploy it in a Node-capable environment. Keep UI work in Tailwind and accessible, locally owned React components. Add PostgreSQL as the system of record, using Drizzle with checked-in migrations; use explicit SQL where PostgreSQL extensions and exclusion constraints are needed. Better Auth is a reasonable database-session option for the small internal administrator population, subject to validating the legacy credential format.

**Core technologies:**

- TanStack Start, React 19, TypeScript — typed routes, loaders, server functions, and middleware while preserving the current foundation.
- PostgreSQL 16+ — durable relational records, transactions, range types, and database-enforced overlap prevention.
- Drizzle ORM + `pg` — TypeScript-aligned access with versioned SQL migrations and transactional commands.
- Better Auth + Drizzle adapter — revocable database sessions and a controlled email/password admin flow; disable public sign-up.
- Zod — shared boundary validation for public forms and privileged server mutations.

### Expected Features

The launch scope is a reliable public request flow and secure operational backend, not an immediate clone of every optional scheduling integration. Details are in [FEATURES.md](FEATURES.md).

**Must have (table stakes):**

- Public asset catalogue and privacy-safe schedule — visitors can filter rooms/dorms and see availability without requester data.
- Responsive, accessible request form — Indonesia-localized fields, `Asia/Jakarta` time handling, textual validation, and a non-guessable confirmation reference.
- Explicit lifecycle and conflict-safe decision workflow — `pending`, approved, rejected, cancelled states with authoritative availability enforcement.
- Admin asset/schedule management — metadata, capacity, operating hours, closures, and archiving rather than destructive deletion.
- Authenticated RBAC, audit history, and reconciled migration — least-privilege administration with accountable decisions and operational continuity.

**Should have (competitive):**

- Availability explanations and small per-asset policy configuration.
- Context-rich admin decision queue with required rejection reasons.
- Authorized CSV exports and migration reconciliation reports.
- Notification-ready status changes, introducing email only once operations support it.

**Defer (v2+):**

- Secure self-service cancellation/rescheduling, after identity and policy rules are agreed.
- External calendar integrations, SMS, payments, waitlists, recurring series, native apps, and a generic rules builder.

### Architecture Approach

Implement a modular monolith: public and admin routes call typed TanStack Start loaders/server functions; domain modules own availability, bookings, assets, auth, audit, and migration; PostgreSQL remains the transactional source of truth. Separate read-only availability queries from booking commands. Every command validates input, authorizes its actor server-side, performs the allowed lifecycle transition and allocation change, then appends an audit event in one transaction. See [ARCHITECTURE.md](ARCHITECTURE.md) for the proposed module layout and flows.

**Major components:**

1. Public and admin routes — presentation, route loading, and privacy-appropriate DTOs.
2. Booking and availability modules — shared schedule rules, lifecycle commands, and conflict responses.
3. Auth/RBAC and audit modules — server-side permissions, secure sessions, and immutable accountability records.
4. PostgreSQL and migration runner — constraints, canonical records, staging, provenance, reconciliation, and controlled cutover.

### Critical Pitfalls

Detailed mitigations and verification criteria are in [PITFALLS.md](PITFALLS.md).

1. **One-shot legacy import** — define mappings first; use immutable extracts, staging, idempotent source-ID maps, exception reporting, reconciliation, and a cutover rehearsal.
2. **Read-time availability as a lock** — use timezone-aware half-open ranges and a PostgreSQL exclusion constraint inside the booking transaction; test concurrent writes.
3. **UI-only role protection** — require session and permission in every protected loader and server function; revoke sessions after deactivation or privilege changes.
4. **Mutable booking history** — enforce lifecycle transitions and write privacy-minimized append-only audit events atomically with material changes.
5. **Desktop-only or over-detailed public experience** — make the form mobile-first and accessible at 320px; publish only availability projections, never requester details.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Canonical Data Foundation and Migration Rehearsal

**Rationale:** Canonical assets, account identities, statuses, IDs, and timezone semantics are prerequisites for every other workflow and for safe operational continuity.  
**Delivers:** PostgreSQL/Drizzle schema and migrations; source-data contract, staging/import maps, reconciliation report, exception workflow, and rehearsal/cutover runbook.  
**Addresses:** Safe migration, canonical asset and booking models, migration provenance.  
**Avoids:** Direct production imports, duplicate/unlinked records, silent historical changes, and irreversible cutover errors.

### Phase 2: Secure Administrator Foundation

**Rationale:** Administrative features and decisions need identity and authorization before they can safely operate on migrated data.  
**Delivers:** Better Auth/session configuration, admin account migration or forced-reset path, explicit permission matrix, endpoint authorization middleware, and initial asset/schedule administration.  
**Uses:** TanStack Start server functions, Better Auth, PostgreSQL sessions/roles, Zod.  
**Implements:** Auth/RBAC module and protected admin route boundary.

### Phase 3: Booking Integrity, Lifecycle, and Audit Core

**Rationale:** Booking requests and approvals depend on one authoritative allocation model, clear status semantics, and accountability.  
**Delivers:** Timezone-aware room/dorm allocation model, active-status policy, PostgreSQL range/exclusion constraint, transactional request/approve/reject/cancel commands, and append-only events.  
**Addresses:** Conflict-safe availability, explicit request status, immutable operational history.  
**Avoids:** Double bookings, ambiguous boundary times, and unaccountable decisions.

### Phase 4: Public Discovery and Request Experience

**Rationale:** The public UI can safely reuse the now-authoritative availability and booking command model.  
**Delivers:** Responsive catalogue/filtering, privacy-filtered date-window availability, accessible validated request flow, clear pending-review confirmation and reference.  
**Addresses:** Public catalogue, mobile booking request, status/reference, accessible usability.  
**Avoids:** PII leakage and a misleading promise of confirmed booking.

### Phase 5: Administrative Decisions, Calendar, and Operational Controls

**Rationale:** Once the core workflow is sound, staff need efficient decision and history tools over the same data/services.  
**Delivers:** Pending decision queue, authoritative admin calendar, decision reasons, audit views, filters/pagination, permission test matrix, and controlled export/reconciliation reporting if policy permits.  
**Addresses:** Approval workflow, operations visibility, controlled reporting.  
**Avoids:** N+1/unbounded history screens, broad access, and decision records without context.

### Phase Ordering Rationale

- Migration and data semantics come first because they determine the correct target model and prevent invalid operational continuity.
- Authentication precedes administrative commands; transactional booking integrity precedes both public availability and decision UI.
- Public and admin screens share one availability/allocation policy but expose different privacy-filtered views.
- Audit writes ship with lifecycle commands, not as a later reporting feature, so no valid decision loses attribution.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1:** Inspect source exports, field/status/timezone mapping, data quality, retention requirements, and actual migration/cutover access.
- **Phase 2:** Verify legacy password hash algorithm and institutional security/identity requirements; select hosting/database provider based on residency, backup, and procurement needs.
- **Phase 3:** Confirm whether pending requests reserve inventory; specify room vs dorm capacity-unit model, operating hours, buffers, and lifecycle transitions.
- **Phase 5:** Confirm audit retention, authorized export contents, operational roles, and notification provider/policy before optional delivery work.

Phases with standard patterns (skip research-phase):

- **Phase 4:** Accessible responsive forms, privacy-filtered DTOs, and date-window catalogue queries have established framework and WCAG patterns once Phase 3 policies are decided.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Matches the established TanStack Start foundation; PostgreSQL constraints and Drizzle migrations are documented patterns. |
| Features | HIGH | Core booking, security, accessibility, and migration requirements are explicit; optional refinements remain policy-dependent. |
| Architecture | HIGH | Modular monolith and transactional command/query separation directly serve the required consistency boundary. |
| Pitfalls | HIGH | Conflict prevention, authorization, auditability, and accessibility are supported by primary PostgreSQL, OWASP, and W3C guidance. |

**Overall confidence:** HIGH

### Gaps to Address

- **Legacy data and credentials:** Profile actual data extracts, account states, and password hash parameters; choose safe verification or forced reset before import.
- **Booking policy:** Agree on capacity representation, whether `pending` blocks availability, allowed transitions, buffers, closures, operating hours, and dorm date semantics.
- **Operational governance:** Define roles, audit retention, export permissions, data residency, backups, recovery ownership, and cutover/write-freeze procedure.
- **Optional files and notifications:** Confirm whether assets include files/images and whether email infrastructure is available before adding object storage or delivery workflows.

## Sources

### Primary (HIGH confidence)

- [TanStack Start overview](https://tanstack.com/start/latest/docs/framework/react/overview) and [server functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions) — application boundary, server execution, validation, CSRF, and endpoint authorization.
- [PostgreSQL range types](https://www.postgresql.org/docs/current/rangetypes.html) and [constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) — half-open reservation ranges and exclusion constraints.
- [Drizzle PostgreSQL integration](https://orm.drizzle.team/docs/get-started-postgresql) and [migrations](https://orm.drizzle.team/docs/migrations) — PostgreSQL driver support and versioned migrations.
- [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle) and [security guidance](https://better-auth.com/docs/reference/security) — database adapter, sessions, and password options.
- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), and [Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) cheat sheets — least privilege, credential/session controls, and safe audit logging.
- [W3C WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html), and [Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) — responsive, accessible public forms.

### Secondary (MEDIUM confidence)

- [Microsoft Bookings overview](https://learn.microsoft.com/en-us/microsoft-365/bookings/bookings-overview?view=o365-worldwide) and [service availability](https://learn.microsoft.com/en-us/microsoft-365/bookings/configure-service-availability?view=o365-worldwide) — common scheduling expectations for availability, closures, buffers, administration, and future notifications.
- [NIST SP 800-92 Rev. 1](https://csrc.nist.gov/pubs/sp/800/92/r1/ipd) — audit/log-management planning; local retention policy still needs confirmation.

### Tertiary (LOW confidence)

- No material low-confidence sources were used; provider selection and legacy-data assumptions remain validation tasks rather than settled decisions.

---
*Research completed: 2026-08-12*  
*Ready for roadmap: yes*
