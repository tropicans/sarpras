# Plan 03-01 Summary: Core State Machine, Timezone Engine, and Availability Validator

## Overview
Built the foundational domain types, booking lifecycle state machine, `Asia/Jakarta` timezone normalizer, and authoritative room availability validator for Sarpras PPKASN.

## Key Deliverables
1. **Domain Types & Schemas (`src/lib/booking/types.ts`)**:
   - `BookingStatusSchema` validating `'pending' | 'approved' | 'rejected' | 'cancelled'`.
   - Zod input schemas enforcing date ranges (`endDate > startDate`) and required non-empty `rejectionReason` on rejections.
2. **State Machine (`src/lib/booking/state-machine.ts`)**:
   - Explicit lifecycle validation rules (D-05, D-06):
     - `pending` -> `approved` | `rejected` | `cancelled`
     - `approved` -> `cancelled`
     - `rejected` -> terminal
     - `cancelled` -> terminal
   - Throws descriptive errors when attempting illegal status transitions or rejecting without reason.
3. **Timezone & Availability Engine (`src/lib/timezone/datetime.ts`, `src/lib/booking/availability.ts`)**:
   - Full date normalization in `Asia/Jakarta` (WIB, UTC+7) (D-03).
   - Validates room operating hours (`openTime`, `closeTime` by day of week) (D-11).
   - Validates asset closures for rooms and dormitories (D-11).
   - Enforces room exclusivity and overlap prevention against approved bookings (D-04, D-10).
   - Validates attendance against asset capacity (D-10).
4. **Automated Unit Tests (`src/lib/booking/booking.test.ts`)**:
   - 10 unit tests passing covering state transitions, rejection reasons, timezone boundaries, operating hours, closures, room overlaps, and capacity limits.

## Verification
- `node --import tsx --test src/lib/booking/booking.test.ts` passed 10/10 tests.
- `npx biome check src/lib/booking src/lib/timezone` passed with 0 errors.
