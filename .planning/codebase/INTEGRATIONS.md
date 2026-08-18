# External Integrations

**Analysis Date:** 2026-08-18

## APIs & External Services

**WhatsApp Gateway:**
- **Fonnte HTTP API** (`https://api.fonnte.com/send`) - Transactional notification delivery to requesters and administrator groups
  - Client: Custom fetch service in `src/lib/whatsapp/service.server.ts`
  - Auth: Bearer token via `FONNTE_API_TOKEN` environment variable
  - Features: Automatic Indonesian phone normalization (`62xxx`), multi-recipient routing (`FONNTE_ADMIN_TARGET`), mock console mode (`FONNTE_MOCK=true`)
  - Templates: `src/lib/whatsapp/templates.ts` (new booking submitted, approved, rejected, cancelled, and admin notification)

**Email Gateway:**
- **Resend HTTP API** (`https://api.resend.com/emails`) - Transactional HTML email notifications
  - Client: Custom fetch service in `src/lib/email/service.server.ts`
  - Auth: Bearer token via `RESEND_API_KEY` environment variable
  - Features: RFC 5322 email syntax validation, sender configuration via `EMAIL_FROM`, mock console fallback (`RESEND_MOCK=true`)
  - Templates: `src/lib/email/templates.ts` (custom styled HTML booking confirmation, approval, rejection, and admin alerts)

**Notification Orchestration:**
- **Dual-Channel Dispatcher:** `src/lib/notifications/service.server.ts`
  - Concurrently triggers both WhatsApp and Email notifications with fault tolerance (errors in one channel do not block the other)

## Data Storage

**Databases:**
- **PostgreSQL 16** (Containerized or external host)
  - Connection: Connection string via `DATABASE_URL` env var
  - Client: `drizzle-orm` with `pg.Pool` client in `src/db/client.server.ts`
  - Migrations: Programmatic runner in `src/db/migrate.ts` and legacy importer in `src/db/migrate-legacy.ts`
  - Key Tables: `user`, `session`, `account`, `verification`, `two_factor`, `assets`, `bookings`, `audit_logs`, `asset_availability`, `asset_closures`

**File Storage:**
- **Local File System Storage:**
  - Directory: `public/uploads/`
  - Usage: Uploaded official booking request letters (PDF/Image)
  - Handling: Managed via server function in `src/lib/booking/upload-letter.functions.ts` and served directly by `prod-server.js`

**Caching & In-Memory:**
- None external (stateless server functions with direct PostgreSQL transactions)

## Authentication & Identity

**Auth Provider:**
- **Better Auth** (`better-auth: ^1.6.27`)
  - Implementation: `src/db/auth.server.ts` (server auth instance) and `src/lib/auth-client.ts` (React client SDK)
  - Adapter: `@better-auth/drizzle-adapter` connected to PostgreSQL tables
  - Session Management: HttpOnly secure cookie tokens verified against `session` table
  - Two-Factor Authentication: Built-in TOTP plugin with encrypted secrets and backup codes in `two_factor` table

**OAuth Integrations:**
- **Google OAuth 2.0:**
  - Credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional)
  - Scope: OpenID, profile, email

## Monitoring & Observability

**Audit Logging:**
- Internal Audit Engine: `src/lib/audit/audit.server.ts`
  - Persists system and user actions into `audit_logs` table (`actorId`, `actorType`, `action`, `entityType`, `entityId`, `metadata`)
  - Admin UI viewer: `src/routes/admin/audit.tsx` with diff visualizer (`src/components/admin/audit-diff-viewer.tsx`)

**Logs:**
- Standard output (`console.info`, `console.error`, `console.warn`) with structured event metadata

## CI/CD & Deployment

**Hosting & Containers:**
- **Docker Compose:** `docker-compose.yml` defining `app` (Node.js 22 production runtime) and `postgres` (PostgreSQL 16 Alpine with health check)
- **Container Build:** Multi-stage `Dockerfile` with dependency pruning and build asset optimization
- **Production Entry:** `prod-server.js` serving TanStack Start SSR handler and static assets on port `3000` (mapped to `3002` externally)

## Environment Configuration

**Development & Production Required Variables:**
- `DATABASE_URL`: PostgreSQL connection URI (`postgres://user:pass@host:port/dbname`)
- `BETTER_AUTH_SECRET`: Random 64-character secret for token signing and encryption
- `BETTER_AUTH_URL`: Canonical URL of application (e.g., `http://localhost:3000` or production domain)
- `APP_BASE_URL`: Public base URL for tracking links in WhatsApp/Email messages
- `FONNTE_API_TOKEN`: Fonnte WhatsApp API Gateway token
- `FONNTE_ADMIN_TARGET`: Phone number(s) or WhatsApp Group ID for admin alerts
- `FONNTE_MOCK`: Set to `true` to log WhatsApp payloads without sending
- `RESEND_API_KEY`: Resend Email API token
- `RESEND_MOCK`: Set to `true` to log Email payloads without sending
- `EMAIL_FROM`: Verified sender email address
- `ADMIN_DEFAULT_EMAIL`: Initial admin account email for automated seeding (`src/db/seed-admin.ts`)

---

*Integrations analysis: 2026-08-18*
*Update after external service changes*
