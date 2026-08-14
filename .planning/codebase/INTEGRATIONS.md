# External Integrations & Services

**Analysis Date:** 2026-08-14

---

## 1. Database & Persistence Layer

- **Database Engine:** PostgreSQL (v14+ recommended)
- **Driver:** Node `pg` client (`pg.Pool`) configured in `src/db/client.server.ts`
- **Configuration:** Controlled by `DATABASE_URL` environment variable:
  - Example: `postgres://user:password@localhost:5432/sarpras_db`
- **Schema Management:** Drizzle ORM migrations located in `drizzle/` and executed via `src/db/migrate.ts`
- **Connection Lifecycle:** Singleton connection pool with automatic release and parameter binding.

---

## 2. WhatsApp Notification Gateway (Fonnte API)

- **Service Module:** `src/lib/whatsapp/service.server.ts`
- **API Endpoint:** `https://api.fonnte.com/send` (HTTP POST)
- **Authentication:** `FONNTE_API_TOKEN` header (`Authorization: <token>`)
- **Key Features:**
  - **Phone Normalization:** `src/lib/whatsapp/phone.ts` normalizes Indonesian phone numbers (`08xx`, `+628xx`, `628xx`) to standard `628xx` format and supports WhatsApp group IDs (`123456789-987654@g.us`).
  - **Resilience & Fallback:** When `FONNTE_API_TOKEN` is unset, `FONNTE_MOCK=true`, or `NODE_ENV=test`, dispatch falls back to formatted console mock logging without throwing errors.
  - **Non-blocking Dispatch:** `safeDispatchNotification()` wraps all API dispatches in background side-effects to ensure gateway outages never block booking operations.
  - **Audit Logging:** Every WhatsApp notification attempt (success, mock, or failure) is logged to `audit_logs` table with template metadata and payload response.
- **Notification Templates (`src/lib/whatsapp/templates.ts`):**
  - `BOOKING_CREATED_REQUESTER`: Confirmation message to user with booking reference & details.
  - `BOOKING_CREATED_ADMIN`: Operational alert sent to administrator recipient list (`WHATSAPP_ADMIN_RECIPIENTS`).
  - `BOOKING_APPROVED`: Approval notification sent to user with facility usage guidance.
  - `BOOKING_REJECTED`: Rejection notification with mandatory reason text.
  - `BOOKING_CANCELLED`: Notification when a reservation is cancelled.

---

## 3. Better Auth Authentication Provider

- **Auth Server Handler:** `src/db/auth.server.ts`
- **API Catch-all Route:** `src/routes/api/auth/$.ts`
- **Authentication Methods:**
  - Email & Password credentials with Scrypt password hashing.
  - Session tokens stored with `userId`, `expiresAt`, `ipAddress`, and `userAgent`.
- **RBAC Extension:** Custom user schema extensions for `role` (`admin`, `operator`, `pimpinan`), `status` (`active`, `inactive`), and `mustResetPassword`.

---

## 4. Legacy Data Ingestion Pipeline

- **Migration Script:** `src/db/migrate-legacy.ts`
- **Legacy Source:** JSON / SQL dumps in `legacy-data/` from legacy PHP/MySQL Sarpras system.
- **Features:**
  - Idempotent upserts linking `legacyId` across users, assets, and booking records.
  - Historical timezone normalization to `Asia/Jakarta`.
  - Comprehensive audit event recording (`migration.import`).

---

## 5. Audit Logging System

- **Audit Service:** `src/lib/audit/audit.server.ts`
- **Target Table:** `audit_logs`
- **Actions Recorded:**
  - Auth: `auth.login`, `auth.logout`, `user.create`, `user.update_status`, `user.reset_password`
  - Bookings: `booking.create`, `booking.approve`, `booking.reject`, `booking.cancel`
  - Assets: `asset.create`, `asset.update`, `asset.archive`, `asset.availability_update`
  - WhatsApp: `notification.whatsapp_dispatch`
  - System: `migration.import`

---

*Codebase integrations analysis: 2026-08-14*
