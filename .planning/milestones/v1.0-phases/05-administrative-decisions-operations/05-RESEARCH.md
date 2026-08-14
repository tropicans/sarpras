# Phase 5: Administrative Decisions & Operations - Research

**Researched:** 2026-08-14
**Domain:** Administrative Booking Decisions, Approval/Rejection Workflow, Conflict Review Drawer, Dashboard KPI Analytics, Operations Calendar, Audit Trail Inspector
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Table list with Detail Review Drawer/Modal (FLOW-02, FLOW-03):** Display pending booking requests in an interactive administrative table with quick action triggers ("Setujui" / "Tolak") and a slide-out drawer or modal detailing full requester information, requested schedule, and live conflict indicators against existing approved bookings and pending overlaps. [VERIFIED: 05-CONTEXT.md:17]
- **D-02: Structured Rejection Reasons (FLOW-03):** Provide a preset dropdown of common rejection justifications (e.g., "Jadwal Bertabrakan", "Pemeliharaan / Penutupan Aset", "Kapasitas Tidak Memadai") combined with a mandatory custom explanatory text area that is recorded directly into `bookings.rejectionReason` and the audit log metadata. [VERIFIED: 05-CONTEXT.md:18]
- **D-03: Operational KPI Metric Cards & Urgent Action Widget (OPS-01):** Top of `/admin` features KPI cards (Permohonan Pending Butuh Tindakan, Booking Disetujui Bulan Ini, Total Aset Aktif, Penutupan Aktif) along with a prioritized "Perlu Tindakan Cepat" pending queue widget for swift administrative action. [VERIFIED: 05-CONTEXT.md:21]
- **D-04: Instant Reactive Filter Bar (OPS-01):** Provide an interactive filter toolbar across the bookings management view with instant filtering by status (`all`, `pending`, `approved`, `rejected`, `cancelled`), asset type (`all`, `room`, `dormitory`), date ranges (Hari ini, Minggu ini, Bulan ini, Custom range), and search by Reference Code, Requester Name, or Organization. [VERIFIED: 05-CONTEXT.md:22]
- **D-05: Asset-Centric Operations Calendar (OPS-02):** Provide an interactive calendar view (`/admin/calendar`) with asset selector dropdown/tabs (Room vs. Dormitory), supporting Month and Week views. Visual styles distinctly show Approved bookings (solid teal/blue), Pending requests (amber/striped warning), and Asset Closures (red banner). [VERIFIED: 05-CONTEXT.md:25]
- **D-06: Click-to-Preview Popover / Modal (OPS-02):** Clicking any calendar entry or time slot displays a contextual preview card showing requester details, attendance count, exact hours/dates, conflict status, and action shortcuts to view in the approval queue or cancel. [VERIFIED: 05-CONTEXT.md:26]
- **D-07: Dedicated Audit Inspector Route (`/admin/audit`) (OPS-04):** Implement a comprehensive audit trail table with filtering by action type (`booking.create`, `booking.approve`, `booking.reject`, `booking.cancel`, `asset.create`, `user.update`, etc.), entity type (`booking`, `asset`, `user`), date range, and search by actor or entity ID. [VERIFIED: 05-CONTEXT.md:29]
- **D-08: Formatted Visual Metadata Diff (OPS-04):** Render state transitions and metadata changes as structured visual diffs (e.g. Status: `pending` → `approved`, Actor: `admin@example.com`, Timestamp, Reason) with an expandable structured JSON view for granular technical inspection. [VERIFIED: 05-CONTEXT.md:30]

### Developer's Discretion
- UI color tokens, badge styling, sidebar navigation order, and modal animation transitions within the existing administrative theme (`src/styles.css` / Tailwind utilities).
- Client-side state caching (TanStack Query / TanStack Router search params).

### Deferred Ideas (OUT OF SCOPE)
- Automatic email/SMS notification triggers when a booking is approved/rejected (deferred to v2 - NOTF-01, INTG-02).
- Advanced rule-based automated booking auto-approval policy engine (deferred to v2 - POLY-01).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **FLOW-02** | Authorized administrator can review pending requests with the relevant asset, schedule, requester, and conflict context. | Pending approval table (`/admin/bookings`), review drawer displaying requester PII, schedule, attendance, and live overlap conflict detector. |
| **FLOW-03** | Authorized administrator can approve or reject a pending request, recording an explanation for rejections. | Action triggers calling `approveBookingFn` and `rejectBookingFn` with preset + custom justification modal, recording `rejectionReason` and audit event. |
| **OPS-01** | Authorized administrator can use a dashboard to view summary counts and filter bookings by status, asset type, and date range. | `/admin` KPI cards & urgent action widget; `/admin/bookings` interactive filter toolbar (status, asset type, date range, search query). |
| **OPS-02** | Authorized administrator can view an asset-centric administrative calendar showing booking and closure context. | `/admin/calendar` month/week schedule grid per asset, color-coded approved/pending/closed slots, and detail popover. |
| **OPS-04** | Authorized administrator can view audit history with actor, timestamp, action, and affected record context. | `/admin/audit` explorer with multi-criteria filters (action, entityType, actorId), formatted state transition diffs, and raw JSON toggle. |
</phase_requirements>

## Summary

Phase 5 completes the core operational loop of Sarpras PPKASN by delivering the authenticated administrator workspace. It builds upon the transactional booking core (Phase 3) and data models (Phase 1-2) to give operators complete situational awareness and decision-making power:

1. **Dashboard & KPIs (`/admin`):** Comprehensive metrics (Pending Actions, Monthly Approved, Active Assets, Active Closures) with an urgent pending queue widget.
2. **Approval Queue & Conflict Review (`/admin/bookings`):** Interactive request management table with a detailed slide-out review drawer, live conflict detection against approved and competing bookings, and modal-based rejection reasons.
3. **Asset-Centric Operations Calendar (`/admin/calendar`):** Monthly and weekly time grid showing room slots and dormitory occupancy, distinctly styling Approved, Pending, and Closure states with interactive preview cards.
4. **Audit Trail Inspector (`/admin/audit`):** Complete system log viewer with filtering by action, actor, and entity, providing human-readable state transition diffs alongside JSON metadata.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| **Admin Navigation & Route Guards** | Frontend Server / Client | Auth Middleware (`authMiddleware`) | Guarantees all `/admin/*` routes require active admin session and valid role. |
| **Dashboard KPIs & Urgent Queue** | API / Server Function (`getAdminDashboardOverviewFn`) | Database Aggregations | Single optimized server query aggregating booking counts, asset stats, and top pending requests. |
| **Bookings Management & Filtering** | API / Server Function (`getAdminBookingsFn`) | Client Search Params | Dynamic multi-column SQL query with pagination, sorting, status, type, and date range filtering. |
| **Live Conflict Analysis for Drawer** | API / Server Function (`getBookingConflictContextFn`) | Database Transaction / Read | Evaluates potential overlaps with both approved bookings and competing pending requests for the same asset & slot. |
| **Decision Execution (Approve / Reject)** | Backend Domain Service (`BookingService`) | PostgreSQL Transaction | Atomically validates state transitions, locks rows with `SELECT FOR UPDATE`, enforces rejection reasons, and logs audit events. |
| **Operations Calendar Query** | API / Server Function (`getAdminCalendarEventsFn`) | Database / Storage | Queries bookings (approved & pending) + asset closures within a target month/week window for selected asset(s). |
| **Audit Log Query & Metadata Formatter** | API / Server Function (`getAdminAuditLogsFn`) | Database / Client UI | Queries `auditLogs` with filtering, pagination, and structured diff formatting. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-router` | latest | File-based routing & search params | Type-safe nested admin routes, search query state synchronization. [VERIFIED: package.json] |
| `@tanstack/react-start` | latest | Full-stack server functions (`createServerFn`) | Secure RPC with `authMiddleware` session protection. [VERIFIED: package.json] |
| `zod` | ^4.4.3 | Schema validation | Runtime validation for filter params, approval/rejection inputs, and query limits. [VERIFIED: package.json] |
| `drizzle-orm` | ^0.45.2 | PostgreSQL ORM | Type-safe queries, counts, joins, and transactions. [VERIFIED: package.json] |
| `date-fns` & `date-fns-tz` | ^4.4.0 / ^3.2.0 | Date calculations & calendar grid math | `Asia/Jakarta` normalization and robust month/week bounds. [VERIFIED: package.json] |
| `lucide-react` | ^1.31.0 | UI icons | High-quality icons for admin navigation, status badges, and action buttons. [VERIFIED: package.json] |

## Architecture Patterns

### System Architecture Diagram

```
+----------------------------------------------------------------------------------------------------+
|                                    Authenticated Admin Browser                                      |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  | Admin Layout (/admin) - Sidebar: Dashboard | Bookings | Calendar | Assets | Users | Audit Logs |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +--------------------+   +-----------------------+   +--------------------+   +----------------+  |
|  | Dashboard (/admin) |   | Bookings (/admin/...) |   | Calendar (/admin/..|   | Audit (/admin/)|  |
|  | - 4 KPI Cards      |   | - Filter Bar (Status) |   | - Asset Selector   |   | - Action Filter|  |
|  | - Urgent Widget    |   | - Requests Table      |   | - Month/Week View  |   | - Entity Filter|  |
|  | - Quick Actions    |   | - Conflict Drawer     |   | - Color Statuses   |   | - Diff Viewer  |  |
|  |                    |   | - Rejection Modal     |   | - Slot Popover     |   | - JSON Toggle  |  |
|  +---------+----------+   +-----------+-----------+   +---------+----------+   +--------+-------+  |
+------------|--------------------------|-------------------------|-----------------------|----------+
             |                          |                         |                       |
             v                          v                         v                       v
+----------------------------------------------------------------------------------------------------+
|                         TanStack Start Server Layer (with authMiddleware)                          |
|                                                                                                    |
|  - getAdminDashboardOverviewFn()  - getAdminBookingsFn()           - getAdminCalendarEventsFn()    |
|  - approveBookingAdminFn()        - rejectBookingAdminFn()         - getAdminAuditLogsFn()         |
|  - getBookingConflictContextFn()  - cancelBookingAdminFn()                                         |
+----------------------------------------------------------------------------------------------------+
                                        | (Transactions & Audit Logs)
                                        v
+----------------------------------------------------------------------------------------------------+
|                                     PostgreSQL Database                                            |
|   [users] <---> [assets] <---> [asset_availability] <---> [asset_closures] <---> [bookings]        |
|                                                                          <---> [audit_logs]       |
+----------------------------------------------------------------------------------------------------+
```

### Recommended Project Structure

```
src/
├── routes/
│   ├── admin.tsx                         # Admin layout (updated with Bookings, Calendar, Audit nav)
│   ├── admin/
│   │   ├── index.tsx                     # Dashboard with KPIs & Urgent Action widget
│   │   ├── bookings.tsx                  # Approval queue, filterable table, review drawer, reject modal
│   │   ├── calendar.tsx                  # Asset-centric operations calendar (Month/Week views)
│   │   ├── audit.tsx                     # Audit history explorer with search, filters, & diff viewer
│   │   ├── assets.tsx                    # Existing asset management
│   │   └── users.tsx                     # Existing user management
│   └── ...
├── components/
│   └── admin/
│       ├── kpi-card.tsx                  # Reusable dashboard metric card
│       ├── urgent-bookings-widget.tsx    # Prioritized pending request list widget
│       ├── bookings-filter-bar.tsx       # Status, asset type, date range & search filter toolbar
│       ├── booking-review-drawer.tsx     # Slide-out drawer with requester PII & live conflict details
│       ├── rejection-reason-modal.tsx    # Preset dropdown + custom explanation modal
│       ├── admin-calendar-view.tsx       # Month/Week grid with asset selector & event badges
│       ├── calendar-event-popover.tsx    # Quick event details & jump-to-action popover
│       ├── audit-table.tsx               # Filterable audit event list
│       └── audit-diff-viewer.tsx         # Structured visual diff & expandable JSON inspector
└── lib/
    ├── booking/
    │   ├── admin-fns.server.ts           # Admin server functions for dashboard, bookings, & calendar
    │   ├── service.server.ts             # BookingService methods (approve, reject, cancel)
    │   └── types.ts                      # Common types & filter schemas
    └── audit/
        ├── admin-fns.server.ts           # Admin server functions for audit logs querying
        └── audit.server.ts               # Core audit logging & entity query utilities
```

### Pattern 1: Live Overlap Conflict Detection for Drawer
**What:** When reviewing a pending booking, the server identifies all overlapping approved bookings (hard conflict) as well as competing pending requests (soft conflict) for the same asset.
**Implementation:**
```typescript
export async function getBookingConflictContext(bookingId: string) {
  const [target] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!target) throw new Error("Booking not found");

  const approvedConflicts = await db
    .select({
      id: bookings.id,
      requesterName: bookings.requesterName,
      requesterOrganization: bookings.requesterOrganization,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      attendance: bookings.attendance,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.assetId, target.assetId),
        eq(bookings.status, "approved"),
        ne(bookings.id, target.id),
        lt(bookings.startDate, target.endDate),
        gt(bookings.endDate, target.startDate),
      ),
    );

  const pendingOverlaps = await db
    .select({
      id: bookings.id,
      requesterName: bookings.requesterName,
      requesterOrganization: bookings.requesterOrganization,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      attendance: bookings.attendance,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.assetId, target.assetId),
        eq(bookings.status, "pending"),
        ne(bookings.id, target.id),
        lt(bookings.startDate, target.endDate),
        gt(bookings.endDate, target.startDate),
      ),
    );

  return {
    target,
    hasHardConflict: approvedConflicts.length > 0,
    approvedConflicts,
    pendingOverlaps,
  };
}
```

### Pattern 2: Structured Rejection Justification
**What:** Rejections require non-empty reason text. Admin selects a preset (or types custom) which pre-fills the textarea, saving to `bookings.rejectionReason` and audit event metadata.
**Implementation:**
```typescript
export const REJECTION_PRESETS = [
  { id: "conflict", label: "Jadwal Bertabrakan dengan Kegiatan Lain", text: "Mohon maaf, ruangan/fasilitas telah terisi untuk kegiatan kedinasan lain pada waktu yang diajukan." },
  { id: "closure", label: "Pemeliharaan / Penutupan Aset", text: "Mohon maaf, fasilitas sedang dalam masa pemeliharaan/perbaikan dan ditutup sementara pada tanggal tersebut." },
  { id: "capacity", label: "Kapasitas Tidak Memadai", text: "Jumlah peserta yang diajukan melebihi kapasitas maksimal fasilitas yang tersedia." },
  { id: "policy", label: "Tidak Memenuhi Ketentuan Peminjaman", text: "Permohonan tidak memenuhi ketentuan teknis atau operasional peminjaman sarana dan prasarana PPKASN." },
] as const;
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Concurrency & Race Conditions | In-memory locking or client checks | `BookingService.approveBooking` with `SELECT FOR UPDATE` | Guaranteed database-level row lock prevents double-booking race condition. |
| Timezone Normalization | Manual JS `Date` hours offset | `normalizeDate` / `date-fns-tz` | Guarantees strict `Asia/Jakarta` (WIB) wall-clock alignment across dashboard, calendar, and audit trails. |
| State Transition Validation | Freeform status updates | `validateBookingTransition` (`src/lib/booking/state-machine.ts`) | Strict state machine preventing invalid transitions (e.g. `rejected` -> `approved`). |
| Audit Trail Logging | Ad-hoc table writes | `recordAuditEvent` (`src/lib/audit/audit.server.ts`) | Standardized append-only schema capturing actor, entity, action, and JSON metadata. |

## Common Pitfalls

### Pitfall 1: Approval Race Condition on Competing Requests
**What goes wrong:** Two admins simultaneously approve two overlapping pending requests for the same room.
**Prevention:** `BookingService.approveBooking` locks the asset row and re-validates approved overlaps inside a single database transaction. The second approval will fail cleanly with `BookingConflictError`.

### Pitfall 2: Overlooking Asset Closures on Calendar
**What goes wrong:** Administrative calendar only shows bookings, so admins miss scheduled maintenance closures when reviewing weekly operations.
**Prevention:** `getAdminCalendarEventsFn` unions both approved/pending bookings and active `assetClosures` within the date range, rendering closures as distinct red banner events.

### Pitfall 3: Incomplete Audit Context on Decisions
**What goes wrong:** Rejections or cancellations are recorded in the audit log without the explanatory reason or actor ID.
**Prevention:** `BookingService.rejectBooking` and `cancelBooking` enforce non-empty reason strings and store them in both the `bookings` table and the `auditLogs.metadata` payload.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js Test Runner with `tsx` |
| Config file | `package.json` test script |
| Quick run command | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` |
| Full suite command | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/db/migration.test.ts src/db/auth.test.ts src/lib/booking/booking.test.ts src/lib/booking/admin.test.ts` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| **FLOW-02** | Admin review query returns full requester PII, schedule, and live conflict context | Unit/Integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` | Wave 0 |
| **FLOW-03** | Admin approval locks asset and updates status; rejection enforces and records reason | Unit/Integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` | Wave 0 |
| **OPS-01** | Dashboard KPI aggregation & multi-criteria booking filter query (status, asset, dates, search) | Unit/Integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` | Wave 0 |
| **OPS-02** | Operations calendar query returns bookings + closures with asset selector bounds | Unit/Integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` | Wave 0 |
| **OPS-04** | Audit history query with actor, action, and entity filters + structured diff metadata | Unit/Integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/admin.test.ts` | Wave 0 |

### Wave 0 Gaps
- [ ] Create `src/lib/booking/admin.test.ts` to test admin queries, KPI calculations, conflict context analyzer, decision executions, calendar event aggregator, and audit trail inspector.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Yes | All admin server functions (`getAdminBookingsFn`, `approveBookingAdminFn`, etc.) are protected by `authMiddleware` and verify active session + admin role. |
| V5 Input Validation | Yes | Zod schema validation for all filter params, booking IDs, rejection reasons, and date range inputs. |
| V8 Data Protection & Privacy | Yes | Requester PII is restricted to authenticated admin routes and never leaked to public endpoints. |
| V10 Malicious Code Search & Audit | Yes | Append-only audit logs record every approval, rejection, cancellation, and asset change with actor ID, timestamp, and metadata diff. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Privilege Escalation / Unauthenticated Approval | Elevation of Privilege | Every server function uses `authMiddleware` enforcing session validity and `admin` / `superadmin` role. |
| Tampering with Rejection Reasons | Repudiation / Tampering | Rejection reason is immutable after rejection and permanently recorded in append-only audit trail. |
| Concurrency Double-Approval | Race Condition / DoS | `SELECT FOR UPDATE` on asset row ensures serialized, conflict-free approval decisions. |
