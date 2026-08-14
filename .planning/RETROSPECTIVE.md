# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP Core Booking Platform & Administration

**Shipped:** 2026-08-14  
**Phases:** 5 | **Plans:** 13 | **Automated Tests:** 33 / 33 Passing (100%)

### What Was Built
- **Canonical Data & Migration (Phase 1):** Robust Drizzle schema on PostgreSQL, Asia/Jakarta (WIB) wall-clock time conversions, and an idempotent CLI migration tool with reconciliation reporting.
- **Secure Administration & Asset Setup (Phase 2):** Better Auth server integration, role hierarchy enforcement (admin/operator/pimpinan), session invalidation on user deactivation, and full asset CRUD with operating hours & date closures.
- **Booking Integrity & Audit Core (Phase 3):** Strict state machine (`pending` → `approved` / `rejected` / `cancelled`), row-level concurrency locking (`SELECT FOR UPDATE`), multi-booking dormitory shared capacity calculation, and an append-only audit trail.
- **Public Discovery & Booking Requests (Phase 4):** Responsive public catalog, privacy-safe schedule modals (no PII leakage), 3-step booking wizard with live pre-flight availability check, and non-guessable reference tracking with self-service cancellation.
- **Administrative Decisions & Operations (Phase 5):** Management queue with slide-out review drawer and live conflict analysis, mandatory rejection reason modal, operations calendar (Month/Week views), and system audit explorer with visual state diffs.

### What Worked
- **Wave-based execution and TDD:** Writing domain unit tests and server fns before UI components kept every phase deterministic and fast.
- **Goal-backward verification:** Clear verification criteria in plans ensured 100% test coverage with zero lingering regressions.
- **Privacy-by-default architecture:** Separating public status/schedule projections from sensitive requester PII prevented data leakage.

### What Was Inefficient
- Initial phase verification artifacts missed YAML frontmatter, requiring a quick formatting pass during milestone closeout.

### Patterns Established
- **Asia/Jakarta Timezone standard:** All database timestamps stored in UTC, converted explicitly with `date-fns-tz` to `Asia/Jakarta` for business hours, day boundaries, and display.
- **Authoritative server validations:** Public wizards offer instant diagnostics, but server functions re-validate all business constraints under PostgreSQL transactions before committing.
- **Audit-first mutations:** Every state transition automatically writes structured diffs (`oldStatus`, `newStatus`, `reason`) to `audit_logs`.

### Key Lessons
1. **Concurrency locking is essential early:** Row-level locks on assets prevented race conditions during simultaneous booking approvals.
2. **Dormitory capacity math:** Calculating daily overlapping occupancy with date ranges ensures rooms and dormitories share a clean domain interface while handling distinct capacity rules.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Tests | Key Change |
|-----------|--------|-------|-------|------------|
| v1.0 | 5 | 13 | 33 | Initial greenfield-to-production build with full GSD pipeline |

### Cumulative Quality

| Milestone | Tests | Pass Rate | Gaps |
|-----------|-------|-----------|------|
| v1.0 | 33 | 100% | 0 |

### Top Lessons (Verified Across Milestones)

1. Transactional concurrency control paired with audit logging guarantees clean operational history and prevents booking collisions.
2. Privacy-safe public API boundaries eliminate data leakage risks from the start.
