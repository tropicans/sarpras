---
phase: 08
slug: dual-channel-notification-integration
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-14
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js Native Test Runner (`node --import tsx --test`) |
| **Config file** | `package.json` |
| **Quick run command** | `node --import tsx --test src/lib/email/templates.test.ts src/lib/email/service.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10-15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --import tsx --test src/lib/email/templates.test.ts src/lib/email/service.test.ts` or relevant unit test file
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | EMAIL-05, EMAIL-06, EMAIL-07, EMAIL-08 | T-08-01 | Sanitize & escape HTML strings in templates | unit | `node --import tsx --test src/lib/email/templates.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04 | T-08-02 | Validate emails & isolate mock gateway securely | unit | `node --import tsx --test src/lib/email/service.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | NOTIF-01, NOTIF-02, EMAIL-04 | T-08-03 | Concurrent fault-isolated dispatch & immutable audit logs | integration | `node --import tsx --test src/lib/notifications/service.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 2 | NOTIF-01, NOTIF-02 | T-08-04 | BookingService triggers dual notifications post-commit | integration | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/email/templates.test.ts` — stubs for EMAIL-05, EMAIL-06, EMAIL-07, EMAIL-08
- [ ] `src/lib/email/service.test.ts` — stubs for EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04
- [ ] `src/lib/notifications/service.test.ts` — stubs for NOTIF-01, NOTIF-02

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real Resend API dispatch with valid API key | EMAIL-01 | Requires external live network credentials | Configure `RESEND_API_KEY` in `.env.local` and submit a booking request to observe live email in inbox |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-08-14
