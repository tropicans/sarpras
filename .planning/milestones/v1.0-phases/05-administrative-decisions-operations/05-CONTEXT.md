# Phase 5: Administrative Decisions & Operations - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 equips authorized administrators to review and manage incoming booking requests, make accountable approval and rejection decisions with live conflict detection and mandatory rejection reasons, operate with an administrative dashboard showing summary KPI counts and filterable bookings, navigate an asset-centric calendar displaying bookings and closures, and inspect system-wide audit history.

</domain>

<decisions>
## Implementation Decisions

### Approval Queue & Conflict Review (FLOW-02, FLOW-03)
- **D-01:** Table list with Detail Review Drawer/Modal: Display pending booking requests in an interactive administrative table with quick action triggers ("Setujui" / "Tolak") and a slide-out drawer or modal detailing full requester information, requested schedule, and live conflict indicators against existing approved bookings and pending overlaps. — **Reversibility:** reversible — UI layout and modal drawers can be refactored without altering schema or database models.
- **D-02:** Structured Rejection Reasons: Provide a preset dropdown of common rejection justifications (e.g., "Jadwal Bertabrakan", "Pemeliharaan / Penutupan Aset", "Kapasitas Tidak Memadai") combined with a mandatory custom explanatory text area that is recorded directly into `bookings.rejectionReason` and the audit log metadata. — **Reversibility:** reversible — Predefined reason options and text validations can be extended without backend breakage.

### Dashboard KPIs & Filter Layout (OPS-01)
- **D-03:** Operational KPI Metric Cards & Urgent Action Widget: Top of `/admin` features KPI cards (Permohonan Pending Butuh Tindakan, Booking Disetujui Bulan Ini, Total Aset Aktif, Penutupan Aktif) along with a prioritized "Perlu Tindakan Cepat" pending queue widget for swift administrative action. — **Reversibility:** reversible — Dashboard KPI card configurations and summary queries are easily adjustable.
- **D-04:** Instant Reactive Filter Bar: Provide an interactive filter toolbar across the bookings management view with instant filtering by status (`all`, `pending`, `approved`, `rejected`, `cancelled`), asset type (`all`, `room`, `dormitory`), date ranges (Hari ini, Minggu ini, Bulan ini, Custom range), and search by Reference Code, Requester Name, or Organization. — **Reversibility:** reversible — Client-side filter states and server loader search params can be modified easily.

### Asset-Centric Operations Calendar (OPS-02)
- **D-05:** Asset-Centric Calendar with Status Styling: Provide an interactive calendar view (`/admin/calendar`) with asset selector dropdown/tabs (Room vs. Dormitory), supporting Month and Week views. Visual styles distinctly show Approved bookings (solid teal/blue), Pending requests (amber/striped warning), and Asset Closures (red banner). — **Reversibility:** reversible — Calendar view components and styling layers can be iterated without affecting underlying booking schedules.
- **D-06:** Click-to-Preview Popover / Modal: Clicking any calendar entry or time slot displays a contextual preview card showing requester details, attendance count, exact hours/dates, conflict status, and action shortcuts to view in the approval queue or cancel. — **Reversibility:** reversible — Interactive popovers and modal triggers are standard UI components.

### Audit Trail & History Inspector (OPS-04)
- **D-07:** Dedicated Audit Inspector Route (`/admin/audit`): Implement a comprehensive audit trail table with filtering by action type (`booking.create`, `booking.approve`, `booking.reject`, `booking.cancel`, `asset.create`, `user.update`, etc.), entity type (`booking`, `asset`, `user`), date range, and search by actor or entity ID. — **Reversibility:** reversible — Audit table query filters and pagination connect directly to the existing `auditLogs` table.
- **D-08:** Formatted Visual Metadata Diff: Render state transitions and metadata changes as structured visual diffs (e.g. Status: `pending` → `approved`, Actor: `admin@example.com`, Timestamp, Reason) with an expandable structured JSON view for granular technical inspection. — **Reversibility:** reversible — Presentation formatting can be adjusted without database schema changes.

### Developer's Discretion
- The developer agent has discretion over UI color tokens, badge styling, sidebar navigation order, and modal animation transitions within the existing administrative theme (`src/styles.css` / Tailwind utilities).
- The developer agent has discretion over client-side state caching (TanStack Query / TanStack Router search params).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications & Roadmap
- [.planning/PROJECT.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/PROJECT.md) — Core value, active requirements, and key decisions.
- [.planning/REQUIREMENTS.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/REQUIREMENTS.md) — Phase 5 requirements (FLOW-02, FLOW-03, OPS-01, OPS-02, OPS-04).
- [.planning/ROADMAP.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/ROADMAP.md) — Phase 5 goals, dependencies, and success criteria.

### Prior Phase Decisions & Verification
- [.planning/phases/03-booking-integrity-audit-core/03-CONTEXT.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/phases/03-booking-integrity-audit-core/03-CONTEXT.md) — Authoritative `BookingService` locking, approval state machine, dormitory capacity model, and audit events.
- [.planning/phases/03-booking-integrity-audit-core/03-VERIFICATION.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/phases/03-booking-integrity-audit-core/03-VERIFICATION.md) — Verification of booking lifecycle transitions and concurrency locks.
- [.planning/phases/04-public-discovery-booking-requests/04-CONTEXT.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/phases/04-public-discovery-booking-requests/04-CONTEXT.md) — Public discovery, reference codes, and status timeline patterns.

### Database & Server Functions
- [src/db/schema.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/db/schema.ts) — Drizzle schemas for `assets`, `bookings`, `auditLogs`, `assetAvailability`, and `assetClosures`.
- [src/lib/booking/service.server.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/lib/booking/service.server.ts) — Backend `BookingService` for `approveBooking`, `rejectBooking`, `cancelBooking`, and conflict checks.
- [src/lib/audit/audit.server.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/lib/audit/audit.server.ts) — Audit logging utilities and querying functions.
- [src/lib/auth.middleware.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/lib/auth.middleware.ts) — Admin session authentication and RBAC checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [src/routes/admin.tsx](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/routes/admin.tsx) — Admin layout with sidebar navigation, session validation, and role badge.
- [src/routes/admin/index.tsx](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/routes/admin/index.tsx) — Admin dashboard starter route.
- [src/components/ui/button.tsx](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/components/ui/button.tsx) — UI button component with standard styling.
- [src/lib/timezone/datetime.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/lib/timezone/datetime.ts) — Timezone formatting and `Asia/Jakarta` normalization helpers.

### Established Patterns
- Server functions use TanStack Start `createServerFn` with `.middleware([authMiddleware])` enforcing authentication and role verification.
- Drizzle ORM transactions handle concurrency and state mutations atomicity.
- Lucid-react icons for UI consistency across admin navigation and action badges.

### Integration Points
- `src/routes/admin.tsx` — Update sidebar navigation to include Bookings (`/admin/bookings`), Calendar (`/admin/calendar`), and Audit Logs (`/admin/audit`).
- `src/routes/admin/index.tsx` — Enhance dashboard with live KPI counters, urgent pending widget, and quick bookings overview.
- `src/routes/admin/bookings.tsx` — Pending approval queue, filterable bookings table, conflict review drawer, and approval/rejection modals.
- `src/routes/admin/calendar.tsx` — Asset-centric operations calendar with room timeblocks and dormitory stays.
- `src/routes/admin/audit.tsx` — System audit log explorer with action/entity filtering and metadata diff view.

</code_context>

<specifics>
## Specific Ideas
- In the rejection dialog, clicking a preset reason (e.g. "Jadwal Bertabrakan") pre-fills the explanation textarea with standard polite text that the admin can customize before confirming.
- The approval drawer shows conflict alert badges in red/amber if an overlapping approved booking exists or if pending requests compete for the same slot.

</specifics>

<deferred>
## Deferred Ideas
- Automatic email/SMS notification triggers when a booking is approved/rejected (deferred to v2 - NOTF-01, INTG-02).
- Advanced rule-based automated booking auto-approval policy engine (deferred to v2 - POLY-01).

</deferred>

---

*Phase: 05-Administrative Decisions & Operations*
*Context gathered: 2026-08-14*
