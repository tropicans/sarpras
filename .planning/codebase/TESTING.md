# Testing Patterns

**Analysis Date:** 2026-08-18

## Test Framework

**Runner:**
- Node.js Native Test Runner (`node:test`)
- TypeScript execution via `tsx` loader (`node --import tsx --test`)

**Assertion Library:**
- Node.js Native Assertion Module (`node:assert` and `node:assert/strict`)
- Matchers: `assert.strictEqual`, `assert.deepStrictEqual`, `assert.ok`, `assert.match`, `assert.throws`, `assert.rejects`

**Run Commands:**
```bash
# Run full test suite
pnpm test

# Run a specific test file
npx tsx --test src/lib/booking/booking.test.ts

# Run tests with filtering
npx tsx --test --test-name-pattern="conflict" src/lib/booking/booking.test.ts
```

## Test File Organization

**Location:**
- Co-located with implementation modules inside `src/lib/` and `src/db/`

**Test Suite Files:**
- **Database & Migrations:**
  - `src/db/migration.test.ts` - Migration execution, schema integrity, legacy data mapping
  - `src/db/auth.test.ts` - User creation, session generation, password hashing
- **Authentication & RBAC:**
  - `src/lib/auth/rbac.test.ts` - Role checks, permissions for `admin`, `operator`, `pimpinan`
  - `src/lib/auth/two-factor.test.ts` - TOTP secret validation, recovery codes
  - `src/lib/auth/two-factor-enable-bug.test.ts` - 2FA enabling lifecycle regression tests
  - `src/lib/auth/two-factor-password-bug.test.ts` - 2FA credential updates regression tests
- **Assets & Facilities:**
  - `src/lib/assets/facilities.test.ts` - Layout definitions, capacity bounds, room equipment
- **Booking Engine:**
  - `src/lib/booking/booking.test.ts` - Slot availability, overlap conflicts, timezone edge cases
  - `src/lib/booking/admin.test.ts` - Status transitions, rejection reason requirements, audit triggers
  - `src/lib/booking/catalog-availability-field-bug.test.ts` - Facility availability status calculation and booking prefill validation
- **WhatsApp Gateway:**
  - `src/lib/whatsapp/phone.test.ts` - Indonesian phone number formatting & normalization
  - `src/lib/whatsapp/templates.test.ts` - Message template variable interpolation
  - `src/lib/whatsapp/service.test.ts` - Gateway dispatch, mock fallbacks, error handling
- **Email Gateway:**
  - `src/lib/email/templates.test.ts` - HTML email template rendering & tracking link injection
  - `src/lib/email/service.test.ts` - Resend API client, RFC 5322 validation, mock fallbacks
- **Notification Dispatcher:**
  - `src/lib/notifications/service.test.ts` - Dual-channel orchestration, non-blocking fault tolerance

## Test Structure

**Suite Organization Example:**
```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatWibDate, isTimeSlotAvailable } from "./datetime";

describe("Timezone Utilities (WIB)", () => {
  describe("formatWibDate", () => {
    it("should correctly format UTC timestamp into WIB calendar string", () => {
      const utcDate = new Date("2026-08-18T01:00:00Z");
      const formatted = formatWibDate(utcDate);
      assert.match(formatted, /18 Agustus 2026/);
    });

    it("should reject invalid dates gracefully", () => {
      assert.throws(() => formatWibDate(new Date("invalid")), /Invalid time value/);
    });
  });
});
```

## Mocking & Isolation

**External Services:**
- WhatsApp (`FONNTE_MOCK=true`) and Email (`RESEND_MOCK=true`) services support mock modes that print JSON payloads to console rather than hitting live external APIs.
- In-memory database or transactional rollback patterns are used to test database operations without dirtying production state.

**Guidelines for Writing Tests:**
1. **Regression-First:** When fixing bugs, always create a test in `src/lib/<domain>/<bug-name>.test.ts` that reproduces the bug before applying fixes.
2. **Timezone Awareness:** Always construct test dates with explicit ISO strings or timezone offsets to prevent local runner timezone variance.
3. **No External Network Calls:** Unit and integration tests must run offline with mock gateways enabled.

---

*Testing analysis: 2026-08-18*
*Update after adding test suites*
