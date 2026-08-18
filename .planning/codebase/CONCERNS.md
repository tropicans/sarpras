# Codebase Concerns

**Analysis Date:** 2026-08-18

## Tech Debt

**File Upload Storage (`public/uploads`):**
- Issue: Booking letter attachments are written directly to the local filesystem (`public/uploads/`).
- Why: Implemented for rapid development and simple single-container Docker setup without requiring S3/MinIO infrastructure.
- Impact: If the application container restarts without a persistent volume mapped to `public/uploads`, uploaded letters will be lost. Additionally, horizontal scaling across multiple container instances will cause broken attachments.
- Fix approach: Implement an S3-compatible object storage provider (e.g., AWS S3, MinIO, Cloudflare R2) behind an abstraction interface in `src/lib/storage/`.

**Booking Service Complexity (`src/lib/booking/service.server.ts`):**
- Issue: `service.server.ts` is over 33KB and handles conflict checking, availability calculations, database queries, notification triggers, and audit logging in a single file.
- Why: Domain logic grew organically during feature expansion.
- Impact: High cognitive load when editing booking business logic; risk of unintended side-effects.
- Fix approach: Refactor into focused sub-modules: `availability-checker.ts`, `conflict-resolver.ts`, and `booking-lifecycle.ts`.

## Known Issues & Fragile Areas

**Timezone Parsing & Date Boundary Edge Cases:**
- Why fragile: Bookings must strictly operate in `Asia/Jakarta` (WIB, UTC+7). If browser clients pass local dates without ISO timezone offsets or if server functions parse using `new Date()` without `date-fns-tz`, off-by-one date errors can occur.
- Safe modification: Always use the centralized helpers in `src/lib/timezone/datetime.ts` (`formatWibDate`, `parseWibDate`, `toUtcFromWib`). Never use vanilla `Date.parse()` or `toISOString().split('T')[0]`.
- Test coverage: Covered in `src/lib/booking/booking.test.ts`.

**Better Auth TOTP 2FA Verification Flow:**
- Why fragile: Better Auth's two-factor verification involves state transitions across `user.twoFactorEnabled`, `two_factor` table records, and active session tokens.
- Safe modification: When modifying auth flows, execute regression test suites in `src/lib/auth/two-factor-enable-bug.test.ts` and `src/lib/auth/two-factor-password-bug.test.ts`.

## Security Considerations

**Server Function Access Control:**
- Risk: Exposing administrative actions to unauthenticated users if middleware is omitted on newly created server functions.
- Current mitigation: `requireAuthMiddleware` and `requireRoleMiddleware` in `src/lib/auth.middleware.ts` validate session and role hierarchy (`admin`, `operator`, `pimpinan`).
- Recommendations: Maintain strict linting/code review rules ensuring every file in `src/lib/**/admin-fns.functions.ts` attaches `requireAuthMiddleware`.

**Public Attachment Uploads:**
- Risk: Malicious files uploaded through the public booking letter upload form.
- Current mitigation: File extension and MIME type validation in `src/lib/booking/upload-letter.functions.ts`.
- Recommendations: Add virus scanning (ClamAV) and enforce strict random filename generation with non-executable permissions.

**Rate Limiting:**
- Risk: Abuse of public booking submission (`submitBookingFn`) and public tracking status lookup (`status/$ref.tsx`).
- Recommendations: Introduce IP-based sliding window rate limiting for public endpoints.

## Performance Bottlenecks & Database Indexing

**Booking Conflict Queries:**
- Problem: Time-overlap conflict queries (`WHERE asset_id = ? AND status IN ('pending', 'approved') AND start_date < ? AND end_date > ?`) perform full-table scans if the table grows to thousands of records.
- Current mitigation: Primary key indexing on `id` and foreign key on `asset_id`.
- Improvement path: Add composite B-tree indexes in `src/db/schema.ts`:
  - `idx_bookings_asset_dates`: `(asset_id, start_date, end_date)`
  - `idx_bookings_status`: `(status)`
  - `idx_audit_logs_created_at`: `(created_at DESC)`

## Scaling Limits

**Current Capacity:**
- Single-node production deployment using Node.js HTTP server (`prod-server.js`) and PostgreSQL 16.
- Handles standard institutional workloads (~1,000 requests/minute).
- Bottlenecks at scale: File upload disk IO and concurrent DB connection pool exhaustion (`pg.Pool` default).

**Scaling Path:**
- Migrate file uploads to S3/MinIO.
- Configure PgBouncer for PostgreSQL connection pooling.
- Deploy multiple container replicas behind Nginx/Traefik load balancer with sticky sessions or centralized Redis session store if required.

## Dependencies at Risk

**React 19 & TanStack Start Ecosystem:**
- Status: `@tanstack/react-start` is under active development with frequent minor updates and evolving router conventions.
- Mitigation: Keep dependency versions pinned and verify build/SSR output after upgrading `@tanstack/*` packages.

---

*Concerns analysis: 2026-08-18*
*Update after codebase audits*
