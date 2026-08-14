# Plan 03-02 Summary: Dormitory Capacity Engine & Transactional Row-Locking Service

## Overview
Implemented the shared dormitory capacity aggregation algorithm and the PostgreSQL transactional booking service utilizing `SELECT FOR UPDATE` row locks to eliminate concurrency anomalies and race conditions.

## Key Deliverables
1. **Shared Dormitory Capacity (`src/lib/booking/dormitory.ts`)**:
   - `calculateDormitoryOccupancyByDate(tx, assetId, startDate, endDate)`: Sums approved guest counts (`attendance`) across overlapping intervals for each day in `Asia/Jakarta` (D-09, D-12).
   - `checkDormitoryCapacity(tx, assetId, totalCapacity, startDate, endDate, requestedGuests)`: Validates that for every day in the interval, total occupancy + requested guests does not exceed asset capacity.
2. **Transactional Booking Service (`src/lib/booking/service.server.ts`)**:
   - Uses PostgreSQL `SELECT ... FOR UPDATE` (D-01) on asset and booking rows within transactions.
   - Throws HTTP 409 `BookingConflictError` (D-02) when asset is inactive, capacity is exceeded, or slots overlap with approved bookings.
   - Allows multiple pending bookings to coexist peacefully until approval (D-04).
   - Authoritatively re-validates availability upon approval (FLOW-05).
   - Enforces non-empty rejection reason on reject (D-06).
   - Supports both administrator and public reference-based cancellations (D-07).
3. **Automated Integration & Concurrency Tests (`src/lib/booking/booking.test.ts`)**:
   - Verified multi-booking overlapping aggregation for dormitory shared capacity.
   - Verified that competing pending requests succeed on creation, and only the first approved request claims the slot while the second approval immediately throws HTTP 409 Conflict.
   - Verified public reference cancellation.

## Verification
- `node --import tsx --test src/lib/booking/booking.test.ts` passed all Wave 1 and Wave 2 tests cleanly.
- `npx biome check src/lib/booking` passed with 0 errors.
