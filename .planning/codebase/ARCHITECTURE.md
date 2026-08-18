# System Architecture & Design Patterns

**Analysis Date:** 2026-08-18

---

## 1. High-Level Architectural Overview

Sarpras PPKASN is a full-stack facility & asset reservation management system built on **TanStack Start** (SSR + Server Functions) and **React 19**, styled with **Tailwind CSS v4** and backed by **PostgreSQL** via **Drizzle ORM**.

```
                           ┌───────────────────────────────┐
                           │    TanStack Router Client     │
                           │ (Public Landing, Booking Flow │
                           │  Admin Dashboard, Calendar)   │
                           └───────────────┬───────────────┘
                                           │ RPC / Server Functions
                                           ▼
                           ┌───────────────────────────────┐
                           │   TanStack Start RPC Engine   │
                           │  - Auth & Role Middlewares    │
                           │  - Server Functions (.server) │
                           └───────────────┬───────────────┘
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                ▼                          ▼                          ▼
      ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
      │   Drizzle ORM    │       │  Better Auth     │       │ Notification Svc │
      │  (PostgreSQL DB) │       │  (TOTP / 2FA)    │       │ (WA & Email)     │
      └──────────────────┘       └──────────────────┘       └──────────────────┘
```

---

## 2. Core Architectural Layers

### Presentation Layer (`src/routes/` & `src/components/`)
- **Public Portal:**
  - `src/routes/index.tsx`: Interactive hero console, bento showcase, asset catalog, category filter chips, and public availability drawer.
  - `src/routes/book/$assetId.tsx`: Multi-step booking wizard (`ScheduleStep` -> `RequesterStep` -> `ReviewStep` -> `SuccessCard`).
  - `src/routes/status/$ref.tsx`: Real-time booking tracking page with timeline and letter download.
  - `src/routes/check-booking.tsx`: Quick reference code lookup.
- **Admin Portal (`src/routes/admin/`):**
  - `src/routes/admin.tsx`: Layout container with sidebar navigation, user profile, 2FA setup modal trigger, and theme toggle.
  - `src/routes/admin/index.tsx`: Dashboard with urgent booking widgets, KPIs, quick actions.
  - `src/routes/admin/assets.tsx`: Asset management with dynamic facility tagger, capacity slider, room layout configurations, and schedule overrides.
  - `src/routes/admin/bookings.tsx`: Comprehensive booking data table with filters, search, and batch operations.
  - `src/routes/admin/calendar.tsx`: Interactive monthly/weekly asset calendar with popover event cards.
  - `src/routes/admin/users.tsx`: User role & status management (Admin, Operator, Pimpinan).
  - `src/routes/admin/audit.tsx`: Visual audit log viewer with JSON diff inspector.

### Server Functions & RPC Layer (`src/lib/**/*.functions.ts`)
- Utilizes TanStack Start `createServerFn` to define type-safe server RPC endpoints.
- Middlewares:
  - `authMiddleware`: Ensures caller has an active session.
  - `requireRoleMiddleware(['admin', 'operator'])`: Enforces hierarchical RBAC rank checking.

### Domain Service Layer (`src/lib/**/*.server.ts`)
- Pure server-side logic encapsulating business rules, validations, and database interactions:
  - `src/lib/booking/service.server.ts`: Booking creation, double-booking validation, status transitions, approval/rejection workflows.
  - `src/lib/booking/availability.ts`: Asset working hours, daily slots, and closure date calculations.
  - `src/lib/booking/dormitory.ts`: Multi-day dormitory bed capacity and overlap accounting.
  - `src/lib/notifications/service.server.ts`: Unified dual-channel notification dispatcher.
  - `src/lib/whatsapp/service.server.ts` & `src/lib/email/service.server.ts`: Specific notification transports.
  - `src/lib/audit/audit.server.ts`: Central audit event logger.

### Persistence Layer (`src/db/`)
- `src/db/schema.ts`: Drizzle PostgreSQL schemas for `users`, `sessions`, `accounts`, `verifications`, `two_factors`, `assets`, `bookings`, `asset_availability`, `asset_closures`, `audit_logs`.
- `src/db/client.server.ts`: Singleton PostgreSQL client pool.
- `src/db/migrate.ts`: DDL runner.

---

## 3. Key Design Patterns

1. **Server Function RPC Pattern:** Client components call typed `createServerFn` functions without writing manual fetch boilerplate or API routes.
2. **State Machine for Bookings:** Status transitions (`pending` -> `approved` / `rejected` / `cancelled`) are strictly validated in `src/lib/booking/state-machine.ts`.
3. **Graceful Fallback / Mock Gateways:** Notification gateways automatically switch to structured console logging when API keys are absent or running in test environments.
4. **Hierarchical RBAC:** Roles follow strict privilege hierarchy (`admin` > `pimpinan` > `operator`), verified through unified role helper functions.
5. **Timezone Normalization:** All booking timestamps are stored in UTC with timezone context (`Asia/Jakarta`), converted explicitly via `src/lib/timezone/datetime.ts`.

---

*Codebase architecture analysis: 2026-08-18*
