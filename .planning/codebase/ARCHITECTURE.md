# Architectural Patterns & System Design

**Analysis Date:** 2026-08-14

---

## 1. High-Level Architectural Pattern

The application follows an **Isomorphic Full-Stack TypeScript Architecture** powered by **TanStack Start**, **React 19**, and **Drizzle ORM**. It utilizes RPC-style Server Functions (`createServerFn`) to provide end-to-end type safety between client components and backend services without manual REST API route boilerplate.

```
┌────────────────────────────────────────────────────────┐
│               Client / UI Layer (React 19)              │
│  - Public Catalog & Stepper Booking Wizard              │
│  - Admin Operations Dashboard, Calendar & Audit Table  │
└──────────────────────────┬─────────────────────────────┘
                           │ TanStack Router / RPC
┌──────────────────────────▼─────────────────────────────┐
│           Server Functions & Middleware Layer          │
│  - Auth Middleware (Session validation, Status check)   │
│  - RBAC Middleware (Role hierarchy: Admin/Pimpinan/Op) │
│  - Zod Input Validation & CSRF Protection               │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│             Domain & Business Logic Layer              │
│  - Booking Engine (Availability, Dormitory, Overlap)   │
│  - WhatsApp Notification Dispatcher (Fonnte / Mock)    │
│  - Audit Logging Subsystem                             │
│  - Timezone Normalization Engine (Asia/Jakarta)        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│            Data Persistence Layer (Drizzle ORM)        │
│  - PostgreSQL Pool (pg)                                │
│  - Relational Schema & Strong Foreign Key Constraints  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Layers

### 1. Presentation & Routing Layer (`src/routes/` & `src/components/`)
- **Route Definitions:** Built with TanStack Router file-based route definitions (`createFileRoute`).
- **Layouts & Guards:**
  - `src/routes/__root.tsx`: Document shell with Geist variable fonts, meta tags, and DevTools.
  - `src/routes/admin.tsx`: Authenticated admin layout with role-aware navigation bar, user session badge, and route protection.
  - `src/routes/index.tsx`: Public portal with asset cards, category filtering, and direct availability inspection modal.
  - `src/routes/book/$assetId.tsx`: 4-step wizard stepper for creating bookings.
  - `src/routes/status/index.tsx` & `src/routes/status/$ref.tsx`: Public tracking portal to search and view reservation status by UUID.

### 2. Server Functions & RPC Layer (`src/lib/**/*.functions.ts`)
- **Pattern:** Declarative `createServerFn({ method: "GET" | "POST" })` endpoints with `.validator(zodSchema)` and `.middleware([authMiddleware])`.
- **Key Modules:**
  - `src/lib/booking/public-fns.functions.ts`: Public actions (fetch public assets, submit booking, check reference status).
  - `src/lib/booking/admin-fns.functions.ts`: Admin actions (list bookings with filters, approve/reject/cancel, KPI metrics).
  - `src/lib/assets/assets.functions.ts`: Asset catalog management (CRUD, availability rules, closure dates, archiving).
  - `src/lib/auth/auth.functions.ts`: Authentication management (password change, user account status).
  - `src/lib/audit/admin-fns.functions.ts`: Audit trail retrieval with actor and date filters.

### 3. Middleware & Security Layer (`src/lib/auth.middleware.ts`)
- **Session Enforcement:** Validates Better Auth session cookies on every protected RPC call.
- **Account Inactivity Guard:** Rejects suspended or inactive accounts immediately.
- **RBAC Hierarchy:**
  - `admin` (Rank 3): Full administrative privileges, user management, and configuration.
  - `pimpinan` (Rank 2): Executive oversight, approval review, and audit trail inspection.
  - `operator` (Rank 1): Day-to-day facility monitoring and booking operations.

### 4. Domain & Business Logic Services (`src/lib/`)
- **Booking Engine (`src/lib/booking/service.server.ts`):**
  - **Availability Validation:** Prevents double-booking for rooms by verifying time slot overlap (`src/lib/booking/availability.ts`).
  - **Dormitory Capacity Management:** Tracks bed/room occupancy limits (`src/lib/booking/dormitory.ts`).
  - **Closure Dates Enforcement:** Blocks bookings on blacklisted dates (`asset_closures`).
  - **State Machine Transitions:** Governs transitions across `pending` -> `approved` / `rejected` / `cancelled`.
- **Notification Subsystem (`src/lib/whatsapp/service.server.ts`):**
  - Sends transactional WhatsApp notifications on submission, approval, rejection, and cancellation.
  - Fail-safe non-blocking execution with audit trail recording.
- **Timezone Management (`src/lib/timezone/datetime.ts`):**
  - Enforces `Asia/Jakarta` (WIB) across date parsing, UI formatting, and database storage.

### 5. Data Access Layer (`src/db/`)
- **ORM:** Drizzle ORM configured with relational queries (`db.query.*`) and typed SQL builders.
- **Connection Management:** Connection pool singleton via `pg.Pool`.

---

## 3. Data Flow & Request Lifecycle

```
[User Browser]
      │
      │ (1) User Submits Booking Form / Admin Approves
      ▼
[TanStack Router Route Component]
      │
      │ (2) Invokes Server Function (e.g. submitBookingFn / approveBookingFn)
      ▼
[Server Function Middleware]
      │ - Validates Request Payload via Zod
      │ - Checks Auth & RBAC Permissions
      ▼
[Domain Service (e.g. BookingService)]
      │ - Validates asset active status & operating hours
      │ - Checks overlapping bookings & closures
      │ - Inserts / Updates booking record
      │ - Dispatches Audit Log Entry (AuditService)
      │ - Dispatches WhatsApp Notification asynchronously (WhatsAppService)
      ▼
[Drizzle ORM -> PostgreSQL]
      │ - Executes transactional SQL query
      ▼
[Client Response]
      │ - Returns typed result to TanStack Router
      ▼
[React UI Update]
        - Renders confirmation or updates UI state
```

---

*Codebase architecture analysis: 2026-08-14*
