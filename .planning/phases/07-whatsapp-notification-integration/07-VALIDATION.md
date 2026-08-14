---
phase: "07"
slug: whatsapp-notification-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-14
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js Test Runner (`node:test`, `node:assert`, `tsx`) |
| **Config file** | `package.json` |
| **Quick run command** | `node --import tsx --test src/lib/whatsapp/phone.test.ts src/lib/whatsapp/templates.test.ts src/lib/whatsapp/service.test.ts` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --import tsx --test src/lib/whatsapp/phone.test.ts src/lib/whatsapp/templates.test.ts src/lib/whatsapp/service.test.ts`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | WA-01, WA-02 | — | Sanitize phone inputs, handle mock fallback safely | unit | `node --import tsx --test src/lib/whatsapp/phone.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | WA-04, WA-05, WA-06, WA-08 | — | Sanitize template interpolation, escape markdown properly | unit | `node --import tsx --test src/lib/whatsapp/templates.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | WA-01, WA-02, WA-03 | — | Asynchronous non-blocking dispatch with audit logging | unit | `node --import tsx --test src/lib/whatsapp/service.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | WA-04, WA-07, WA-08 | — | Non-blocking trigger on booking creation without holding tx lock | integration | `node --import tsx --test src/lib/booking/booking.test.ts` | ✅ | ⬜ pending |
| 07-02-02 | 02 | 2 | WA-05, WA-06 | — | Non-blocking trigger on approve/reject with rejection reason | integration | `node --import tsx --test src/lib/booking/booking.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/whatsapp/phone.test.ts` — stubs for phone sanitization (WA-01, WA-02)
- [ ] `src/lib/whatsapp/templates.test.ts` — stubs for message templates (WA-04, WA-05, WA-06, WA-08)
- [ ] `src/lib/whatsapp/service.test.ts` — stubs for gateway client, mock provider & audit trail (WA-01, WA-02, WA-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real WhatsApp Delivery | WA-01, WA-04 | Requires live Fonnte device connection | Set `FONNTE_API_TOKEN` in `.env.local`, submit booking with real phone number, inspect physical WhatsApp device |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-08-14
