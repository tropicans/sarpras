# External Integrations & Services

**Analysis Date:** 2026-08-18

---

## 1. Database Integration

### PostgreSQL Connection
- **Client:** `pg.Pool` configured in `src/db/client.server.ts`
- **Environment Variable:** `DATABASE_URL` (e.g., `postgres://postgres:password@localhost:5432/sarpras_db`)
- **Connection Configuration:**
  - `max`: 20 connections
  - `idleTimeoutMillis`: 30,000ms
  - `connectionTimeoutMillis`: 5,000ms
- **Integration Layer:** Drizzle ORM instance (`drizzle(pool, { schema })`) used across server functions and migration utilities.

---

## 2. Authentication & Session Services

### Better Auth Integration
- **Server Handler:** `src/db/auth.server.ts` exposes Better Auth instance with Drizzle PostgreSQL adapter.
- **Client Handler:** `src/lib/auth-client.ts` uses `createAuthClient` with `twoFactorClient` plugin.
- **API Endpoints:** `src/routes/api/auth/$.ts` handles incoming auth requests (`/api/auth/*`).
- **Plugins:**
  - Two-Factor Authentication (TOTP authenticator app support, QR uri, backup codes)
- **Environment Variables:**
  - `BETTER_AUTH_SECRET`: Secret key for session encryption and signing.
  - `BETTER_AUTH_URL`: Origin URL for Better Auth verification redirects (e.g., `http://localhost:3000`).

---

## 3. WhatsApp Notification Gateway (Fonnte)

### Outbound Gateway
- **Service Layer:** `src/lib/whatsapp/service.server.ts`
- **Endpoint:** `https://api.fonnte.com/send` (HTTP POST)
- **Header:** `Authorization: {FONNTE_API_TOKEN}`
- **Payload Schema:** `target`, `message`, `countryCode: "62"`, optional `url` / `filename`.
- **Environment Variables:**
  - `FONNTE_API_TOKEN`: API key from Fonnte account dashboard.
  - `FONNTE_ADMIN_TARGET`: Phone number or Group ID (`120363xxx@g.us`) for receiving admin booking alerts.
  - `FONNTE_MOCK`: When set to `"true"` or when no token is configured, logs message payloads to terminal console instead of making network calls.
- **Audit Integration:** Dispatches are logged to `audit_logs` table under action `whatsapp.dispatch`.

---

## 4. Email Notification Gateway (Resend)

### Transactional Email Service
- **Service Layer:** `src/lib/email/service.server.ts`
- **Endpoint:** `https://api.resend.com/emails` (HTTP POST)
- **Header:** `Authorization: Bearer {RESEND_API_KEY}`
- **Payload Schema:** `from`, `to`, `subject`, `html`, optional attachments.
- **Environment Variables:**
  - `RESEND_API_KEY`: API key from Resend dashboard (`re_...`).
  - `EMAIL_FROM`: Verified sender address (default: `Sarpras PPKASN <sarpras@ppkasn.lan.go.id>`).
  - `EMAIL_ADMIN_TARGET`: Comma-separated list of admin email recipients for new booking alerts.
  - `RESEND_MOCK`: Set to `"true"` to enable console mock mode for local testing.
- **Audit Integration:** Dispatches are logged to `audit_logs` table under action `email.dispatch`.

---

## 5. File Storage & Uploads

- **Storage Location:** Local public uploads directory (`public/uploads/`) or custom letter file URLs.
- **Upload Handlers:**
  - `src/lib/booking/upload-letter.functions.ts` creates local file records with UUID-based names.
  - Tracking & letter URLs stored in `bookings.letter_file_url` and `bookings.letter_file_name`.

---

## 6. Legacy System Data Ingestion

- **Legacy Source:** MySQL / PHP export in `legacy-data/` (`assets.json`, `bookings.json`, `users.json`).
- **Migration Script:** `src/db/migrate-legacy.ts`
- **Mapping:**
  - Transforms legacy asset IDs and facility strings into normalized JSONB structures.
  - Preserves historical booking status, notes, and requester contact info with `legacyId` tracing.
  - Ingests legacy users with mandatory password reset flag (`mustResetPassword: true`).

---

*Codebase integrations and external services analysis: 2026-08-18*
