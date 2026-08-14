# Testing Strategy & Test Suites

**Analysis Date:** 2026-08-14

---

## 1. Testing Framework & Execution

- **Runner:** Node.js native test runner (`node:test` + `node:assert/strict`).
- **Execution Script:** `npm test` / `node --import tsx --test ...`
- **Environment:** Test runs use in-memory / test database configuration and mock external services (`FONNTE_MOCK=true` or `NODE_ENV=test`).
- **Pass Rate:** 53 / 53 passing automated tests.

---

## 2. Test Suite Architecture

| Test Suite File | Domain / Scope | Key Test Cases |
|-----------------|----------------|----------------|
| `src/db/migration.test.ts` | Data & Migrations | Legacy data migration idempotency, canonical column mapping, relational constraints. |
| `src/db/auth.test.ts` | Auth & Asset Setup | User deactivation, session revocation, asset availability table rules, asset closure dates, timezone validation. |
| `src/lib/auth/rbac.test.ts` | RBAC & Security | Role hierarchy rankings (`admin` > `pimpinan` > `operator`), permission resolution, middleware rank assertions. |
| `src/lib/booking/booking.test.ts` | Booking Domain Engine | Room double-booking prevention, dormitory capacity & occupancy math, closure date blocking, state machine transitions. |
| `src/lib/booking/admin.test.ts` | Admin Operations | Booking filtering by status/date/asset, KPI metrics aggregation, bulk actions. |
| `src/lib/whatsapp/phone.test.ts` | WhatsApp Phone Utilities | Phone normalization (`08xx`, `+628xx` -> `628xx`), invalid number rejection, group JID support (`@g.us`), comma-separated recipient lists. |
| `src/lib/whatsapp/templates.test.ts` | Notification Templates | Template formatting for submission, admin alert, approval, rejection with mandatory reason, cancellation. |
| `src/lib/whatsapp/service.test.ts` | WhatsApp Gateway & Audit | Real Fonnte HTTP payload structure, console mock fallback, error resilience, audit log creation. |

---

## 3. Mocking & Isolation Patterns

- **External Gateway Mocking:** When `FONNTE_API_TOKEN` is unset or during automated tests, `WhatsAppService` intercepts outbound notifications, prints formatted terminal box visualizers, and writes mock audit logs without network calls.
- **Database Isolation:** Test suites clean up test records or execute within isolated transactions to avoid polluting production datasets.
- **Side-Effect Safety:** Tests verify that auxiliary service failures (e.g. invalid phone number) do not break the primary business operations.

---

*Codebase testing strategy analysis: 2026-08-14*
