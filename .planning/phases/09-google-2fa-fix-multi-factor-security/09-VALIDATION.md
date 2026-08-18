---
phase: 9
slug: google-2fa-fix-multi-factor-security
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-18
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test` + `tsx`) |
| **Config file** | `package.json` |
| **Quick run command** | `node --import tsx --test src/lib/auth/two-factor.test.ts src/lib/auth/two-factor-enable-bug.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2 seconds (quick), ~16 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `node --import tsx --test src/lib/auth/two-factor.test.ts src/lib/auth/two-factor-enable-bug.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | 2FA-01 | — | `allowPasswordless: true` allows Google OAuth users to initiate TOTP 2FA without password error | unit | `node --import tsx --test src/lib/auth/two-factor-enable-bug.test.ts` | ✅ | ✅ green |
| 09-01-02 | 01 | 1 | 2FA-02 | — | QR Code display and backup codes confirmation | unit/integration | `node --import tsx --test src/lib/auth/two-factor.test.ts` | ✅ | ✅ green |
| 09-01-03 | 01 | 1 | 2FA-03 | — | Safe 2FA deactivation without password requirement for OAuth accounts | unit/integration | `node --import tsx --test src/lib/auth/two-factor.test.ts` | ✅ | ✅ green |
| 09-01-04 | 01 | 1 | 2FA-04 | — | 2FA challenge login route verifies TOTP or backup code and redirects to dashboard | integration | `node --import tsx --test src/lib/auth/two-factor.test.ts` | ✅ | ✅ green |
| 09-01-05 | 01 | 1 | 2FA-05 | — | Full automated test suite covers all 2FA lifecycle transitions | unit/regression | `node --import tsx --test src/lib/auth/two-factor.test.ts src/lib/auth/two-factor-enable-bug.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google Authenticator QR Scanning UX | 2FA-02 | Physical mobile app scanning cannot be fully emulated in node runner | 1. Open Admin Settings modal<br>2. Click "Mulai Aktivasi 2FA"<br>3. Scan QR code with Google Authenticator<br>4. Enter 6-digit code<br>5. Confirm backup codes are presented |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-18
