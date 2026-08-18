# Testing Patterns & Quality Assurance

**Analysis Date:** 2026-08-18

---

## 1. Testing Framework & Philosophy

- **Test Runner:** Node.js native test runner (`node:test` + `node:assert/strict`) loaded via `tsx` (`node --import tsx --test`).
- **Execution Command:** `pnpm test` (or targeted file execution: `node --import tsx --test path/to/file.test.ts`).
- **Test File Pattern:** Co-located test files named `*.test.ts` alongside implementation modules.

---

## 2. Test Suite Breakdown

| Domain | Test File | Key Coverage Areas |
| :--- | :--- | :--- |
| **Assets & Facilities** | `src/lib/assets/facilities.test.ts` | Dynamic tag sanitization, casing deduplication, length limits, default presets |
| **Database Migrations** | `src/db/migration.test.ts` | Schema migration verification, constraints, indexes |
| **Auth & Security** | `src/db/auth.test.ts` | Better Auth adapter, session creation, password hashing |
| **RBAC** | `src/lib/auth/rbac.test.ts` | Role hierarchy rank evaluation, privilege gates (`admin`, `operator`, `pimpinan`) |
| **2FA & MFA** | `src/lib/auth/two-factor.test.ts` | TOTP secret generation, backup code verification, login lockouts |
| **2FA Bug Regression** | `src/lib/auth/two-factor-enable-bug.test.ts` | Enablement flow and verification states |
| **2FA Password Regression**| `src/lib/auth/two-factor-password-bug.test.ts` | Password verification during 2FA enrollment |
| **OAuth Bug Regression** | `src/lib/auth/oauth-linking-bug.test.ts` | OAuth account linking edge cases |
| **Booking Engine** | `src/lib/booking/booking.test.ts` | Conflict detection, date overlap checking, room capacity validation |
| **Booking Admin** | `src/lib/booking/admin.test.ts` | State machine transitions (`pending` -> `approved` / `rejected`), review workflows |
| **WhatsApp Service** | `src/lib/whatsapp/phone.test.ts` | Indonesian phone number normalization (`08...`, `+628...` -> `628...`) |
| **WhatsApp Templates** | `src/lib/whatsapp/templates.test.ts` | Dynamic message rendering for submission, approval, rejection, cancellation |
| **WhatsApp Gateway** | `src/lib/whatsapp/service.test.ts` | Fonnte API call handling, mock console output fallback |
| **Email Templates** | `src/lib/email/templates.test.ts` | Responsive HTML template generation, action buttons, metadata blocks |
| **Email Service** | `src/lib/email/service.test.ts` | Resend API payload dispatch, mock fallback, RFC 5322 validation |
| **Tracking URL Regression** | `src/lib/email/tracking-url-bug.test.ts` | Status link formation and URL scheme safety |
| **Unified Notifications** | `src/lib/notifications/service.test.ts` | Dual-channel concurrent dispatching and recipient fanout |

---

## 3. Writing Unit & Integration Tests

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeFacilities } from "./facilities";

describe("Facility Tag Sanitization", () => {
  it("trims whitespace and deduplicates tags case-insensitively", () => {
    const dirty = ["  AC  ", "ac", "Wi-Fi", "  Proyektor  "];
    const cleaned = sanitizeFacilities(dirty);
    assert.deepEqual(cleaned, ["AC", "Wi-Fi", "Proyektor"]);
  });
});
```

---

*Codebase testing analysis: 2026-08-18*
