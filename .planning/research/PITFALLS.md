# Pitfalls Research

**Domain:** Public institutional room and dormitory reservation with administrative approval
**Researched:** 2026-08-12
**Confidence:** HIGH for database booking integrity, access control, auditability, and responsive accessibility; MEDIUM for migration and approval-policy details because the legacy export and PPKASN operating policy have not yet been inspected.

## Critical Pitfalls

### Pitfall 1: Treating legacy import as a one-time spreadsheet upload

**What goes wrong:**
Assets become duplicated or unlinked, historic bookings acquire different meanings or times, and an interrupted rerun makes the replacement neither reconcilable nor safe to cut over. Administrators may be locked out if the legacy credential format is guessed incorrectly.

**Why it happens:**
The team starts UI work before defining a canonical asset, account, booking-status, identifier, and timezone mapping; imports are then run directly into production tables without provenance or a reconciliation report.

**How to avoid:**
Define a mapping contract first: source primary key, target ID, asset type, lifecycle status, timestamp/timezone, owner/contact fields, account state, and credential strategy. Load immutable source extracts into staging tables; validate and quarantine bad rows; import through idempotent jobs keyed by `(source_system, legacy_id)`; retain source-to-target maps and an exception report. Reconcile per entity/status counts and sampled records before a rehearsal and only then perform a controlled cutover. Verify legacy password hashes only when their algorithm, parameters, and provenance are known; otherwise force a reset/activation flow and never migrate plaintext or reversibly encrypted passwords.

**Warning signs:**
No approved data dictionary; `INSERT` scripts without uniqueness/provenance; inconsistent legacy statuses; dates parsed in the server timezone; count mismatches; or a migration rerun changes rows unexpectedly.

**Phase to address:**
Phase 1 — Canonical schema, migration discovery, rehearsal, and reconciliation; Phase 2 — secure administrator-account transition.

---

### Pitfall 2: Using a read-time availability check as the booking lock

**What goes wrong:**
Two requests or two administrators approve overlapping stays after both see the same apparently free slot. This is especially damaging for dorm stays that span days and rooms with back-to-back time slots.

**Why it happens:**
Availability is implemented only in the browser or as `SELECT` then `INSERT` application code. A status change is handled separately from the conflict check, and time-boundary semantics are left implicit.

**How to avoid:**
Make the database authoritative. Store a validated half-open `tstzrange(start_at, end_at, '[)')`, use `timestamptz`, and define an exclusion constraint scoped to a single asset plus every status that actually reserves capacity (normally `approved`; include `pending` only if policy says pending requests hold inventory). Perform insert/approval, final conflict check, and audit-event append in one transaction. Map an exclusion violation to a clear retry response and refresh availability. Test concurrent approval and create paths, adjacent ranges, cancellation/rejection release, overnight dorm dates, and timezone conversion.

**Warning signs:**
The constraint is absent; the UI alone disables dates; two active bookings can be created through separate browser sessions; or `end == next start` is treated inconsistently.

**Phase to address:**
Phase 3 — Booking domain, availability policy, and transactional conflict enforcement.

---

### Pitfall 3: Client-side or route-only role protection

**What goes wrong:**
A logged-in but unauthorized administrator can call a server function/API directly to approve bookings, edit assets, view personal request data, export records, or manage accounts.

**Why it happens:**
The dashboard hides navigation items or checks a role in React, but server mutations trust client-supplied role/account IDs or only verify that a session exists.

**How to avoid:**
Use a small explicit permission matrix (for example: account manager, asset/schedule manager, booking approver, audit/export viewer). Resolve the session and permissions server-side for every protected loader, server function, and route; deny by default; scope record access as well as action access. Keep role assignment and account activation separate from public sign-up, protect credential changes with reauthentication/rate limits, rotate/revoke sessions on account disable or privilege change, and add authorization tests for every mutation.

**Warning signs:**
Authorization checks exist only in components; a request body contains `role` or `actorId`; one broad `isAdmin` flag controls all sensitive operations; or an account keeps its session after deactivation.

**Phase to address:**
Phase 2 — Authentication, server-enforced RBAC, and account migration; Phase 5 — permission tests for administrative operations.

---

### Pitfall 4: Collapsing request, decision, and history into one mutable row

**What goes wrong:**
Staff cannot explain who approved/rejected/cancelled a request, why a decision changed, or what data existed at the time. A later edit overwrites the only evidence; migration provenance disappears.

**Why it happens:**
The booking table is used as a live form record, status is overwritten without a transition policy, and logging is postponed as an operational nice-to-have.

**How to avoid:**
Define a finite lifecycle (`pending → approved | rejected | cancelled`, with any reopening/supersession explicitly designed). Enforce valid transitions on the server, require a decision reason where policy needs one, and append an immutable event in the same transaction as every state or material-data change. Events need actor type/ID, timestamp, action, booking ID, request/correlation ID, and privacy-minimized before/after facts; use a `system:migration` actor for imports. Restrict audit viewing/export by role and set retention/access policy with PPKASN.

**Warning signs:**
`updated_at` is the only history; a rejected request has no reason/actor; audit rows can be edited/deleted by normal CRUD; or decision and audit writes happen in separate requests.

**Phase to address:**
Phase 3 — lifecycle and transactional event model; Phase 5 — decision queue, audit views, retention/export controls.

---

### Pitfall 5: Publishing a desktop-shaped form and overly detailed public calendar

**What goes wrong:**
Phone users abandon or submit malformed bookings; validation errors are missed; public schedules expose another requester’s name, organization, purpose, or contact details.

**Why it happens:**
The existing desktop dashboard is copied into the public experience, field errors are color-only or shown far from inputs, and the calendar shares an unfiltered administrator query.

**How to avoid:**
Design the public route mobile-first: one-column form at narrow widths, semantic labels and instructions, browser-compatible input types, visible required/format guidance, field-associated textual errors, focus on the first invalid field, and a confirmation reference. Meet WCAG reflow at 320 CSS pixels without two-dimensional scrolling except for inherently two-dimensional content. Serve a separate privacy-filtered availability projection—asset state and unavailable time only—rather than booking records. Test with a physical/simulated narrow viewport, keyboard, screen reader, slow network, and Indonesia-localized `Asia/Jakarta` dates/times.

**Warning signs:**
Horizontal page scrolling at 320px; placeholder-only labels; error messages outside the viewport; a calendar endpoint returns requester fields; or users can infer private booking details from titles/tooltips.

**Phase to address:**
Phase 4 — public catalogue, availability, validation, and responsive request flow.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Directly import legacy rows into production tables | Fast demo data | No provenance, non-idempotent reruns, unrecoverable mapping mistakes | Never for the production cutover |
| Client-side availability validation only | Simple UI implementation | Double bookings under concurrency | Only as an early advisory check; never as authority |
| One `admin` boolean | Fewer tables/screens | Cannot apply least privilege or explain access | Only during local scaffolding, before any real account is imported |
| Overwrite booking status and notes | Small schema | Lost decision history and audit gaps | Never for decision-bearing records |
| Share the admin calendar API publicly | Less code | PII disclosure and unstable public contract | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Legacy data export | Assuming CSV dates, IDs, and statuses are self-describing | Profile actual samples; version the mapping, preserve raw extracts securely, and reconcile counts before cutover |
| Legacy admin credentials | Rehashing an unknown legacy hash or copying it into a new format | Identify the verified format and migrate only with a supported verifier; otherwise require reset/activation |
| TanStack Start server functions | Treating typed client calls as a security boundary | Authenticate and authorize at each server endpoint; keep DB/auth/import code server-only |
| PostgreSQL booking constraint | Omitting the scalar-asset equality operator/extension or forgetting the active-status predicate | Migration-test the exact exclusion constraint and assert the intended statuses reserve capacity |
| Future notification provider | Marking a booking failed/changed because delivery fails | Commit booking state first; record delivery separately and make retries observable |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all bookings to render availability | Slow public calendar and large payloads | Query only relevant assets/date windows; use range indexes and privacy-filtered projections | Months of history or a calendar showing many assets |
| N+1 asset/actor lookups in the decision queue | Queue latency rises with page size | Use joins/batched queries and paginate/filter by status/date | Dozens of pending records per page |
| Unbounded audit history page/export | Admin pages time out or expose more data than needed | Cursor paginate, filter by date/entity, authorize exports, and make exports asynchronous if volume warrants | Years of events or large CSV exports |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting public booking reference alone for modification/status details | Enumeration or disclosure of requester data | Use high-entropy references only for minimal confirmation; require authenticated/admin authorization or an explicit later verification design for sensitive details |
| Using imported password data as ordinary application data | Account takeover and breach amplification | Never log/export hashes; protect at rest; supported verifier or forced reset; rate-limit login and recovery |
| Enforcing permission only in UI | Unauthorized approvals, asset edits, and exports | Server-side deny-by-default checks on every protected read/mutation plus tests |
| Logging credentials or full personal data in audit events | Long-lived privacy exposure | Minimize/redact audit payloads; separate operational facts from sensitive contact data; restrict retention/access |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Calling a submitted request “booked” before approval | Visitors arrive expecting a room that was not reserved | State plainly: `pending review`; show a reference and next status meaning |
| Date-only logic for a timed room or local-time conversion ambiguity | Wrong slot or overnight dorm stay | Use explicit start/end, timezone-aware display, and boundary rules; confirm the interpreted time before submit |
| Making unavailable time unexplained | Repeated failed submissions and support requests | Show privacy-safe reason categories such as unavailable, closure, or outside operating hours |
| Rejection with no reason or next action | Requester cannot correct the request | Require/admin-prompt an appropriate decision reason and show a clear resubmission path |

## "Looks Done But Isn't" Checklist

- [ ] **Migration:** Counts reconcile by entity and booking status, exception rows are reviewed, rerun is idempotent, and a restore/cutover rehearsal has succeeded.
- [ ] **Admin accounts:** No plaintext/reversible credentials are stored; deactivated users lose access; and each privileged server endpoint has authorization tests.
- [ ] **Booking integrity:** Concurrent attempts to create/approve the same asset/time leave at most one capacity-reserving booking, including after a UI cache refresh.
- [ ] **Lifecycle/audit:** Every approval, rejection, cancellation, and material edit has actor, timestamp, valid transition, and event in the same transaction.
- [ ] **Public UX:** At 320px there is no unintended horizontal scrolling; labels/errors work without color; confirmation does not claim approval; public APIs disclose no requester data.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Migration mismatch or duplicate import | HIGH | Stop cutover, preserve source/staging evidence, restore or isolate affected import batch, correct versioned mapping, rerun in rehearsal, and reconcile again |
| Confirmed overlapping bookings | HIGH | Freeze conflicting approval path, identify authoritative record from events, contact affected parties through operations, record a corrective decision, then deploy/test the database constraint |
| Over-privileged or compromised admin | HIGH | Disable account, revoke sessions, review audit trail, repair roles/data, force credential reset where appropriate, and add regression authorization test |
| Missing decision history | MEDIUM | Preserve remaining logs/backups, mark reconstructed events as such, add append-only event transaction, and document the evidence gap |
| Mobile/public privacy defect | HIGH | Remove endpoint exposure/cache, assess affected records, notify per organizational policy, patch projection/UI, and add responsive/privacy regression tests |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Unsafe/non-reconcilable migration | Phase 1 — schema and migration | Rehearsal has source/target count and sample reconciliation, exceptions, idempotent rerun, and rollback/runbook evidence |
| Weak migrated-account auth/RBAC | Phase 2 — secure admin foundation | Endpoint-level role matrix tests pass; unknown legacy hashes use forced reset; session revocation is tested |
| Concurrent conflicts and timezone boundaries | Phase 3 — booking integrity | Parallel create/approve integration test proves database rejects overlap; adjacent and overnight cases pass |
| Mutable/unaccountable approvals | Phases 3 and 5 — lifecycle then admin operations | Valid transition and atomic audit-event tests pass; audit view attributes every decision |
| Inaccessible or privacy-leaking public flow | Phase 4 — public experience | 320px/keyboard/error tests pass; public response contract is reviewed to contain no requester PII |
| Slow calendar/audit operations | Phases 4 and 5 — public/admin views | Date-window query plan, pagination, and payload-size checks meet agreed operational targets |

## Sources

- [PostgreSQL range types](https://www.postgresql.org/docs/current/rangetypes.html) — **HIGH**: scheduling ranges, half-open bounds, GiST indexing, and exclusion constraints for non-overlap.
- [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) — **HIGH**: database constraints are enforced on writes; cross-row rules should use suitable database constraints rather than row-local checks.
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — **HIGH**: deny-by-default, server-side authorization, least privilege, and authorization-test guidance.
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) and [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) — **HIGH**: password migration, secure authentication, reauthentication, and rate-limit controls.
- [NIST SP 800-92 Rev. 1, Cybersecurity Log Management Planning Guide](https://csrc.nist.gov/pubs/sp/800/92/r1/ipd) — **MEDIUM**: current NIST draft planning guidance for log/audit management; local retention policy still needs confirmation.
- [W3C WCAG 2.2: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html), and [Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) — **HIGH**: responsive reflow and accessible validation requirements for the public form.

---
*Pitfalls research for: Sarpras PPKASN public room and dormitory booking*
*Researched: 2026-08-12*
