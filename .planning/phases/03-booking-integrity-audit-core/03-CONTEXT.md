# Phase 3: Booking Integrity & Audit Core - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 establishes the authoritative backend logic for booking lifecycle states, concurrency-safe double-booking prevention, and timezone-aware availability/closure validation. It ensures that booking transitions (`pending`, `approved`, `rejected`, `cancelled`) are strictly governed, database row locks prevent double-booking room/dormitory assets under concurrent requests, and an append-only audit trail logs all migration, booking status, and asset configuration changes.

</domain>

<decisions>
## Implementation Decisions

### Concurrency & Lock Strategy
- **D-01:** Database Row Locking: Use PostgreSQL `SELECT FOR UPDATE` on the asset record inside a transaction to lock the asset before verifying availability and writing the booking. — **Reversibility:** costly — Swapping to another locking mechanism or database engine requires rewriting queries and transaction block scopes across all booking creation and modification server functions.
- **D-02:** Failure Handling: Throw an explicit HTTP 409 Conflict error immediately when a lock timeout or availability validation fails. — **Reversibility:** reversible — Failure response formats and retry counts can be adjusted easily inside the backend endpoint or server function handler.
- **D-03:** Timezone and Date Normalization: Normalize all input dates to UTC timestamps at the database boundary, and interpret them in `Asia/Jakarta` when validating operating hours and closures. — **Reversibility:** costly — Modifying date storage schemas or changing timezone interpretation rules requires schema migrations and rewriting validators.
- **D-04:** Overlap Blocking Policy: Only block overlapping APPROVED bookings. Multiple pending requests for the same slot are allowed to coexist until one is approved. — **Reversibility:** reversible — The query checking overlaps can be modified to include pending status if policy changes.

### State Transitions & Rejection Rules
- **D-05:** Lifecycle State Machine: Enforce a strict standard lifecycle where `pending` can transition to `approved` or `rejected`, and both `pending`/`approved` can transition to `cancelled`. `rejected` and `cancelled` are terminal states. — **Reversibility:** costly — Implementing state machine verification in server functions requires updating all state change handlers if states or transitions are added.
- **D-06:** Enforce Rejection Reason: Require a non-empty string in the `rejectionReason` column when transitioning a booking's status to `'rejected'`. — **Reversibility:** reversible — The validation rules can be relaxed to make the reason optional or empty.
- **D-07:** Cancellation Permissions: Allow both the authenticated administrators (via dashboard) and the public requesters (via a non-guessable reference ID) to cancel bookings. — **Reversibility:** costly — Splitting public cancellation by reference from session-based admin cancellation requires maintaining separate endpoints and verification paths.
- **D-08:** Audit Log Details: Record actor, action, timestamp, and store a diff of the old status vs. the new status inside the audit log metadata for every booking transition. — **Reversibility:** reversible — Audit metadata structures can be changed or simplified without database migrations.

### Dormitory Booking & Capacity Model
- **D-09:** Dormitory Shared Capacity: Model dormitory bookings as capacity-based (shared). Multiple bookings can overlap on dates, as long as the sum of guests on any overlapping date does not exceed the dormitory's total capacity. — **Reversibility:** costly — Implementing date range aggregation queries and updates to capacity validation requires complex query changes.
- **D-10:** Room Exclusivity and Capacity: Room bookings are strictly exclusive (one booking at a time) and must have requested attendance less than or equal to the room capacity. — **Reversibility:** costly — Swapping room validation rules or separating room vs dormitory logic requires refactoring query helpers.
- **D-11:** Dormitory Operating Hour Validation: Dormitories skip daily open/close hours (they operate 24/7), but must validate against closures/holidays. Rooms validate against both daily operating hours and closure dates. — **Reversibility:** costly — Adjusting hour checks or applying them to dormitories requires updating conditional validation logic.
- **D-12:** Guest Count Representation: Use the existing `attendance` column in the `bookings` table to represent the number of guests/attendees for both room and dormitory bookings. — **Reversibility:** costly — Splitting or renaming database columns requires schema migrations and updates to all query files.

### Agent's Discretion
- The developer agent has discretion over the design, utility function naming, and file structures of timezone validation libraries, lock timers, and query helpers under `src/lib/` or `src/db/`.
- The developer agent has discretion over unit and integration test strategies for verifying lock contention and concurrency.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications & Roadmap
- [.planning/PROJECT.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/PROJECT.md) — Core value, active requirements, and key decisions.
- [.planning/REQUIREMENTS.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/REQUIREMENTS.md) — Traceability mapping, v1 requirements (FLOW-01, FLOW-04, FLOW-05, OPS-03).
- [.planning/ROADMAP.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/ROADMAP.md) — Phase 3 goals, dependencies, and success criteria.

### Database Schemas
- [src/db/schema.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/db/schema.ts) — Current Drizzle schemas for `assets`, `bookings`, `auditLogs`, `assetAvailability`, and `assetClosures`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [src/db/client.server.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/db/client.server.ts) — Database client for Drizzle transactions.
- [src/lib/auth.middleware.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/lib/auth.middleware.ts) — Route-level and server function RBAC check helpers (`authMiddleware`, `requireMinRole`).

### Established Patterns
- Server operations are exposed via TanStack Start `createServerFn` with standard HTTP error responses.
- All timezone logic defaults to `Asia/Jakarta` on the server using `date-fns-tz`.

### Integration Points
- Server functions will connect with booking routes to be built in Phase 4 (public) and Phase 5 (admin).
- Audit log helper functions should be accessible globally to write audit events.

</code_context>

<specifics>
## Specific Ideas
- Non-guessable reference generation: Use standard uuidv4 (or a secure short nanoid) for new booking requests.
- Transaction block scope in Drizzle:
  ```ts
  await db.transaction(async (tx) => {
    // Lock asset
    const [asset] = await tx.select().from(assets).where(eq(assets.id, assetId)).for('update');
    // ... validate availability and closures
    // ... write booking
    // ... write audit log
  });
  ```

</specifics>

<deferred>
## Deferred Ideas
- SMS/Email notifications for booking submissions or decisions (deferred to v2).
- Administrative queue UI, calendar UI, and dashboard graphs (deferred to Phase 5).
- Public booking request form UI (deferred to Phase 4).

</deferred>

---

*Phase: 03-Booking Integrity & Audit Core*
*Context gathered: 2026-08-14*
