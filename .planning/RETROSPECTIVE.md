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

## Milestone: v1.1 — Role-Based Access Control (RBAC)

**Shipped:** 2026-08-14  
**Phases:** 1 | **Plans:** 1 | **Automated Tests:** 31 / 31 Passing (100%)

### What Was Built
- **Role Hierarchy & Validation (Phase 6):** Configured strict roles (`admin`, `operator`, `pimpinan`), implemented effective role resolution with fallback, and added route-level middleware validations.
- **Access Segregation:** Dynamically hid navigation links and dashboard action shortcuts based on permissions, restricted unauthorized role access to `/admin/users` and `/admin/audit`, and forced view-only mode for Pimpinan.

### What Worked
- **Middleware Reuse:** The rank-based helper allowed simple, concise middleware rules that protect both page loads and API functions.
- **Unit Testing Hierarchy:** Creating tests directly testing the rank hierarchy ensured authorization functions are robust.

### What Was Inefficient
- Node.js runtime not being globally available on the system PATH during daemon invocation required explicit absolute path references for CLI commands.

### Patterns Established
- **Unified middleware enforcement:** Applying `requireMinRole` consistently on both frontend routes and backend server functions ensures security at every boundary.

### Key Lessons
- **View-only constraints:** Conditionally hiding actions in layout files is helpful for UX, but backend checks are the only way to enforce security policies.

## Milestone: v1.2 — WhatsApp Notification & Integration

**Shipped:** 2026-08-14  
**Phases:** 1 | **Plans:** 2 | **Automated Tests:** 53 / 53 Passing (100%)

### What Was Built
- **WhatsApp Gateway & Client Core (Phase 7 Plan 1):** Configured Fonnte API integration, robust Indonesian phone number normalization (`08...`, `+628...`, `628...` and group IDs), safe mock/logger fallback for test/dev modes, Asia/Jakarta timestamp formatting in Indonesian markdown templates, and audit dispatch logging.
- **Lifecycle Notification Triggers (Phase 7 Plan 2):** Wired non-blocking post-commit async dispatches into all `BookingService` transition mutations (`createBookingRequest`, `approveBooking`, `rejectBooking`, `cancelBooking`) for requesters and operational alerts to administrators.

### What Worked
- **Non-blocking Post-Commit Hook Pattern:** Wrapping external gateway calls with `safeDispatchNotification` outside database transactions ensured zero latency impact and 100% transaction resilience against gateway failure or network timeout.
- **Mock Fallback Strategy:** Clear visual console boxes for mock WhatsApp notifications made local development and automated testing instant and reproducible without sending live messages or incurring gateway costs.

### What Was Inefficient
- Initial trigger integration needed careful handling of asset relation names and phone fallback when requesters omitted contact numbers.

### Patterns Established
- **Non-blocking external side-effects:** External communication providers (WhatsApp, Email, Webhooks) must always be dispatched after database transaction commits with complete try/catch isolation.
- **Structured notification templates:** Rejection messages strictly mandate rejection reasons, while submission/approval messages include deep status links and reference numbers.

### Key Lessons
- **Graceful degradation on missing contact info:** When user phone numbers are null or invalid, the core booking lifecycle proceeds seamlessly while logging a dispatch warning.

## Milestone: v1.3 — Dual-Channel Notification Integration (Resend Email + Fonnte WhatsApp)

**Shipped:** 2026-08-14  
**Phases:** 1 | **Plans:** 2 | **Automated Tests:** 74 / 74 Passing (100%)

### What Was Built
- **Resend Email Gateway & Responsive HTML/Plaintext Templates (Phase 8 Plan 1):** Built complete Resend REST integration with RFC 5322 address validation, multi-recipient list parsing, safe console ASCII mock logger, and 5 branded Indonesian HTML/plaintext email templates (submission, admin alert, approval, rejection, cancellation).
- **Unified Dual-Channel Orchestrator & Booking Integration (Phase 8 Plan 2):** Engineered concurrent multi-channel dispatch engine using `Promise.allSettled` to fire Email and WhatsApp notifications concurrently, wired into all `BookingService` transition mutations (`createBookingRequest`, `approveBooking`, `rejectBooking`, `cancelBooking`, `cancelBookingByPublicReference`), recording channel-specific audit events (`notification.email_dispatch` & `notification.whatsapp_dispatch`).

### What Worked
- **Concurrent `Promise.allSettled` Pattern:** Dispathing Email and WhatsApp in parallel guarantees that failure or delay in one gateway never impairs the other channel.
- **Dual HTML + Plaintext Template Strategy:** Building both HTML with institutional PPKASN palette (`#1e3a8a`) and markdown plaintext versions ensured high email deliverability and screen-reader accessibility.
- **Multi-recipient Admin Alerts:** Parsing comma-separated distribution lists in `ADMIN_DEFAULT_EMAIL` enabled seamless operations alerting across multiple admin team members.

### What Was Inefficient
- Initial test runner in `package.json` had hardcoded individual test files; updated it with glob/node runner to automatically execute all 10 unit and integration test files.

### Patterns Established
- **Channel-specific audit trails:** Distinguishing `notification.email_dispatch` and `notification.whatsapp_dispatch` in `audit_logs` provides unambiguous per-channel operational telemetry.
- **Multi-channel isolation:** Asynchronous dispatch orchestrator wraps all provider calls in isolated execution blocks so unexpected exceptions are trapped and logged without affecting caller execution.

### Key Lessons
- **Graceful recipient validation:** When users provide only an email or only a WhatsApp number, the orchestrator dispatches cleanly to available channels without throwing errors.

## Milestone: v1.4 — Google 2FA Fix & Multi-Factor Security

**Shipped:** 2026-08-18  
**Phases:** 1 | **Plans:** 1 | **Automated Tests:** 87 / 87 Passing across 18 test suites (100%)

### What Was Built
- **Two-Factor Authentication (TOTP) Server Configuration (Phase 9 Plan 1):** Configured `allowPasswordless: true` in Better Auth's `twoFactor` server plugin (`src/db/auth.server.ts`), resolving the 400 Bad Request / "Invalid password" error on 2FA enablement for Google OAuth and hybrid credential accounts.
- **Client Security Modal & Login Challenge UX Audit (Phase 9 Plan 1):** Verified `TwoFactorSetupModal` for QR code rendering, manual secret key copying with visual feedback, 10 emergency backup recovery codes generation, and safe passwordless 2FA disabling (`disable({})`). Audited `/two-factor` login challenge route for dual verification support (TOTP code + backup code) redirecting seamlessly to `/admin`.
- **Automated Regression Test Suite (Phase 9 Plan 1):** Built dedicated unit tests (`two-factor-enable-bug.test.ts` and `two-factor.test.ts`) reproducing and verifying the bugfix, and integrated them into the root test script.

### What Worked
- **Reproduction-First Bug Fixing:** Writing an automated reproduction test demonstrating the missing `allowPasswordless` option before fixing the config gave immediate proof of resolution.
- **Dual Verification Paths:** Providing both 6-digit TOTP validation and single-use emergency backup code recovery in `/two-factor` ensures administrators never get locked out.

### What Was Inefficient
- None encountered; the single-plan targeted execution ran cleanly in a single iteration.

### Patterns Established
- **Passwordless 2FA Configuration:** When using OAuth identity providers alongside email/password credentials, authentication plugins must explicitly allow passwordless TOTP enablement and disable operations without prompting for nonexistent passwords.

### Key Lessons
- **OAuth Multi-Factor Flows:** When integrating 2FA plugins with third-party OAuth providers (Google, GitHub, etc.), ensure the plugin configuration recognizes that OAuth accounts do not possess a password hash.

## Milestone: v1.5 — Dynamic Asset Facilities & Tags

**Shipped:** 2026-08-18  
**Phases:** 1 | **Plans:** 1 | **Automated Tests:** 96 / 96 Passing across 20 test suites (100%)

### What Was Built
- **Asset Facilities Database Schema & Migration (Phase 10 Plan 1):** Added `facilities: jsonb("facilities").$type<string[]>()` on the `assets` table with idempotent DDL migration script and database integration tests.
- **Facilities Helper & Sanitizer Engine (Phase 10 Plan 1):** Built Indonesian category preset suggestions (`CATEGORY_FACILITY_PRESETS`), sanitization logic (whitespace trimming, case-insensitive deduplication, 40-character length limits, 20 tags cap), and fallback resolver `getAssetFacilities(asset)`.
- **Admin Asset Management Tag Editor (Phase 10 Plan 1):** Added interactive tag chip manager in asset create/edit modal with dynamic category preset recommendations, custom badge inputs with Enter key support, and table preview badges.
- **Dynamic Public UI Tag Rendering (Phase 10 Plan 1):** Replaced hardcoded category strings with dynamic facility tags resolved via `getAssetFacilities(asset)` across discovery cards, schedule overview modals, and booking wizard headers with seamless category fallbacks for unconfigured assets.

### What Worked
- **Sanitization at the boundary:** `sanitizeFacilities` in both client presets and backend server function ensured database data remains clean, unique, and size-bounded.
- **Graceful Category Fallback:** Using `getAssetFacilities(asset)` across all public UI components ensured that unconfigured or legacy assets display sensible default tags without requiring manual migration of every asset record.

### What Was Inefficient
- None encountered; the plan executed cleanly with 100% test coverage in one pass.

### Patterns Established
- **JSONB for extensible asset metadata:** Storing array tags as JSONB allows flexible operator-driven configurations without requiring multi-table schema churn.
- **Unified display resolver with preset defaults:** Centralizing fallback resolution in a single helper (`getAssetFacilities`) guarantees consistent UI badge rendering across cards, modals, and wizards.

### Key Lessons
- **Default fallbacks prevent migration friction:** Allowing runtime fallback to sensible defaults when JSONB tags are empty or null makes schema enhancements non-disruptive for existing datasets.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Tests | Key Change |
|-----------|--------|-------|-------|------------|
| v1.5 | 1 | 1 | 96 | Implemented dynamic asset facility tags with admin management & public card fallbacks |
| v1.4 | 1 | 1 | 87 | Configured passwordless Google 2FA (TOTP) and multi-factor security verification |
| v1.3 | 1 | 2 | 74 | Integrated Resend email gateway and unified concurrent dual-channel orchestrator |
| v1.2 | 1 | 2 | 53 | Added asynchronous WhatsApp notifications and operational alert pipelines |
| v1.1 | 1 | 1 | 31 | Implemented secure role hierarchy and route-level authorization |
| v1.0 | 5 | 13 | 33 | Initial greenfield-to-production build with full GSD pipeline |

### Cumulative Quality

| Milestone | Tests | Pass Rate | Gaps |
|-----------|-------|-----------|------|
| v1.5 | 96 | 100% | 0 |
| v1.4 | 87 | 100% | 0 |
| v1.3 | 74 | 100% | 0 |
| v1.2 | 53 | 100% | 0 |
| v1.1 | 31 | 100% | 0 |
| v1.0 | 33 | 100% | 0 |

### Top Lessons (Verified Across Milestones)

1. Transactional concurrency control paired with audit logging guarantees clean operational history and prevents booking collisions.
2. Privacy-safe public API boundaries eliminate data leakage risks from the start.
3. View-only constraints on the UI should always be coupled with strict min-role boundary checks on the server.
4. Asynchronous post-commit dispatch guarantees third-party API reliability without compromising core database transaction integrity.
5. Concurrent multi-channel dispatch (`Promise.allSettled`) provides independent fault isolation across disparate external communication providers.
6. Multi-factor authentication must account for passwordless OAuth identity providers by enabling passwordless 2FA lifecycle operations.
7. Runtime category fallback defaults enable flexible schema evolution without breaking legacy or unmigrated datasets.

