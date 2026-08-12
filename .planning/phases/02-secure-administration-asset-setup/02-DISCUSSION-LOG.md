# Phase 2: Secure Administration & Asset Setup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-12
**Phase:** 02-Secure Administration & Asset Setup
**Areas discussed:** Auth Library & Integration, Server-Side RBAC & Middleware, Asset Availability & Closures, Account Deactivation & Session Revocation

---

## Auth Library & Integration

| Option | Description | Selected |
|--------|-------------|----------|
| `better-auth` & `@better-auth/drizzle-adapter` | Database-backed session state mapped to schemas. | ✓ |
| `better-auth` only | Memory-backed sessions without database storage. | |

**User's choice:** Database-backed sessions using `better-auth` and `@better-auth/drizzle-adapter`.
**Notes:** Stored in `src/db/auth.server.ts` to prevent leaks. Public registration disabled. Migrated passwords require a re-hashing verification hook on first sign-in.

---

## Server-Side RBAC & Middleware

| Option | Description | Selected |
|--------|-------------|----------|
| TanStack Start middleware | Intercept requests and validate sessions/roles globally. | ✓ |
| Inline manual checks | Manually verify sessions/roles inline in each server function. | |

**User's choice:** Custom TanStack Start middleware (`createMiddleware`) to validate and inject context.
**Notes:** Hierarchical roles enforced (admin has full access; operator manages assets/bookings; pimpinan has read-only access). Unauthorized access throws standard HTTP 401/403 errors.

---

## Asset Availability & Closures

| Option | Description | Selected |
|--------|-------------|----------|
| Separate relational tables | Distinct tables (`asset_availability` and `asset_closures`) referencing assets. | ✓ |
| JSONB columns on assets | Store schedules and closures inside the assets table itself. | |

**User's choice:** Separate relational tables for availability and closures.
**Notes:** Interpret all operating hours and closures in local time (`Asia/Jakarta`). Soft delete assets via a `status` column (`'archived'`), blocking bookings but keeping records intact.

---

## Account Deactivation & Session Revocation

| Option | Description | Selected |
|--------|-------------|----------|
| Immediate DB session deletion | Delete all session records for deactivated users. | ✓ |
| Natural expiration | Mark status inactive and let sessions expire naturally. | |

**User's choice:** Immediate DB session deletion to force instant logouts on user deactivation.
**Notes:** User status column (`'active'`, `'inactive'`) verified in middleware. Log all revocations to `audit_logs`. Deactivation triggered via secure user management UI page.

---

## the agent's Discretion
- Tailwind CSS styling and user interface layout for the admin dashboard.
- Verification test setup and internal file placement of helpers.

## Deferred Ideas
- Dynamic email and messaging notification setups.
