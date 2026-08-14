# Phase 3: Booking Integrity & Audit Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 3-Booking Integrity & Audit Core
**Areas discussed:** Concurrency & Lock Strategy, State Transitions & Rejection Rules, Dormitory Booking & Capacity Model

---

## Concurrency & Lock Strategy

### How should we prevent concurrent double-bookings at the database level during booking creation/approval?

| Option | Description | Selected |
|--------|-------------|----------|
| SELECT FOR UPDATE | (Recommended) Run a transaction that locks the asset row (`select * from assets where id = ? for update`) before checking existing bookings. | ✓ |
| PostgreSQL EXCLUDE Constraint | Create a gist index with a range exclude constraint on booking start/end dates for each asset. | |
| Postgres Transaction-level Advisory Locks | Use `pg_advisory_xact_lock` on the asset UUID hash during the transaction. | |
| You decide | Choose the best developer-agent discretion option. | |

### What should the system do if a concurrent check fails or the asset row lock cannot be acquired?

| Option | Description | Selected |
|--------|-------------|----------|
| Throw explicit HTTP 409 | (Recommended) Throw an explicit HTTP 409 Conflict error immediately: Fast-fail and let the client app display a clear error message. | ✓ |
| Auto-retry then Fail | Automatically retry the transaction up to 3 times before failing with an error. | |
| You decide | Choose the best developer-agent discretion option. | |

### How should timezone conversions and date comparisons be normalized in queries for checking overlaps?

| Option | Description | Selected |
|--------|-------------|----------|
| UTC Database Normalization | (Recommended) Normalize input to UTC timestamps at database level: Store and compare as UTC, but convert to Asia/Jakarta for calendar hours/closures validation. | ✓ |
| Dual-Time Storage | Keep both the UTC timestamp and the Asia/Jakarta local date/time string in the database for explicit query filters. | |
| You decide | Choose the best developer-agent discretion option. | |

### Should the conflict check block overlapping pending bookings, or only approved bookings?

| Option | Description | Selected |
|--------|-------------|----------|
| Only block APPROVED | (Recommended) Only block overlapping APPROVED bookings: Allow multiple visitors to request the same slot; subsequent admin approvals will fail if a conflict is already approved. | ✓ |
| Block overlapping PENDING | A pending request occupies the slot immediately; no other visitor can request that overlapping slot until resolved. | |
| You decide | Choose the best developer-agent discretion option. | |

---

## State Transitions & Rejection Rules

### What state transitions should be allowed in the booking lifecycle?

| Option | Description | Selected |
|--------|-------------|----------|
| Strict standard lifecycle | (Recommended) Strict standard lifecycle: pending -> approved/rejected; pending/approved -> cancelled; rejected/cancelled are terminal states. | ✓ |
| Flexible/Open lifecycle | Allow re-opening rejected or cancelled bookings back to pending or approved by authorized admins. | |
| You decide | Choose the best developer-agent discretion option. | |

### Should we enforce a non-empty rejection reason when a booking is rejected?

| Option | Description | Selected |
|--------|-------------|----------|
| Enforce rejectionReason | (Recommended) Yes, enforce rejectionReason: Validate that a non-empty string is provided when transitioning a booking to 'rejected' status. | ✓ |
| Optional reason | No, make rejectionReason optional: Allow rejections without any explanation. | |
| You decide | Choose the best developer-agent discretion option. | |

### Who should be allowed to cancel a booking?

| Option | Description | Selected |
|--------|-------------|----------|
| Both requester and admin | (Recommended) Both requester and admin: Admins can cancel any booking; requesters can cancel their own using their non-guessable reference ID. | ✓ |
| Admin only | Cancellations can only be initiated by authenticated administrators through the administrative dashboard. | |
| You decide | Choose the best developer-agent discretion option. | |

### What detail should be logged in the audit trail when a booking state transition occurs?

| Option | Description | Selected |
|--------|-------------|----------|
| Full state audit detail | (Recommended) Full state audit detail: Record the actor, action (e.g., 'booking.approve'), timestamp, and store old status vs. new status in the audit log metadata. | ✓ |
| Simple action audit | Record the action name and booking ID, but don't record old/new state diffs in metadata. | |
| You decide | Choose the best developer-agent discretion option. | |

---

## Dormitory Booking & Capacity Model

### How should dormitory booking availability and capacity checks be modeled?

| Option | Description | Selected |
|--------|-------------|----------|
| Capacity-based (shared) | (Recommended) Capacity-based (shared): Allow multiple concurrent approved bookings as long as the sum of guest counts on overlapping dates does not exceed the asset capacity. | ✓ |
| Exclusive booking | Treat dormitories like rooms; an approved booking occupies the entire asset exclusively for its dates, regardless of guest count. | |
| You decide | Choose the best developer-agent discretion option. | |

### How should room capacity validation be enforced during booking creation?

| Option | Description | Selected |
|--------|-------------|----------|
| Exclusive & Validate Capacity | (Recommended) Exclusive & Validate Capacity: Rooms are strictly exclusive (one booking at a time), and requested attendance must be <= room capacity. | ✓ |
| Exclusive only | Rooms are exclusive, but attendance guest count is not strictly capped (warn only or optional). | |
| You decide | Choose the best developer-agent discretion option. | |

### How should operating hours and closures be validated for dormitory bookings?

| Option | Description | Selected |
|--------|-------------|----------|
| Dormitories are 24/7 | (Recommended) Dormitories are 24/7, validate against closures only: Dormitories skip daily open/close hour checks, but block on specific closure dates. Rooms check both. | ✓ |
| Uniform validation | Treat dormitories identically to rooms, checking both weekly operating hours (day_of_week open/close times) and closure dates. | |
| You decide | Choose the best developer-agent discretion option. | |

### Which database column should represent the guest count for dormitory capacity validation?

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse attendance column | (Recommended) Use the existing `attendance` column: Reuse the `attendance` column to store the number of guests/attendees for both room and dormitory bookings. | ✓ |
| Add new guestCount column | Add a new integer column specifically for dormitory bookings, requiring a schema migration. | |
| You decide | Choose the best developer-agent discretion option. | |

---

## the agent's Discretion

- Timezone helper utility implementation and library integration choices.
- Test scenarios, mocks, and execution tooling for verifying locking under concurrency.

## Deferred Ideas
- None — discussion stayed within phase scope.
