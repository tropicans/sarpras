---
phase: 05
slug: administrative-decisions-operations
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-14
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js Test Runner with `tsx` |
| **Config file** | `package.json` |
| **Quick run command** | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` |
| **Full suite command** | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/db/migration.test.ts src/db/auth.test.ts src/lib/booking/booking.test.ts src/lib/booking/admin.test.ts` |
| **Estimated runtime** | ~14 seconds |

---

## Sampling Rate

- **After every task commit:** Run `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts`
- **After every plan wave:** Run `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/db/migration.test.ts src/db/auth.test.ts src/lib/booking/booking.test.ts src/lib/booking/admin.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | FLOW-02, FLOW-03, OPS-01, OPS-02, OPS-04 | T-05-01 | Admin server functions, conflict detection, decisions, KPIs, calendar & audit queries | unit | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` | ❌ (Wave 0) | ⬜ pending |
| 05-02-01 | 02 | 2 | OPS-01 | T-05-01 | Dashboard KPIs, urgent pending widget, and updated admin layout navigation | integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 2 | FLOW-02, FLOW-03, OPS-01 | T-05-02 | Bookings filter bar, approval queue table, review drawer with live conflict detection & rejection modal | integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` | ✅ | ⬜ pending |
| 05-03-01 | 03 | 3 | OPS-02 | T-05-01 | Asset-centric operations calendar (Month/Week views, color-coded badges, slot preview popover) | integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` | ✅ | ⬜ pending |
| 05-03-02 | 03 | 3 | OPS-04 | T-05-03 | Audit trail explorer with multi-criteria filters and visual state diff viewer | integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Test infrastructure configured in `package.json`
- [ ] Create `src/lib/booking/admin.test.ts` with tests for admin queries, KPI calculations, conflict context analyzer, approval/rejection decision execution, calendar event queries, and audit log queries

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Calendar Month/Week visual grid & slot popovers | OPS-02 | Visual calendar layout and interaction | Open `/admin/calendar` in browser, switch between Room and Dormitory, switch Month/Week view, click slots |
| Review Drawer & Rejection Modal UX | FLOW-02, FLOW-03 | Interactive drawer and modal animations | Open `/admin/bookings`, click "Review" on a pending booking, test preset rejection reason selection |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
