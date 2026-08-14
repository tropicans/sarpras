# Phase 1: Canonical Data & Migration - Context

**Gathered:** 2026-08-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 establishes the durable PostgreSQL database schema and a repeatable, reconcilable CLI migration pipeline that imports legacy assets, bookings, and administrator accounts from local JSON files while ensuring idempotency via preserved source identifiers and correct Asia/Jakarta timezone handling.

</domain>

<decisions>
## Implementation Decisions

### Database Technology & ORM
- **D-01:** Use Drizzle ORM for database queries and schema definition — **Reversibility:** one-way — Changing ORM requires rewriting all schema files, queries, and schema migration logic.
- **D-02:** Use Drizzle Kit as the database migration generation and prototyping tool — **Reversibility:** costly — Swapping the migration generator requires re-creating database migrations from scratch.
- **D-03:** Run database migrations via an npm CLI script (e.g. `npm run db:migrate`) manually or in build pipelines before starting the server.
- **D-04:** Manage database credentials in development via environment variables loaded from a `.env` file (e.g. `DATABASE_URL`).

### Legacy Data Migration
- **D-05:** Accept legacy source data in JSON files (e.g., `legacy_assets.json`, `legacy_bookings.json`, `legacy_admins.json`) placed within the workspace.
- **D-06:** Execute the legacy migration using a custom CLI Node.js script (e.g. `npm run db:migrate-legacy`).
- **D-07:** Preserve legacy source identifiers in a dedicated unique column and check against them to skip duplicate records on subsequent migration runs (idempotency) — **Reversibility:** one-way — Dropping the legacy identifier columns or modifying the primary keys requires database migrations and risks losing idempotency guarantees.
- **D-08:** Preserve compatible legacy hashes, or re-hash using a modern secure hashing algorithm (e.g., bcrypt) for admin accounts — **Reversibility:** one-way — Undoing or changing authentication hashing algorithms requires either forced password resets or user re-authentications.

### Timezone Preservation Strategy
- **D-09:** Store booking timestamps in PostgreSQL using the TIMESTAMPTZ (timestamp with time zone) column type — **Reversibility:** one-way — Altering column types later from TIMESTAMPTZ to TIMESTAMP requires a migration that could truncate timezone offsets or alter stored data values.
- **D-10:** Preserve the explicit `Asia/Jakarta` interpretation by storing the normalized TIMESTAMPTZ along with a text column containing the timezone name ('Asia/Jakarta') — **Reversibility:** one-way — Schema alteration to remove timezone metadata columns requires database migration and rewrites of date-formatting code.
- **D-11:** Parse and normalize user inputs using a timezone-aware library (e.g., date-fns-tz or luxon) specifying 'Asia/Jakarta' explicitly before UTC conversion.
- **D-12:** Always display bookings formatted in the `Asia/Jakarta` local time zone (WIB, UTC+7) across all UI elements.

### Migration Reconciliation Report
- **D-13:** Print the reconciliation report as a structured ASCII table to stdout during CLI migration script execution.
- **D-14:** Explicitly redact/omit all password hashes, credentials, or authentication payloads from logs, reports, and stdout.
- **D-15:** Include the metrics for source record count, successfully imported count, rejected count, and detailed validation exception lists (reasons for rejection) in the report.
- **D-16:** Skip invalid records and log their exact validation errors to stdout, allowing other valid records in the file to migrate successfully.

### Agent's Discretion
- The developer agent has discretion over folder structure for schemas, dependencies configuration, database driver initialization, and test suites.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications
- [.planning/PROJECT.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/PROJECT.md) — Core value, active requirements, and key decisions.
- [.planning/REQUIREMENTS.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/REQUIREMENTS.md) — Traceability mapping, v1 requirements (DATA-01, DATA-02, DATA-03, DATA-04).
- [.planning/ROADMAP.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/ROADMAP.md) — Phase 1 goals, dependencies, and success criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The codebase is currently a clean starter template with React 19, TypeScript 6, Vite 8, Tailwind 4, and TanStack Start.

### Established Patterns
- Absolute paths configured with `@/*` and `#/*` source aliases in `tsconfig.json`.

### Integration Points
- Custom CLI scripts will connect in `package.json` under scripts and require database connection configuration.
- Future server routes and server functions will import the database schemas and client configured in this phase.

</code_context>

<specifics>
## Specific Ideas
- Use JSON files for legacy assets, bookings, and admins, stored in a gitignored or dedicated assets folder.
- Use `.env` file for local connection string.

</specifics>

<deferred>
## Deferred Ideas
- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Canonical Data & Migration*
*Context gathered: 2026-08-12*
