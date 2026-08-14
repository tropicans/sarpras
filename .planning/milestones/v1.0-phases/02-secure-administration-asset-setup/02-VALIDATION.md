---
phase: 02
slug: secure-administration-asset-setup
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-12
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none |
| **Quick run command** | `node --import tsx --test src/db/auth.test.ts` |
| **Full suite command** | `node --import tsx --test src/db/migration.test.ts src/db/auth.test.ts` |
| **Estimated runtime** | ~1.5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --import tsx --test src/db/auth.test.ts`
- **After every plan wave:** Run `node --import tsx --test src/db/migration.test.ts src/db/auth.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-01 | T-02-01 | Better Auth package and drizzle schema additions | unit | `node --import tsx --test src/db/auth.test.ts` | ✅ W1 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-01 | T-02-02 | Better Auth server and client client initialization | unit | `node --import tsx --test src/db/auth.test.ts` | ✅ W1 | ⬜ pending |
| 02-01-03 | 01 | 1 | AUTH-02 | T-02-03 | Auth Middleware checks sessions and throws 401/403 | unit | `node --import tsx --test src/db/auth.test.ts` | ✅ W1 | ⬜ pending |
| 02-02-01 | 02 | 2 | AUTH-01 | T-02-04 | Password reset enforced for legacy users | unit | `node --import tsx --test src/db/auth.test.ts` | ✅ W2 | ⬜ pending |
| 02-02-02 | 02 | 2 | AUTH-04 | T-02-05 | Admin user deactivation and immediate session deletion | unit | `node --import tsx --test src/db/auth.test.ts` | ✅ W2 | ⬜ pending |
| 02-03-01 | 03 | 3 | ASSET-01 | — | Asset CRUD and soft deletion / archiving | unit | `node --import tsx --test src/db/auth.test.ts` | ✅ W3 | ⬜ pending |
| 02-03-02 | 03 | 3 | ASSET-02 | — | Relational schedule validation in Asia/Jakarta | unit | `node --import tsx --test src/db/auth.test.ts` | ✅ W3 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Vitest or external runner is not needed; `node:test` is already used by `src/db/migration.test.ts` and will be used for `src/db/auth.test.ts`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login Form Interaction | AUTH-01 | Browser DOM validation | Deploy, navigate to `/login`, submit credentials, verify cookies set and redirect to `/admin`. |
| Session Revocation logout | AUTH-02 | Session cookie clear | Click logout button, verify redirect to `/login` and cookies cleared. |
| User management UI list | AUTH-04 | Interactive deactivation | Navigate to `/admin/users`, click deactivation confirm button, verify logout on deactivated user's session. |
| Asset scheduling interface | ASSET-02 | Interface rendering | Navigate to `/admin/assets`, add a weekly availability slot, verify in database and schedule list. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
