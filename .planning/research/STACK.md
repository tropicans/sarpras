# Stack Research

**Project:** Sarpras PPKASN  
**Researched:** 2026-08-12  
**Scope:** Maintainable full-stack replacement that retains the existing TanStack Start / React / TypeScript foundation and safely migrates assets, bookings, and administrator accounts.

## Recommendation

Keep the current frontend and full-stack foundation, and add a conventional relational backend:

| Layer | Recommendation | Why it fits Sarpras PPKASN | Confidence |
|---|---|---|---|
| Application | TanStack Start + TanStack Router, React 19, TypeScript | Already present; provides SSR, route loaders, typed server functions/routes, and middleware without a rewrite. Keep server-only business logic behind Start server functions and server routes. | High |
| UI | Tailwind CSS 4 + accessible, locally owned React components | Already present; sufficient for responsive public requests and admin workflows. Introduce a component set only as a deliberate UI phase, rather than replacing the styling foundation. | High |
| Runtime / deployment | Node.js deployment of TanStack Start; continue Vercel only if it meets operational requirements | TanStack Start's application model is portable. A Node runtime supports conventional PostgreSQL drivers and credential-auth libraries; avoid Edge-only assumptions for booking writes and migrations. | High |
| System of record | Managed PostgreSQL 16+ | A relational database is the right authority for assets, approvals, sessions, migration provenance, and concurrent reservations. PostgreSQL range types plus an exclusion constraint can make overlapping active reservations for the same asset impossible at the database boundary. | High |
| Data access | Drizzle ORM + `pg` (node-postgres), with checked-in SQL migrations | TypeScript schema and queries align with the existing codebase. Use generated migrations for ordinary schema changes and hand-written/custom SQL migrations for extensions, exclusion constraints, and one-time import work. | High |
| Authentication | Better Auth with its Drizzle/PostgreSQL adapter; email/password enabled, public sign-up disabled | Database-backed, revocable sessions fit a small internal admin population. Better Auth supports a Drizzle PostgreSQL adapter, secure cookie defaults, rate limiting, and custom password hash/verify functions needed to bridge a verified legacy hash format. | Medium |
| Authorization | Application-owned `admin_role` / permission tables enforced in Start server middleware and every protected mutation | The product needs a small, auditable RBAC model (for example, super-admin, asset manager, booking approver). Do not treat client route guards as authorization. | High |
| Validation | Zod schemas shared between forms and server-function validators | Validates public booking input and admin mutations at the network boundary; keeps schemas client-safe. | High |
| Audit and observability | Append-only `booking_events` / `audit_log` in PostgreSQL, structured server logging, and provider monitoring | Preserves who approved, rejected, cancelled, or edited a booking, including migrated-record provenance. This directly supports accountable booking decisions. | High |
| File storage (only if legacy assets include files/images) | S3-compatible object storage with private writes and signed reads; store metadata/key/checksum in PostgreSQL | Keeps binary data out of booking tables and permits a provider change without rewriting domain records. Do not introduce it until discovery proves files must be migrated. | Medium |

## Architecture Boundaries

```text
React routes + Tailwind UI
        |
TanStack Start loaders / server functions / server routes
        |-- public availability reads
        |-- authenticated admin mutations (RBAC middleware)
        |-- migration/import commands (server-only, operator-run)
        v
Drizzle ORM + explicit SQL where database features matter
        v
PostgreSQL: assets, booking lifecycle, sessions, roles, audit events, import maps
```

Use Start route loaders for public availability reads and `POST` server functions for mutations. Start documents that server functions are server-executed typed RPC endpoints, and that every private server function needs an authorization check at its endpoint; client-side route protection is only a UX layer. Keep database clients, auth configuration, import code, and secrets in `*.server.ts` modules, because Start code is otherwise isomorphic by default.

## Booking-Integrity Design

PostgreSQL, rather than a pre-submit availability check alone, must be the final conflict authority.

- Model each reservable room/dorm as an `asset`; model a requested or approved stay with a half-open `tstzrange(start_at, end_at, '[)')` in a `booking` record. Use `timestamptz` and capture the intended local time zone/booking date presentation separately (`Asia/Jakarta` unless the product rules say otherwise).
- Add the `btree_gist` extension and an exclusion constraint equivalent to `EXCLUDE USING gist (asset_id WITH =, booked_range WITH &&) WHERE (status IN ('pending', 'approved'))`. The exact statuses must follow the agreed business rules: cancelled, rejected, and completed records should retain history but not occupy the asset.
- Perform the state transition, conflict-sensitive insert/update, and audit-event insert in one transaction. Translate PostgreSQL exclusion-violation errors into a clear “time slot was just taken” result and refresh availability.
- Treat UI calendar filtering as advisory. It improves usability but does not provide concurrency control.

PostgreSQL's range-type documentation specifically describes exclusion constraints for non-overlapping reservations; this is more reliable than implementing a race-prone `SELECT` then `INSERT` check in application code.

## Data Migration Approach

Make migration a rehearsed, idempotent operational workflow, not a one-off UI feature.

1. **Discover and freeze the source shape.** Export source records/files under authorization, record source identifiers and extracts' checksums, identify the legacy password-hash algorithm and all asset/booking statuses, and capture a read-only backup before any cutover.
2. **Create the target schema first.** Use version-controlled Drizzle migrations plus custom SQL for PostgreSQL extensions, range/exclusion constraints, and import staging tables. Do not use schema `push` against production.
3. **Stage and normalize.** Import into staging tables with `source_system`, `source_id`, raw payload/checksum, and validation-error fields. Map legacy IDs to immutable target IDs through an `import_map`; never overwrite records merely by display name.
4. **Validate before promotion.** Reconcile asset/admin/booking counts, required fields, date ranges, and every active booking conflict. Quarantine invalid or conflicting legacy records for an administrator decision; preserve their raw source payload and an explicit resolution event.
5. **Promote transactionally and auditably.** Insert canonical rows and `booking_events` in transactions; retain `migrated_at`, `migration_batch_id`, and source IDs. Re-run against the same source safely without duplicates.
6. **Accounts require a dedicated cutover.** Do not copy passwords in plaintext. If the legacy hash format is known and defensible, use Better Auth's documented custom `hash`/`verify` hooks to verify legacy hashes only, then rehash with the current policy after successful sign-in. If the hash is unknown, weak, or unavailable, migrate identity/role/contact data and issue a forced password-reset flow. Disable self-registration either way.
7. **Cut over with a delta import.** Put the legacy system into a short write freeze, take a final delta export, reconcile counts/conflicts again, then direct traffic to the new application. Keep the legacy export and migration report according to the organization's retention policy.

## Implementation Conventions

- Pin direct production dependencies to tested versions; do not leave framework or security dependencies on `latest`. Renovate/Dependabot-style update automation is optional, but upgrades must run type checks, linting, integration tests, and a booking-concurrency test.
- Organize server code as `src/features/<domain>/{schemas.ts,*.server.ts,*.functions.ts}`. Shared schema/types must contain no secrets or database imports. This follows TanStack Start's documented server-function organization.
- Use Postgres roles/least-privilege connection credentials: the application runtime account may execute application DML; a separate migration account performs DDL. Keep `DATABASE_URL`, `BETTER_AUTH_SECRET`, storage credentials, and migration-only credentials out of client bundles and version control.
- Implement explicit allowed booking transitions and write an audit event inside the same transaction. Never delete a booking to represent a business cancellation.
- Add integration tests against a disposable PostgreSQL instance for exclusion constraint enforcement, double-submit/concurrent booking attempts, role checks, migrated-password behavior, and migration reconciliation.

## Packages to Introduce Deliberately

```text
Runtime:  drizzle-orm, pg, better-auth, @better-auth/drizzle-adapter, zod
Development: drizzle-kit, @types/pg, a PostgreSQL-backed integration-test tool
```

Choose a managed PostgreSQL provider during deployment planning based on the institution's data residency, procurement, backups, access control, and recovery requirements. The domain model and SQL migrations should remain provider-neutral.

## Alternatives Considered

| Alternative | Decision | Reason |
|---|---|---|
| Replace TanStack Start with Next.js | Reject | The existing application already has the necessary full-stack React primitives. A framework migration adds risk without addressing booking integrity or data migration. |
| SQLite / local file database | Reject | It is a poor primary system of record for concurrent deployed booking writes, operational backups, and multi-instance hosting. |
| Client-only availability/conflict validation | Reject | Concurrent requests can pass the same preflight check. The database must reject overlap. |
| Auth solely via hand-rolled signed JWTs | Reject | Revocation, password-reset, session lifecycle, rate limiting, and migration behavior would become custom security code. Database-backed sessions are a better fit. |
| PostgreSQL RLS as the primary authorization mechanism | Defer | The app server is the only trusted database caller in v1. Application middleware plus least-privilege database credentials is simpler. Add RLS only if direct browser/database access or multi-tenant isolation becomes a requirement. |
| Object storage now | Defer | Add it only after legacy discovery confirms that files/images are in scope; the core booking product does not require it. |

## Version and Risk Notes

- TanStack Start is currently documented as an RC. Retaining it is still the lowest-risk choice because it is the installed foundation, but pin versions, avoid experimental React Server Components, and keep the application portable behind its documented server functions/routes and Node deployment shape.
- Better Auth's custom password hooks make legacy credential verification feasible, but **the actual legacy hashing scheme must be identified before implementation**. Do not assume bcrypt, scrypt, or plaintext formats.
- An exclusion constraint needs an explicit SQL migration and should be verified against the actual booking status semantics. Its policy condition is a business decision, not an ORM default.
- Final hosting and database provider selection remains open; provider-neutral PostgreSQL and S3-compatible APIs reduce the impact of that decision.

## Sources

Primary documentation consulted 2026-08-12:

- [TanStack Start overview](https://tanstack.com/start/latest/docs/framework/react/overview) — RC status; SSR, server functions/routes, middleware, and full-stack TypeScript capabilities.
- [TanStack Start server functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions) — server-function execution, validation, CSRF behavior, authorization-at-endpoint guidance, and recommended `*.functions.ts` / `*.server.ts` layout.
- [TanStack Start execution model](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model) — isomorphic-default behavior and the need for explicit server boundaries.
- [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) — supported Node/Vercel deployment shape.
- [PostgreSQL range types](https://www.postgresql.org/docs/9.5/rangetypes.html) — range overlap operators and exclusion-constraint reservation example. The range/exclusion feature is longstanding PostgreSQL functionality; validate exact SQL on the selected supported PostgreSQL release.
- [Drizzle PostgreSQL integration](https://orm.drizzle.team/docs/get-started-postgresql) — supported `node-postgres` driver integration.
- [Drizzle migrations](https://orm.drizzle.team/docs/migrations) and [custom migrations](https://orm.drizzle.team/docs/drizzle-kit-generate) — versioned SQL migrations and custom migrations for SQL/seed work.
- [Drizzle transactions](https://orm.drizzle.team/docs/transactions) — transaction API and rollback semantics.
- [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle) — Drizzle adapter with PostgreSQL provider.
- [Better Auth database schema](https://better-auth.com/docs/concepts/database) — database-backed user, session, and credential-account records plus ORM schema generation.
- [Better Auth security](https://better-auth.com/docs/reference/security) and [options](https://better-auth.com/docs/reference/options) — password hashing/override hooks, cookie defaults, rate limiting, and email/password options.

## Confidence Assessment

| Area | Confidence | Basis / remaining validation |
|---|---|---|
| Keep TanStack Start, React, TypeScript, Vite, Tailwind, Biome | High | Matches explicit project constraint and installed codebase; Start provides required server primitives. |
| PostgreSQL + exclusion constraint for booking integrity | High | Directly matches the central concurrency requirement and documented PostgreSQL reservation pattern. Validate final status predicate with stakeholders. |
| Drizzle ORM + generated/custom migrations | High | Strong TypeScript fit and documented PostgreSQL/transaction/migration support. |
| Better Auth for migrated admin accounts | Medium | Drizzle/PostgreSQL and custom hash verification are documented, but viability depends on the unknown legacy account schema/hash format and institutional sign-in requirements. |
| Managed provider / deployment choice | Medium | Technically interchangeable but requires institutional decisions on residency, backup, procurement, operational ownership, and expected traffic. |
| File storage | Low-to-medium | Only needed if the legacy asset inventory includes file/image records; source discovery has not happened. |

---

*Stack research for Sarpras PPKASN — preserve the current application foundation; move integrity, authorization, and migration guarantees into explicit server and PostgreSQL boundaries.*
