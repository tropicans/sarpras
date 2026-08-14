# Phase 1: Canonical Data & Migration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-12
**Phase:** 1-Canonical Data & Migration
**Areas discussed:** Database technology & ORM (Drizzle vs. Prisma, migration tool choice), Legacy data format & migration trigger (CSV/JSON/SQL files, CLI script vs. Admin panel), Timezone preservation strategy (Postgres TIMESTAMPTZ, separate local + normalized fields), Migration reconciliation report format & destination (Console output, database table, or file artifact)

---

## Database technology & ORM (Drizzle vs. Prisma, migration tool choice)

### Q1: Which database ORM/client should we use?
| Option | Description | Selected |
|--------|-------------|----------|
| Drizzle ORM | Lightweight, SQL-like, native TypeScript support, fits TanStack Start perfectly | ✓ |
| Prisma ORM | Robust schema model definition, heavy but feature-rich | |
| pg (node-postgres) | Raw SQL queries, zero abstraction layer | |
| You decide | Let the developer agent choose | |

**User's choice:** Drizzle ORM

### Q2: Which database migration tool/workflow should we use?
| Option | Description | Selected |
|--------|-------------|----------|
| Drizzle Kit | Companion CLI tool for Drizzle ORM, generates SQL migrations from code schemas | ✓ |
| node-pg-migrate | Independent JavaScript/TypeScript migration tool for PostgreSQL | |
| You decide | Let the developer agent choose | |

**User's choice:** Drizzle Kit

### Q3: Where and how should we run database schema migrations?
| Option | Description | Selected |
|--------|-------------|----------|
| Run via npm CLI script | Execute `npm run db:migrate` manually or in build pipelines | ✓ |
| Auto-migrate on startup | Execute migrations programmatically inside the TanStack Start server entry point | |
| You decide | Let the developer agent choose | |

**User's choice:** Run via npm CLI script

### Q4: How should database connection credentials be managed in development?
| Option | Description | Selected |
|--------|-------------|----------|
| Load from a `.env` file | Use environment variables (e.g. DATABASE_URL) | ✓ |
| You decide | Let the developer agent choose | |

**User's choice:** Load from a `.env` file using environment variables

---

## Legacy data format & migration trigger (CSV/JSON/SQL files, CLI script vs. Admin panel)

### Q1: In what format is the legacy source data provided for migration?
| Option | Description | Selected |
|--------|-------------|----------|
| JSON files | Legacy data exported as structured JSON files inside the workspace | ✓ |
| CSV files | Flat comma-separated files for assets, bookings, and admins | |
| Direct SQL dump | Restoring tables directly from a database export file | |
| You decide | Let the developer agent choose | |

**User's choice:** JSON files

### Q2: How should the legacy migration script be triggered?
| Option | Description | Selected |
|--------|-------------|----------|
| CLI script | Run `npm run db:migrate-legacy` running a Node/TypeScript file | ✓ |
| Admin dashboard route | Authenticated UI page where administrators can trigger the import | |
| You decide | Let the developer agent choose | |

**User's choice:** CLI script

### Q3: How should the migration handle duplicates on subsequent runs?
| Option | Description | Selected |
|--------|-------------|----------|
| Preserve source identifiers | Map legacy IDs to a unique column, and ignore/skip duplicates if they already exist | ✓ |
| Upsert | Overwrite existing records if legacy IDs match | |
| Wipe and reload | Clear target tables before running the import | |
| You decide | Let the developer agent choose | |

**User's choice:** Preserve source identifiers (skip/ignore duplicates)

### Q4: How should legacy administrator account credentials be migrated?
| Option | Description | Selected |
|--------|-------------|----------|
| Preserve compatible hashes | Preserve compatible legacy hashes, or re-hash using a modern secure hashing algorithm (e.g. bcrypt) | ✓ |
| Reset passwords | Assign temporary passwords and flag accounts for forced reset on first login | |
| You decide | Let the developer agent choose | |

**User's choice:** Preserve compatible hashes / re-hash with modern secure algorithm

---

## Timezone preservation strategy (Postgres TIMESTAMPTZ, separate local + normalized fields)

### Q1: What column types should be used to store booking timestamps in PostgreSQL?
| Option | Description | Selected |
|--------|-------------|----------|
| TIMESTAMPTZ | PostgreSQL timestamp with time zone, which handles UTC conversion and timezone-aware queries natively | ✓ |
| TIMESTAMP (without timezone) | Store raw date-times, letting the application manage all timezone offsets | |
| You decide | Let the developer agent choose | |

**User's choice:** TIMESTAMPTZ

### Q2: How should the explicit Asia/Jakarta timezone interpretation be preserved?
| Option | Description | Selected |
|--------|-------------|----------|
| TIMESTAMPTZ + timezone column | Store normalized TIMESTAMPTZ in a main column, and keep a separate text column (e.g. `timezone`) for timezone name | ✓ |
| Two columns | Store local date-time as a raw timestamp or string and normalized UTC value as TIMESTAMPTZ | |
| You decide | Let the developer agent choose | |

**User's choice:** Store TIMESTAMPTZ in one column and keep a separate `timezone` text column set to 'Asia/Jakarta'

### Q3: How should the application parse and normalize date-time inputs?
| Option | Description | Selected |
|--------|-------------|----------|
| Parse using timezone library | Specify 'Asia/Jakarta' explicitly using date-fns-tz or luxon before converting to UTC | ✓ |
| Shift offset manually | Rely on native JS Date object and shift the hour offset manually in code | |
| You decide | Let the developer agent choose | |

**User's choice:** Parse using timezone library (date-fns-tz or luxon) specifying 'Asia/Jakarta' timezone

### Q4: How should timezone information be formatted and displayed in the UI?
| Option | Description | Selected |
|--------|-------------|----------|
| Always display in Asia/Jakarta | Always display bookings in Asia/Jakarta local time (WIB, UTC+7) across all UI elements | ✓ |
| Dynamic conversion | Detect browser timezone and display in visitor's local timezone | |
| You decide | Let the developer agent choose | |

**User's choice:** Always display bookings in Asia/Jakarta local time

---

## Migration reconciliation report format & destination (Console output, database table, or file artifact)

### Q1: Where should the migration reconciliation report be output or stored?
| Option | Description | Selected |
|--------|-------------|----------|
| Console output | Print a structured summary table to stdout during CLI command execution | ✓ |
| Database table | Save migration history, success metrics, and rejections in a database table | |
| File artifact | Write a markdown or JSON report file inside the workspace | |
| You decide | Let the developer agent choose | |

**User's choice:** Console output (stdout table)

### Q2: How should we ensure credentials do not leak in logs or reports?
| Option | Description | Selected |
|--------|-------------|----------|
| Redact password hashes | Explicitly redact/omit all password hashes or authentication payloads from console output and reports | ✓ |
| Log counts only | Log only aggregated counts (numbers) without record-level details | |
| You decide | Let the developer agent choose | |

**User's choice:** Explicitly redact/omit password hashes or authentication payloads

### Q3: What metrics and details should be included in the reconciliation report?
| Option | Description | Selected |
|--------|-------------|----------|
| Full metrics and errors | Source count, successfully imported count, rejected count, and detailed validation exception lists with reasons | ✓ |
| Aggregated counts only | Total, success, and fail counts without listing individual errors | |
| You decide | Let the developer agent choose | |

**User's choice:** Source count, imported count, rejected count, and detailed validation errors

### Q4: How should validation errors and rejected records be handled?
| Option | Description | Selected |
|--------|-------------|----------|
| Skip and log | Skip invalid records, logging the exact validation error, and proceed with other valid records | ✓ |
| Fail fast | Roll back the entire migration transaction if any invalid record is detected | |
| You decide | Let the developer agent choose | |

**User's choice:** Skip and log validation errors, allowing the rest of the files to migrate

---

## the agent's Discretion
- Dependencies configuration, schema folder layout, database client initialization, and test suites.

## Deferred Ideas
- None.
