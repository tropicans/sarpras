# Phase 3: Booking Integrity & Audit Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 03-booking-integrity-audit-core
**Areas discussed:** Concurrency & Lock Strategy, State Transitions & Rejection Rules, Dormitory Booking & Capacity Model

---

## Concurrency & Lock Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Row locking (SELECT FOR UPDATE) | Row locking (SELECT FOR UPDATE) on the asset record in a Drizzle transaction | ✓ |
| Distributed lock system | Application-level lock using a distributed lock system (like Redis) | |
| Database table-level lock | Database table-level lock | |

**User's choice:** Row locking (SELECT FOR UPDATE) on the asset record in a Drizzle transaction
**Notes:** User chose the recommended database row locking strategy.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Block approved only | Only block overlapping APPROVED bookings (multiple pending requests can coexist) | ✓ |
| Block pending stage | Block overlapping bookings at the PENDING stage (first request holds the slot, others fail) | |

**User's choice:** Only block overlapping APPROVED bookings (multiple pending requests can coexist)
**Notes:** User chose to only block approved overlaps.

---

| Option | Description | Selected |
|--------|-------------|----------|
| UTC Normalization | Normalize input dates to UTC at database boundary, interpret in Asia/Jakarta for validation | ✓ |
| Local Direct Storage | Store dates in local time directly without UTC normalization | |

**User's choice:** Normalize input dates to UTC at database boundary, interpret in Asia/Jakarta for validation
**Notes:** User chose UTC normalization at db boundary.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Fail fast | Throw an explicit HTTP 409 Conflict immediately (fail fast) | ✓ |
| Retry transaction | Retry the transaction automatically up to N times before failing | |

**User's choice:** Throw an explicit HTTP 409 Conflict immediately (fail fast)
**Notes:** User chose fast failure on conflict.

---

## State Transitions & Rejection Rules

| Option | Description | Selected |
|--------|-------------|----------|
| Standard state machine | Standard state machine: pending -> approved/rejected, approved/pending -> cancelled (terminal: rejected, cancelled) | ✓ |
| Allow any transition | Allow any transition between states (e.g. cancelled/rejected -> approved/pending) | |

**User's choice:** Standard state machine: pending -> approved/rejected, approved/pending -> cancelled (terminal: rejected, cancelled)
**Notes:** User chose the strict standard booking lifecycle.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Required rejection reason | Require a non-empty string for rejection reason | ✓ |
| Optional rejection reason | Make the rejection reason optional | |

**User's choice:** Require a non-empty string for rejection reason
**Notes:** User chose required rejection reason.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Admins & Public | Allow admins (via session) and public users (via non-guessable reference ID) | ✓ |
| Only Admins | Allow only administrators to cancel bookings | |

**User's choice:** Allow admins (via session) and public users (via non-guessable reference ID)
**Notes:** User chose to allow public cancellation via non-guessable reference ID.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Status Diff | Record actor, action, timestamp, and metadata containing the status diff (old vs new) | ✓ |
| Full Snapshots | Record full snapshots of the booking record before and after the change | |

**User's choice:** Record actor, action, timestamp, and metadata containing the status diff (old vs new)
**Notes:** User chose status diff in audit metadata.

---

## Dormitory Booking & Capacity Model

| Option | Description | Selected |
|--------|-------------|----------|
| Shared vs Exclusive | Room bookings are strictly exclusive; dormitory bookings are shared/capacity-based (up to total capacity) | ✓ |
| Strictly Exclusive | Treat both rooms and dormitories as strictly exclusive (one booking at a time) | |

**User's choice:** Room bookings are strictly exclusive; dormitory bookings are shared/capacity-based (up to total capacity)
**Notes:** User chose capacity-based shared model for dormitories and exclusivity for rooms.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 24/7 vs Daily | Skip daily hours for dormitories (24/7); validate rooms against daily asset availability hours | ✓ |
| Apply daily validation | Apply daily open/close operating hours validation to both rooms and dormitories | |

**User's choice:** Skip daily hours for dormitories (24/7); validate rooms against daily asset availability hours
**Notes:** User chose to skip daily hours for dormitories.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse attendance | Reuse the existing 'attendance' column for both rooms and dormitories | ✓ |
| Separate column | Create a new separate 'dormitory_guests' column in the bookings table | |

**User's choice:** Reuse the existing 'attendance' column for both rooms and dormitories
**Notes:** User chose to reuse the existing attendance column.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Validate both | Validate both rooms and dormitories against asset closures | ✓ |
| Only rooms | Only validate rooms against closures | |

**User's choice:** Validate both rooms and dormitories against asset closures
**Notes:** User chose to validate both rooms and dormitories against closures.

---

## the agent's Discretion
- Design, naming, and file structures of timezone validation libraries, lock timers, and query helpers under `src/lib/` or `src/db/`.
- Unit and integration test strategies for verifying lock contention and concurrency.

## Deferred Ideas
- SMS/Email notifications for booking submissions or decisions (deferred to v2).
- Administrative queue UI, calendar UI, and dashboard graphs (deferred to Phase 5).
- Public booking request form UI (deferred to Phase 4).
