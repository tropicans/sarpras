---
phase: 03
slug: booking-integrity-audit-core
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-14
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none |
| **Quick run command** | `node --import tsx --test src/lib/booking/booking.test.ts` |
| **Full suite command** | `node --import tsx --test src/db/migration.test.ts src/db/auth.test.ts src/lib/booking/booking.test.ts` |
| **Estimated runtime** | ~2.5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --import tsx --test src/lib/booking/booking.test.ts`
- **After every plan wave:** Run `node --import tsx --test src/db/migration.test.ts src/db/auth.test.ts src/lib/booking/booking.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | FLOW-01 | T-03-01 | State machine transitions and rejection reason enforcement | unit | `node --import tsx --test src/lib/booking/booking.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | FLOW-05 | T-03-02 | Asia/Jakarta timezone, operating hours and closure validator | unit | `node --import tsx --test src/lib/booking/booking.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | FLOW-04 | T-03-03 | PostgreSQL row-level lock (`SELECT FOR UPDATE`) prevents double bookings under concurrency | unit | `node --import tsx --test src/lib/booking/booking.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | FLOW-04, FLOW-05 | T-03-04 | Dormitory shared capacity calculations and attendance aggregation | unit | `node --import tsx --test src/lib/booking/booking.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | OPS-03 | T-03-05 | Append-only audit logger records actor, action, timestamp, and status diff | unit | `node --import tsx --test src/lib/booking/booking.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 3 | FLOW-01, OPS-03 | T-03-06 | Server function operations integrate state transitions, locks, and audit events | integration | `node --import tsx --test src/lib/booking/booking.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/booking/booking.test.ts` — test suites for state machine, availability checks, concurrency row locks, and audit logging.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| High-concurrency cluster simulation | FLOW-04 | Multi-process lock race | Spawn 20 parallel worker processes attempting to book the exact same room slot concurrently and verify exactly 1 succeeds and 19 receive HTTP 409 Conflict. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
