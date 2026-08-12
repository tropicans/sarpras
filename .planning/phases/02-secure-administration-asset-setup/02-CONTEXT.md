# Phase 2: Secure Administration & Asset Setup - Context

**Gathered:** 2026-08-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 protects the administration boundary of Sarpras PPKASN. It implements a secure email-and-password login flow for administrators, session protection, role-based access controls (RBAC) enforced at the server boundary, account deactivation, and session revocation. Additionally, it enables authorized administrators to manage rooms and dormitories (assets) along with weekly operating availability, holiday closures, and archiving capabilities without erasing historical logs or booking data.

</domain>

<decisions>
## Implementation Decisions

### Auth Library & Integration
- **D-01:** Install and configure `better-auth` along with `@better-auth/drizzle-adapter` to manage session state in PostgreSQL database tables — **Reversibility:** one-way — Swapping auth libraries later requires migrating session tables, session schemas, and rewriting all auth handlers and middlewares.
- **D-02:** Disable public user registration entirely to prevent unauthorized users from creating admin accounts — **Reversibility:** reversible — Public signup can be enabled or disabled via Better Auth config flag.
- **D-03:** Bridging legacy passwords: Require migrated administrator accounts to perform a password reset flow upon their first sign-in — **Reversibility:** costly — Once password hashes are invalidated/reset, users must use the reset mechanism.
- **D-04:** Better Auth configuration file must be stored in `src/db/auth.server.ts` to prevent leaks of server environment variables to isomorphic client bundles — **Reversibility:** reversible — File path reorganizations are low cost.

### Server-Side RBAC & Middleware
- **D-05:** Enforce authentication and authorization boundaries using TanStack Start middleware (`createMiddleware`) to intercept requests and validate user roles and sessions — **Reversibility:** costly — Enforcing auth checks in middleware is standard, but switching to manual checks in every server function later would require modifying all server function handlers.
- **D-06:** Simple hierarchical role model: `admin` can perform all actions (including deactivating users and managing assets); `operator` can manage assets, schedules, and bookings; `pimpinan` has read-only access — **Reversibility:** reversible — Role permission mappings can be updated within the middleware or database schema.
- **D-07:** Throw standard HTTP 401 (Unauthorized) and 403 (Forbidden) errors at the server function boundary on access failure, allowing TanStack Router's error boundaries or redirects to catch them — **Reversibility:** reversible — Can be modified to return JSON payloads if needed.
- **D-08:** Sourced user roles from the session object cookie-cached payload instead of re-querying the database on every request to optimize performance — **Reversibility:** reversible — Can be changed to database query checks in the auth middleware.

### Asset Availability & Closures
- **D-09:** Model weekly operating availability schedules in a separate relational table (`asset_availability` referencing the `assets.id` column) — **Reversibility:** costly — Modifying availability model to JSONB later requires schema migrations and updates to date-validation code.
- **D-10:** Model date-specific closures in a separate relational table (`asset_closures` referencing the `assets.id` column) — **Reversibility:** costly — Switching to a JSONB list representation on the assets table requires database migration.
- **D-11:** Interpret all operating hours and closures in `Asia/Jakarta` local time zone, doing timezone-aware boundary checks on the server — **Reversibility:** costly — Swapping to UTC-based storage or dynamic timezone handling requires rewriting timezone validation helpers.
- **D-12:** Asset soft deletion using a status column ('active', 'inactive', 'archived') in the `assets` table, blocking bookings if archived, and retaining all historical booking and audit records — **Reversibility:** reversible — Status flags are cheap to modify.

### Account Deactivation & Session Revocation
- **D-13:** Deactivate users by immediately deleting all their session records from the database session table to enforce immediate logouts across all devices — **Reversibility:** reversible — Deactivating a user without revoking sessions or vice versa is configurable.
- **D-14:** Add a status column (`'active'`, `'inactive'`) to the `user` table and verify it in the auth middleware — **Reversibility:** reversible — Column changes in user schema.
- **D-15:** Record account deactivation and session revocation events in the `audit_logs` table — **Reversibility:** reversible — Logging configurations are local.
- **D-16:** Admin users with the `'admin'` role trigger user deactivation through a secure user management UI page calling a protected server function — **Reversibility:** reversible — UI-based endpoint configuration.

### Agent's Discretion
- The developer agent has discretion over UI styling and dashboard layout using Tailwind CSS.
- The developer agent has discretion over testing setup, Drizzle migration adjustments, and internal file layouts of helper modules.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications & Roadmap
- [.planning/PROJECT.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/PROJECT.md) — Core value, active requirements, and key decisions.
- [.planning/REQUIREMENTS.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/REQUIREMENTS.md) — Traceability mapping, v1 requirements (AUTH-01, AUTH-02, AUTH-03, AUTH-04, ASSET-01, ASSET-02, ASSET-03).
- [.planning/ROADMAP.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/ROADMAP.md) — Phase 2 goals, dependencies, and success criteria.

### Database Schemas
- [src/db/schema.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/db/schema.ts) — Current Drizzle schemas for `user`, `session`, `account`, `verification`, `assets`, `bookings`, and `auditLogs`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [src/db/client.server.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/db/client.server.ts) — Database client for Drizzle.
- [src/db/schema.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/db/schema.ts) — Contains predefined Better Auth and Sarpras tables.

### Established Patterns
- Absolute paths configured with `@/*` and `#/*` source aliases in `tsconfig.json`.

### Integration Points
- `/api/auth/$` server route (mapped to `src/routes/api/auth/$.ts`) to handle Better Auth requests.
- TanStack Start server functions and middleware for route-level and API-level authorization.

</code_context>

<specifics>
## Specific Ideas
- Disable public signup in Better Auth: config property `signUp: { enabled: false }` or similar configuration setting.
- Force password resets by clearing or modifying credential/hash columns or recording a reset flag on the user/account record.

</specifics>

<deferred>
## Deferred Ideas
- Notifications (email and SMS alerts) — Deferred to Phase 4/5.
- Public calendar booking and availability projection searches — Deferred to Phase 4.

</deferred>

---

*Phase: 02-Secure Administration & Asset Setup*
*Context gathered: 2026-08-12*
