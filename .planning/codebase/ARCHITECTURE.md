# Architecture

**Analysis Date:** 2026-08-18

## Pattern Overview

**Overall:** Full-stack Isomorphic Web Application with SSR, File-Based Routing, and Type-Safe RPC Server Functions using TanStack Start and TanStack Router.

**Key Characteristics:**
- **Full-Stack Type Safety:** Shared TypeScript types from database schema through server functions to React UI components.
- **Server Functions RPC Pattern:** Server logic executed via `createServerFn` eliminating the need for standalone REST boilerplate.
- **Multi-Tenant State & RBAC:** Multi-level access control (`admin`, `operator`, `pimpinan`, `public`) enforced at both router and server function boundaries.
- **Strict Timezone Enforcement:** Centralized date and time handling normalized to `Asia/Jakarta` (WIB) across all operations.

## Layers

**1. Presentation Layer (`src/components/`, `src/routes/`):**
- Purpose: Render user interfaces for public booking workflows and administrative backoffice portals.
- Contains:
  - Public UI components: Hero console, asset showcase, booking wizard (`src/components/public/`, `src/components/booking/`)
  - Admin UI components: Review drawers, calendar views, audit diff viewers, 2FA modals (`src/components/admin/`)
  - Headless UI primitives: Theme toggle, buttons, inputs (`src/components/ui/`)
- Depends on: Server functions (`src/lib/**/*.functions.ts`), client auth SDK (`src/lib/auth-client.ts`).

**2. Routing & Navigation Layer (`src/routes/`, `src/routeTree.gen.ts`, `src/router.tsx`):**
- Purpose: File-based routing tree with nested layouts, loaders, and navigation guards.
- Contains:
  - Root Layout: `src/routes/__root.tsx` (meta tags, theme provider, global CSS)
  - Public Routes: `src/routes/index.tsx`, `src/routes/book/$assetId.tsx`, `src/routes/status/$ref.tsx`, `src/routes/check-booking.tsx`
  - Auth Routes: `src/routes/login.tsx`, `src/routes/two-factor.tsx`
  - Admin Layout & Nested Routes: `src/routes/admin.tsx`, `src/routes/admin/index.tsx`, `src/routes/admin/bookings.tsx`, `src/routes/admin/calendar.tsx`, `src/routes/admin/assets.tsx`, `src/routes/admin/users.tsx`, `src/routes/admin/audit.tsx`
  - API Catch-All: `src/routes/api/auth/$.ts` (Better Auth HTTP endpoints)
- Depends on: Server functions, auth middleware.

**3. RPC / Server Functions Layer (`src/lib/**/*.functions.ts`):**
- Purpose: Bridge frontend calls to backend business logic with input validation and authentication checks.
- Contains:
  - `src/lib/booking/public-fns.functions.ts` (fetch public asset availability, submit booking)
  - `src/lib/booking/admin-fns.functions.ts` (approve/reject/cancel bookings, manage schedules)
  - `src/lib/booking/upload-letter.functions.ts` (multipart file upload handler)
  - `src/lib/assets/assets.functions.ts` (asset CRUD operations)
  - `src/lib/audit/admin-fns.functions.ts` (audit log querying)
  - `src/lib/auth/auth.functions.ts` (session inspection, 2FA verification)
- Depends on: Service layer and database layer.

**4. Service & Domain Logic Layer (`src/lib/**/*.server.ts`):**
- Purpose: Encapsulate core domain business logic, state machines, and external integrations.
- Contains:
  - Booking Domain Engine: `src/lib/booking/service.server.ts` (conflict detection, capacity checks, layout validation, transaction management)
  - Notification Service: `src/lib/notifications/service.server.ts` (dual-channel WhatsApp & Email dispatch)
  - WhatsApp Client: `src/lib/whatsapp/service.server.ts`
  - Email Client: `src/lib/email/service.server.ts`
  - Audit Logger: `src/lib/audit/audit.server.ts`
- Depends on: Database ORM and external gateway APIs.

**5. Data Access Layer (`src/db/`):**
- Purpose: PostgreSQL connection pooling, Drizzle ORM schema definitions, and migration execution.
- Contains:
  - Schema: `src/db/schema.ts`
  - Database Client: `src/db/client.server.ts`
  - Auth Server: `src/db/auth.server.ts`
  - Migrations: `src/db/migrate.ts`, `src/db/migrate-legacy.ts`
- Depends on: `pg` driver and PostgreSQL instance.

## Data Flow

**1. Public Booking Submission Flow:**
1. User selects facility on `src/routes/index.tsx` and navigates to `src/routes/book/$assetId.tsx`.
2. Multi-step wizard collects date/time range, requester information, layout preference, and optional letter attachment (`src/components/booking/`).
3. If letter attached, `uploadLetterFn` saves the file to `public/uploads/` and returns the file URL.
4. Wizard invokes `submitBookingFn` in `src/lib/booking/public-fns.functions.ts`.
5. `bookingService.createBooking` checks asset availability, closures, capacity, and active conflicts in PostgreSQL.
6. Booking record inserted with status `pending` in a database transaction.
7. Audit log written via `auditLogService.logAction`.
8. Background notification dispatched to requester and admin group via `notificationService.sendBookingCreatedNotification`.
9. Requester is redirected to `src/routes/status/$ref.tsx` with live status tracking.

**2. Administrative Review & Approval Flow:**
1. Administrator logs in via `src/routes/login.tsx` (with optional TOTP 2FA verification in `src/routes/two-factor.tsx`).
2. Admin accesses `src/routes/admin/bookings.tsx` with filtering and status tabs.
3. Admin clicks a booking to open `src/components/admin/booking-review-drawer.tsx`.
4. Admin submits approval or rejection (with mandatory reason via `src/components/admin/rejection-reason-modal.tsx`).
5. Action invokes `reviewBookingFn` in `src/lib/booking/admin-fns.functions.ts` (protected by `requireAuthMiddleware`).
6. State machine in `src/lib/booking/state-machine.ts` validates state transition legality.
7. Database updated, audit log recorded, and WhatsApp/Email notification dispatched to requester with updated status.

## Key Abstractions

**Booking State Machine (`src/lib/booking/state-machine.ts`):**
- Defines allowed lifecycle transitions: `pending -> approved`, `pending -> rejected`, `approved -> cancelled`, `pending -> cancelled`. Prevents illegal state overwrites.

**Timezone & DateTime Normalizer (`src/lib/timezone/datetime.ts`):**
- Ensures all database timestamps and business hour calculations are evaluated in `Asia/Jakarta` (WIB) to prevent server UTC offset bugs.

**Dual Notification Dispatcher (`src/lib/notifications/service.server.ts`):**
- Orchestrates asynchronous message rendering and delivery across both WhatsApp and Email with independent error boundaries.

**RBAC Middleware (`src/lib/auth.middleware.ts`):**
- Server function middleware enforcing authentication and role permissions (`admin`, `operator`, `pimpinan`).

## Entry Points

**Development Server:**
- Command: `vite dev --port 3000`
- Triggers: TanStack Start Vite dev server with HMR and file router generator.

**Production Server:**
- Location: `prod-server.js`
- Command: `node prod-server.js`
- Responsibilities: Serves static assets from `dist/client/` and `public/`, parses requests, and forwards dynamic traffic to TanStack Start SSR fetch handler (`dist/server/server.js`).

**Auth API Endpoint:**
- Location: `src/routes/api/auth/$.ts`
- Triggers: HTTP requests to `/api/auth/*` handled directly by Better Auth router.

## Error Handling

**Strategy:**
- Client-side error boundaries (`errorComponent` in TanStack Router) for graceful UI recovery.
- Server functions throw structured error objects with descriptive error messages.
- Form inputs validated using Zod schemas with inline field error display.
- External notification failures logged with context without failing the primary database transaction.

## Cross-Cutting Concerns

**Logging:**
- Structured server console output with timestamp, operation tag, and error stack traces.
- Immutable audit log records stored in `audit_logs` table for all state-altering actions.

**Authentication & Authorization:**
- Session validation via Better Auth cookie on every protected server function.
- RBAC hierarchy: `admin` (full access), `operator` (booking review and asset management), `pimpinan` (executive dashboard & reporting view).

**Theme System:**
- CSS variable-driven dark/light mode configured in `src/styles.css` with persistent theme toggle (`src/components/ui/theme-toggle.tsx`).

---

*Architecture analysis: 2026-08-18*
*Update after major architectural changes*
