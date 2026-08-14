---
phase: 04
slug: public-discovery-booking-requests
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-14
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js Test Runner with `tsx` |
| **Config file** | `package.json` |
| **Quick run command** | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` |
| **Full suite command** | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/db/migration.test.ts src/db/auth.test.ts src/lib/booking/booking.test.ts` |
| **Estimated runtime** | ~12 seconds |

---

## Sampling Rate

- **After every task commit:** Run `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts`
- **After every plan wave:** Run `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/db/migration.test.ts src/db/auth.test.ts src/lib/booking/booking.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | ASSET-04 | T-04-01 | Public projections omit requester PII | unit | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | BOOK-03 | T-04-02 | Preflight check enforces closures & hours | unit | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 2 | ASSET-04 | T-04-01 | Public catalog and schedule modal render without PII | integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 2 | BOOK-01, BOOK-02, BOOK-04 | T-04-02 | 3-step booking wizard submits request and returns reference | integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` | ✅ | ⬜ pending |
| 04-03-01 | 03 | 3 | BOOK-05, D-07 | T-04-03 | Public status lookup and cancellation by reference token | integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Test infrastructure configured in `package.json`
- [ ] Add tests for `getPublicAssetsWithStatusFn`, `getAssetPublicScheduleFn`, `checkAvailabilityPreflightFn`, and `getPublicBookingStatusFn` in `src/lib/booking/booking.test.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive mobile view & step animations | BOOK-01 | Visual UX & responsive layout check | Open `/book/$assetId` and `/` in browser mobile viewport, test step transitions |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
