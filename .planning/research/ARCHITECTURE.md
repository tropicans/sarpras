# Architecture Research

**Domain:** Full-stack facilities, room, and dormitory booking for PPKASN  
**Researched:** 2026-08-12  
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser / React application                  │
│  public schedule + request form | administrator schedule + operations │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ typed same-origin RPC / route loading
┌──────────────────────────────▼───────────────────────────────────────┐
│                       TanStack Start application                     │
│ Routes and loaders | server-function boundary | session middleware    │
├───────────────┬─────────────────┬──────────────────┬─────────────────┤
│ Availability  │ Booking service │ Asset/admin svc  │ Audit service   │
│ read model    │ commands        │ role checks      │ append-only log │
└───────┬───────┴────────┬────────┴────────┬─────────┴────────┬────────┘
        │                │                 │                  │
┌───────▼────────────────▼─────────────────▼──────────────────▼────────┐
│                            PostgreSQL                                 │
│ assets + capacity units | bookings + allocations | users + sessions   │
│ audit events | migration batches and source-id mapping                │
└──────────────────────────────────────────────────────────────────────┘
```

This should be a **modular monolith**, not separate public, admin, and scheduling services. The application has one transactional core and its chief correctness rule (an asset cannot be allocated twice for overlapping dates) must be enforced in one database transaction. TanStack Start server functions are a fit for same-origin application RPC; the framework documents that they are server-only, serializable request boundaries, while public integrations belong in server routes. [TanStack Start server functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)

### Component Responsibilities

| Component | Responsibility | Typical implementation |
|---|---|---|
| Public booking routes | Display catalog/schedules; collect a request; never expose administrative data. | File routes, loaders, client-side form state. |
| Admin routes | Asset, calendar, approval, cancellation, and history UI. | Authenticated layout route plus route-level UX guard. |
| Server-function boundary | Parse input, validate schema, require identity/permission, return safe DTOs. | `*.functions.ts`, `POST` for mutations, shared schema validation. |
| Availability read model | Query bookable assets/units and their occupied intervals. | Read-only service/query module; cache only public, non-personal data. |
| Booking command service | Apply state transitions and create/release allocations atomically. | `*.server.ts`; database transaction; domain errors mapped to user-safe responses. |
| Identity and authorization | Issue/read secure sessions and decide permissions per command. | Server-only session store; RBAC policy functions, not UI-only checks. |
| Audit service | Record who changed what, when, and from/to state. | Append-only `audit_events` inserts in the same transaction as the mutation. |
| Migration runner | Import, validate, reconcile, and report legacy data without an implicit production side effect. | Versioned, idempotent CLI/one-off job with staging tables and checkpoints. |
| PostgreSQL | Durable data and last-line protection from concurrent conflicting allocations. | Relational schema, transactions, constraints, and backup/restore process. |

## Recommended Project Structure

```text
src/
├── routes/                         # file routes: public, auth, and admin UI
│   ├── __root.tsx                  # document shell only
│   ├── _public/                    # availability and booking request pages
│   └── _admin/                     # authenticated admin pages and layouts
├── modules/
│   ├── availability/                # read queries, date/slot calculation, DTOs
│   ├── bookings/                    # request, approve, cancel, allocation rules
│   ├── assets/                      # rooms, dormitories, capacity units, closures
│   ├── auth/                        # users, password/session functions, RBAC policy
│   ├── audit/                       # event types and append-only writer
│   └── migration/                   # import mapping and reconciliation helpers
├── db/
│   ├── schema/                      # database schema and migrations
│   └── client.server.ts             # one server-only connection/client boundary
├── lib/
│   ├── validation/                  # client-safe input schemas and shared types
│   └── dates.ts                     # timezone-aware date/interval utilities
└── start.ts                         # global request middleware, including CSRF
scripts/
└── migrate-legacy.ts                # explicit migration command; not app startup
```

### Structure Rationale

- **`routes/`:** owns URL composition and presentation; it does not query the database directly or contain authorization decisions.
- **`modules/`:** groups code by business capability so the public and admin routes reuse the same booking and availability rules.
- **`*.functions.ts` / `*.server.ts`:** follows TanStack Start's recommended split between client-importable server-function wrappers and server-only helpers. [TanStack Start file organization](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions#file-organization)
- **`db/`:** makes persistence explicit and prevents the database client from leaking into browser bundles.
- **`scripts/`:** keeps legacy import intentional, reviewable, and separately executable.

## Architectural Patterns

### Pattern 1: Command/query separation around a transactional booking service

**What:** Keep schedule/search reads separate from commands that create, approve, amend, or cancel bookings. Every command validates input, authorizes the actor, changes booking state, writes/revokes allocation rows, and writes audit events in a single transaction.

**When to use:** Always for a workflow whose availability is changed by administrative decisions or concurrent submissions.

**Trade-offs:** It creates more modules than route-local CRUD, but keeps permissions and conflict rules consistent across public and administrative entry points. It is still one deployable application.

```typescript
// modules/bookings/approve-booking.server.ts (conceptual)
await db.transaction(async (tx) => {
  const booking = await requireBookingForAdmin(tx, bookingId, actor)
  await assertTransition(booking.status, 'approved')
  await tx.insert(allocation).values(toAllocation(booking)) // database may reject overlap
  await tx.update(bookings).set({ status: 'approved' }).where(eq(bookings.id, bookingId))
  await appendAuditEvent(tx, { actor, action: 'booking.approved', entityId: bookingId })
})
```

TanStack Start explicitly advises protecting the endpoint that serves data, because a server function can be reached independently of the route UI. Route `beforeLoad` is useful for navigation UX but is not the authorization boundary. [TanStack Start server-function middleware guidance](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions#middleware)

### Pattern 2: Database-enforced temporal allocation

**What:** Model the actual scarce inventory as bookable units: one room is one unit; a dormitory either has one row per bed or a preallocated unit capacity model. Store a half-open date/timestamp range per allocation and apply a PostgreSQL exclusion constraint to prevent overlap for the same unit. The constraint, rather than a preceding “is available?” query, is authoritative under concurrency.

**When to use:** For every status that operational policy says blocks availability (normally pending approval and approved). Cancelled/rejected rows release the allocation, or are excluded by a constraint predicate.

**Trade-offs:** PostgreSQL-specific DDL and careful interval/timezone semantics are required. This is materially safer than application-only checks; PostgreSQL documents range types and exclusion constraints for non-overlap rules. [PostgreSQL range types and constraints](https://www.postgresql.org/docs/current/rangetypes.html#RANGETYPES-CONSTRAINT), [PostgreSQL exclusion constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION)

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE booking_allocations ADD CONSTRAINT no_overlapping_unit_allocation
  EXCLUDE USING gist (
    inventory_unit_id WITH =,
    occupied_at WITH &&
  ) WHERE (blocks_availability);
```

Use one canonical timezone (`Asia/Jakarta`) and explicit half-open intervals (`[start, end)`) so a checkout and another check-in on the same boundary are unambiguous. For day-based stays use `daterange`; for time-based room bookings use `tstzrange`.

### Pattern 3: Server-side RBAC plus session security

**What:** Give each authenticated admin account one or more roles/permissions such as `asset:manage`, `booking:approve`, `booking:cancel`, `audit:read`, and `admin:manage`. Central policy functions evaluate permission inside each command; UI visibility only improves usability.

**When to use:** For all administrative reads and mutations, especially approvals, asset edits, account changes, exports, and audit views.

**Trade-offs:** Permission design takes upfront care. It avoids the brittle binary distinction between “admin page” and “not admin” and supports delegated operations later.

Use server-issued sessions in HttpOnly, Secure, SameSite cookies, rotate/invalidate sessions when password or privilege changes, rate-limit authentication attempts, and store password hashes rather than recoverable passwords. TanStack provides CSRF middleware for server functions; its same-origin checks and CSRF controls must remain configured if `src/start.ts` is added. [TanStack CSRF guidance](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions#same-origin-requests), [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Pattern 4: Append-only audit history with state transitions

**What:** Store bookings as the current projection (`requested → approved/rejected → cancelled/completed`) and add an immutable `audit_events` record for every creation, approval, rejection, cancellation, asset change, login-sensitive action, and migration decision. Capture actor ID/type, action, target type/ID, request/correlation ID, timestamp, and a redacted before/after JSON snapshot.

**When to use:** For all accountable changes. Write the audit event in the same transaction as its business change so no accepted change lacks history.

**Trade-offs:** Storage and careful redaction are needed; audit records must never include passwords, session tokens, or excessive sensitive personal data. OWASP recommends event logging with appropriate data exclusion/protection and central monitoring. [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)

## Data Flow

### Request Flow

```text
Public visitor selects dates and asset type
    ↓
Public route loader reads availability DTO
    ↓
Validated POST server function
    ↓
Booking command service ── requires no admin role for submission
    ↓ transaction
bookings row + blocking allocation + audit event
    ↓
PostgreSQL constraint accepts booking or rejects overlap
    ↓
Confirmation / conflict-safe “no longer available” response
```

### Administrative Decision Flow

```text
Admin action → authenticated route → validated server function
    ↓                         ↓
route guard (UX)        requirePermission() (security boundary)
                               ↓ transaction
                 state transition + allocation change + audit event
                               ↓
                  PostgreSQL commits or rolls back as one unit
                               ↓
               refreshed schedule and audited decision response
```

### Migration Flow

```text
Read-only legacy export → staging tables → field/status normalization
    ↓ validation + duplicate/conflict report
source-id map → target transaction batches → reconciliation counts/checksums
    ↓
exception queue for manual resolution → signed migration report + audit events
```

### State Management

Server data is the source of truth. Keep only transient presentation state (filters, field errors, open dialogs) in React/router state. After a successful command, invalidate or reload the affected availability/booking route data; never make the browser cache the authority on allocatability.

### Key Data Flows

1. **Availability lookup:** filters and requested interval become a read query over active assets, closures, and blocking allocation ranges; return only public asset metadata.
2. **Booking creation or reschedule:** validated data becomes a command; the database constraint settles races and the client handles a conflict result without retrying blindly.
3. **Admin decision:** authorization and permitted transition are checked server-side, then the booking projection, allocation, and audit record commit atomically.
4. **Migration:** every imported row retains `legacy_source`, `legacy_id`, and batch ID for idempotency, traceability, and post-import reconciliation.

## Scaling Considerations

| Scale | Architecture adjustments |
|---|---|
| 0–1k users | One TanStack Start deployment, PostgreSQL, indexed availability queries, scheduled backups, and no separate queue are appropriate. |
| 1k–100k users | Add indexes on unit/date ranges and common filters; use a connection pool, paginated audit/booking queries, and a worker/queue only for notifications, exports, or large migrations. Keep booking writes in the primary database. |
| 100k+ users | Partition/archive old audit and booking data, add read replicas only for clearly stale-tolerant public schedule reads, and isolate asynchronous integration workloads. Do not split allocation writes away from the transactional database without a proven consistency design. |

### Scaling Priorities

1. **First bottleneck:** schedule queries over long intervals and growing history. Index asset state and allocation ranges; constrain searches by date window; paginate administration history.
2. **Second bottleneck:** slow noncritical work attached to commands. Move email/report/export work to an outbox plus worker after the transactional write succeeds; retain the booking decision and audit write in the request transaction.

## Anti-Patterns

### Anti-Pattern 1: Check availability in application code, then insert later

**What people do:** Query for conflicts, show “available,” then insert a booking in a separate operation.

**Why it's wrong:** Two requests can observe the same availability before either writes, producing a double booking.

**Do this instead:** Treat availability reads as advisory, create the allocation in the booking transaction, and use the database exclusion constraint as the final invariant.

### Anti-Pattern 2: Role checks only in the React UI

**What people do:** Hide controls or guard the `/admin` layout but let a server function trust the caller.

**Why it's wrong:** Endpoints can be called without navigating the UI; changing markup does not authorize data access.

**Do this instead:** Require session and permission in each private server function; use route guards only for navigation experience. [TanStack authenticated routes](https://tanstack.com/router/latest/docs/guide/authenticated-routes)

### Anti-Pattern 3: Destructive “one-shot” production migration

**What people do:** Transform legacy rows directly into production tables with no staging, provenance, repeatability, or conflict report.

**Why it's wrong:** Invalid identifiers, duplicate records, incompatible password formats, and historical conflicts become irrecoverable or invisible.

**Do this instead:** Take an immutable export, load staging tables, preserve legacy keys, run dry-run reconciliation, import in idempotent batches, and retain a manually resolved exception list. Never silently convert unavailable password data into a known credential.

## Integration Points

### External Services

| Service | Integration pattern | Notes |
|---|---|---|
| PostgreSQL | Server-only client; transactions for all booking commands. | Required for durable data and temporal conflict constraint. |
| Existing Sarpras data source | Versioned export/import into staging tables. | Confirm field mappings, data ownership, and account hash compatibility before migration. |
| Email/notification provider (future) | Transactional outbox consumed asynchronously. | Optional; failure must not undo a completed booking decision. |

### Internal Boundaries

| Boundary | Communication | Notes |
|---|---|---|
| Routes ↔ modules | Typed loaders/server functions | Routes own presentation; modules own business rules. |
| Booking ↔ availability | Direct server module calls / shared allocation model | Booking owns mutation; availability is read-only. |
| Booking/assets ↔ audit | In-process call within the same database transaction | Audit must be persisted with the accountable change. |
| Auth ↔ every private command | `requireSession` + `requirePermission` | Never rely on a route guard alone. |
| Migration ↔ domain modules | Explicit script/transaction batches | Reuse validation and import adapters; do not reuse public mutation endpoints. |

## Sources

Primary sources used:

- [TanStack Start: Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions) — HIGH: official framework documentation for RPC boundaries, validation, CSRF, server-only code, and endpoint authorization.
- [TanStack Router: Authenticated Routes](https://tanstack.com/router/latest/docs/guide/authenticated-routes) — HIGH: official routing guidance for route-level authentication UX.
- [PostgreSQL: Range Types](https://www.postgresql.org/docs/current/rangetypes.html) and [Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) — HIGH: official database documentation for temporal ranges and exclusion constraints.
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — HIGH: primary OWASP application-security guidance for authentication controls.
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — HIGH: primary OWASP guidance for secure, useful application logging.

### Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| TanStack Start application boundary | HIGH | Current repository already uses TanStack Start; design follows its official server-function guidance. |
| Concurrent conflict prevention | HIGH | PostgreSQL range/exclusion constraints directly express the required non-overlap invariant. |
| Auth, RBAC, and audit patterns | HIGH | Server-boundary and OWASP guidance are strong; exact organization roles and retention policy need stakeholder definition. |
| Legacy migration mapping | MEDIUM | The staged/idempotent pattern is sound, but source schema, export format, password-hash algorithm, and data-quality issues were not available to inspect. |
| Future integrations and scale thresholds | MEDIUM | These are pragmatic recommendations; traffic, notification, and reporting requirements are not yet specified. |

---
*Architecture research for: Sarpras PPKASN facilities booking*  
*Researched: 2026-08-12*
