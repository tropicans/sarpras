# Feature Landscape

**Domain:** Public institutional room and dormitory reservation with administrator operations
**Researched:** 2026-08-12
**Confidence:** HIGH for booking integrity, access control, accessibility, and migration; MEDIUM for optional workflow refinements because local policy and current production data have not yet been inspected.

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Public asset catalogue and schedule | Visitors need to see which rooms/dorms exist and whether a date or time is usable before completing a request. | Med | Filter by asset type, date, capacity/location if known; show closures and unavailable periods without exposing another requester's personal data. |
| Mobile-friendly booking request with clear validation | The public workflow is form-led and must work on ordinary phones; labels, required-field cues, and textual errors are baseline accessibility. | Med | Collect only operationally necessary contact, organization, purpose, dates/times, and occupancy fields. Use Indonesia-localized copy and timezone `Asia/Jakarta`. |
| Explicit booking status and reference | A submitter needs proof of submission and a way to understand whether a request is pending, approved, rejected, cancelled, or superseded by a conflict. | Med | Give a non-guessable reference and confirmation page; do not promise a reservation until approval. |
| Conflict-safe availability and approval workflow | The core value is a credible decision without double booking. Administrators need to review requests, record a decision, and see the impacted asset calendar. | High | Recheck availability on the server at approval/creation, and enforce non-overlap in durable storage for active/approved reservations; a UI-only availability check is insufficient under concurrent requests. |
| Asset and schedule administration | Operations need CRUD for rooms/dorms, capacity/metadata, bookable state, operating hours, closures/maintenance, and calendar views. | Med | Archive/disable assets rather than deleting records referenced by history. Calendar policy should support date-specific closures and buffers where needed. |
| Authenticated role-based administration | Public visitors should never receive administrative access; operations need least-privilege roles for assets, schedules, decisions, and account management. | High | Use server-side authorization on every privileged action, not only hidden navigation. Preserve migrated accounts securely and reset credentials where hashes cannot be safely verified. |
| Immutable operational history | Staff must be able to answer who requested, changed, approved, rejected, or cancelled a booking. | Med | Append audit events with actor, timestamp, action, and before/after status; retain original booking facts even after cancellation. |
| Safe, reconciled migration | The rebuild must preserve assets, booking records, and administrator accounts without silently changing meaning or losing links. | High | Stage source extracts, map legacy identifiers/statuses/timezones, validate counts and samples, make imports idempotent, and retain a rollback/exception report. |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Availability explanation and request guidance | Shows *why* an asset cannot be requested (closure, maintenance, conflict, lead-time rule) and suggests an appropriate next step, reducing incomplete requests and operator back-and-forth. | Med | Never disclose the name, purpose, or contact details of another requester. |
| Configurable policy per asset class | Dorms and meeting rooms often need different units, lead times, capacity checks, buffers, and approval rules. | High | Start with a small rule set: asset type, operating hours, buffer, maximum occupancy, and approval requirement—avoid a general-purpose rules engine. |
| Decision queue with operational context | A queue that highlights overlap risk, capacity, asset condition, and previous decision history lets admins resolve requests consistently. | Med | Add filters for pending, date range, asset type, and assignee; include a required rejection reason. |
| Controlled export and migration reconciliation report | Gives operations confidence that the replacement contains the legacy estate and permits an accountable handover. | Med | CSV export for authorized admins only; report source/imported/rejected counts and exception rows, never passwords or secrets. |
| Notification-ready status changes | Confirmation and decision notices reduce manual follow-up and no-shows. | Med | Begin with a reliable on-screen reference and optional email when infrastructure is available; make delivery failures visible to admins. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Default auto-approval for all public requests | It turns a request workflow into an irreversible reservation, lets unreviewed requests block scarce institutional assets, and makes policy exceptions hard to handle. | Keep `pending` distinct from `approved`; consider auto-approval only later for explicitly configured low-risk assets after policy validation. |
| “Check then insert” conflict protection only in the UI/application | Concurrent submissions can both pass a read-time availability check. | Check early for a helpful response, then make the authoritative write transaction/database constraint reject an overlap. |
| Public calendar details for other requesters | Names, contacts, and request purposes leak personal or institutional information without improving availability. | Publish asset availability/state only; restrict request details to authorized admins. |
| Deleting assets, bookings, or audit rows to clean up the dashboard | Destruction breaks migrated references and accountability. | Use inactive/archived states and cancellation/rejection events; restrict hard deletion to a documented data-retention process. |
| SMS, payment, native apps, chat, or external calendar sync in the MVP | Each adds vendor, privacy, support, and failure-mode work unrelated to validating reliable booking decisions. | Deliver a responsive web workflow first; add one notification/integration channel only after core operational data is stable. |
| A generic visual workflow/rules builder | It creates a broad policy engine before PPKASN's actual rules have been validated. | Implement a small, explicit configuration model and extend it from observed exceptions. |

## Feature Dependencies

```text
Canonical asset model + booking status model
    -> durable database schema + migration mapping
        -> idempotent migration + reconciliation report
        -> public catalogue/schedule
        -> admin asset/schedule management

Canonical time range + timezone + active-status semantics
    -> server-side availability check
        -> database-level no-overlap protection
            -> booking request submission
            -> administrator approval/decision queue

Administrator account migration + secure authentication
    -> server-side role authorization
        -> asset/schedule administration + booking decisions + exports
            -> audit history

Accessible responsive form + public availability
    -> confirmation/reference
        -> optional notifications and self-service changes
```

### Dependency Notes

- **Migration requires canonical models first:** legacy values need an explicit destination for asset type, legacy IDs, booking status, timestamps, and account state before data can be imported safely.
- **Approval requires conflict protection:** a pending request should not consume availability, while an approved booking must be protected from overlapping writes even when two administrators act at once.
- **Public schedule and admin calendar share the same availability policy:** separate calculations will drift; present different privacy-filtered views over one authoritative rule set.
- **Audit history requires authenticated actors:** system migrations may be a system actor, but every later privileged decision must record the authorized administrator responsible.
- **Notifications enhance, but do not define, booking state:** a delivery failure cannot reverse an approved/rejected decision or make the system's record ambiguous.

## MVP Recommendation

Prioritize in this order:

1. **Canonical data model, migration tooling, and reconciliation** — continuity is an explicit project constraint; establish asset, account, booking, status, date/time, and legacy-ID semantics before user-facing work.
2. **Secure administrative foundation** — migrate/rehash or reset credentials safely; add server-enforced roles, asset administration, schedule/closure configuration, and audit events.
3. **Conflict-safe booking domain** — implement timezone-aware ranges, approved-booking non-overlap enforcement, and the pending → approved/rejected/cancelled lifecycle.
4. **Public discovery and validated request flow** — catalogue, privacy-safe availability, responsive form, confirmation reference, and clear status language.
5. **Admin decision queue and calendar** — give staff the operational screen to review requests, record reasons, and act on authoritative availability.

Defer until the MVP operates reliably:

- **Email status notifications and controlled CSV exports** — add after the decision workflow and production mail/data-retention arrangements are confirmed.
- **Self-service change/cancellation through a secure reference token** — add only after policy for deadlines, identity verification, and approval re-evaluation is agreed.
- **Per-asset buffer/lead-time configuration and availability explanations** — add after administrators confirm where one shared rule is insufficient.
- **External calendar integration, SMS, payment, waitlists, recurring series, and native applications** — defer because they add operational and privacy complexity without establishing booking integrity.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Canonical schema, safe migration, reconciliation | High | High | P1 |
| Server-enforced auth, roles, and migrated admin accounts | High | High | P1 |
| Asset catalogue, schedule, filters, and closures | High | Med | P1 |
| Validated public request, reference, and status lifecycle | High | Med | P1 |
| Conflict-safe approval and no-overlap enforcement | High | High | P1 |
| Admin asset/schedule CRUD and decision queue | High | Med | P1 |
| Audit history | High | Med | P1 |
| Email notifications and controlled export | Med | Med | P2 |
| Per-asset policies, buffers, and availability explanations | Med | High | P2 |
| Secure self-service cancellation/rescheduling | Med | High | P2 |
| External calendar/SMS/native app/payment/waitlist | Low | High | P3 |

## Competitor Feature Analysis

| Feature | Microsoft Bookings | Public institutional workflow | Sarpras PPKASN approach |
|---------|-------------------|-------------------------------|-------------------------|
| Availability | Configures bookable/custom hours, date-specific closure, and buffers to prevent conflicts. | Visitors expect dates that cannot be booked to be unavailable. | Asset-centric availability with closures and optional buffers, displayed without requester details. |
| Booking management | Supports a web booking page, scheduling policies, and customer cancellation/rescheduling. | A public requester needs a clear submission outcome; an institution may require approval. | Treat public submission as `pending`; make only an approved state reserve the asset. Defer self-service changes. |
| Operational access | Uses administrator/viewer-like access to manage booking pages and schedules. | PPKASN needs authorized staff to manage assets and decisions. | Small role model, enforced server-side for every privileged action, with audit events. |
| Notifications | Provides automated email/SMS options. | Helpful but not core to correctness. | Design status changes to be notification-ready, then introduce the simplest reliable channel after launch. |

## Sources

- [Microsoft Bookings overview](https://learn.microsoft.com/en-us/microsoft-365/bookings/bookings-overview?view=o365-worldwide) — **HIGH**: current mainstream scheduling product documentation for public booking pages, availability, administration, and notifications.
- [Microsoft: configure service availability](https://learn.microsoft.com/en-us/microsoft-365/bookings/configure-service-availability?view=o365-worldwide) — **HIGH**: supports closures, custom availability, and buffers as operational scheduling patterns.
- [Microsoft: customer booking management](https://learn.microsoft.com/en-us/microsoft-365/bookings/customers-manage-booking?view=o365-worldwide) — **HIGH**: supports the deferred self-service cancellation/rescheduling feature decision.
- [PostgreSQL `CREATE TABLE` documentation](https://www.postgresql.org/docs/current/sql-createtable.html) and [range types documentation](https://www.postgresql.org/docs/current/rangetypes.html) — **HIGH**: authoritative basis for database-enforced non-overlap rather than a read-then-write check.
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) and [Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — **HIGH**: supports secure handling and staged upgrading of migrated administrator credentials.
- [W3C WCAG 2.2: Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) and [Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) — **HIGH**: supports labeled inputs and descriptive textual validation errors in the public form.
- [NIST SP 800-92 Rev. 1, Log Management Planning Guide](https://csrc.nist.gov/pubs/sp/800/92/r1/ipd) — **MEDIUM**: supports keeping trustworthy operational audit records; the cited revision is an initial public draft.

---
*Feature research for: Sarpras PPKASN public room and dormitory booking*
*Researched: 2026-08-12*
