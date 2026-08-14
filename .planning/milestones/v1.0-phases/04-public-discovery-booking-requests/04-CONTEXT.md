# Phase 4: Public Discovery & Booking Requests - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers the public-facing portal for visitors to discover room and dormitory availability in a privacy-safe manner, submit structured booking requests, and track request status with a non-guessable reference code. It bridges the authoritative booking services and audit infrastructure from Phase 3 to public users without exposing internal PII or administrative data.

</domain>

<decisions>
## Implementation Decisions

### Discovery & Availability Presentation (ASSET-04)
- **D-01:** Asset Catalog & Privacy-Safe Availability: Display rooms and dormitories as interactive cards with type filters (All, Ruang Rapat, Asrama/Wisma) and capacity info. Include live availability badges ("Tersedia", "Terisi Sebagian", "Penuh / Tutup"). — **Reversibility:** reversible — Component presentation and filter logic can be adjusted in the UI without data migrations.
- **D-02:** Modal/Drawer Calendar & Time Slot View: Provide a "Lihat Jadwal" schedule modal on each asset card showing daily time blocks / monthly calendar marked as "Terpakai" or "Tutup", strictly omitting requester names, organizations, and purpose details to maintain privacy. — **Reversibility:** costly — Privacy-safe projections must be consistently enforced across server loaders and client views to prevent PII leaks.

### Booking Request Experience (BOOK-01, BOOK-02, BOOK-03)
- **D-03:** Dedicated Route (`/book/$assetId`) with 3-Step Wizard: Implement a guided 3-step submission flow:
  - **Step 1: Schedule & Attendees:** Date picker, start/end time (rooms), check-in/check-out dates (dormitories), and guest/attendee count with instant live availability validation (operating hours, closures, room overlap, dorm capacity).
  - **Step 2: Requester Information:** Requester Name, Email, Phone Number, Organization/Unit, and Purpose of Booking.
  - **Step 3: Review & Submit:** Summary review of all inputs, terms confirmation, and submission triggering `submitBookingRequestFn`. — **Reversibility:** reversible — Wizard step partitioning and client-side validations can be refactored easily.
- **D-04:** Real-time Availability Pre-flight: Perform instant pre-flight checks on Step 1 so visitors receive immediate visual feedback if their desired slot violates operating hours, closures, or capacity before completing requester details. — **Reversibility:** reversible — Connects to existing `BookingService` validation methods.

### Reference Tracking & Public Cancellation (BOOK-04, BOOK-05, D-07)
- **D-05:** Reference Code Format & Confirmation: Generate human-friendly reference codes (e.g. `SP-2026-XXXXX` or booking UUID) returned upon submission. Display a dedicated submission success screen with copy-to-clipboard and a direct link to `/status/:ref`. — **Reversibility:** costly — Modifying reference identifiers or lookup schemes impacts tracking URLs and user bookmarks.
- **D-06:** Public Status Tracking Page: Provide `/status` (and `/status/:ref`) route showing a visual status timeline (`Menunggu Konfirmasi` -> `Disetujui` / `Ditolak` [with recorded rejection reason] / `Dibatalkan`), asset summary, and scheduled times without exposing admin details. — **Reversibility:** reversible — UI layout for tracking and status progression can be iterated.
- **D-07:** Public Self-Service Cancellation: Allow requesters to cancel their own `pending` or `approved` booking directly from the tracking page using their reference ID, confirming with a confirmation dialog and short reason prompt, calling `cancelBookingByPublicReferenceFn`. — **Reversibility:** costly — Relies on Phase 3 cancellation endpoints and security token verification.

### Public Portal & Navigation Layout (D-08)
- **D-08:** Integrated Public Portal (`/`): Home page features:
  - Hero banner with quick availability search (Date & Asset Type).
  - Live Asset Catalog grid with availability status.
  - "Cara Pengajuan" 3-step guide for visitors.
  - Header navigation with quick access to "Cek Status" (`/status`) and "Masuk Petugas" (`/login`). — **Reversibility:** reversible — Navigation layout and landing components are standard UI modules.

### Developer's Discretion
- The developer agent has discretion over component styling using Vanilla CSS / Tailwind utility classes consistent with the existing theme (`src/styles.css`).
- The developer agent has discretion over exact iconography, animation transitions for the wizard steps, and responsive mobile layouts.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications & Roadmap
- [.planning/PROJECT.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/PROJECT.md) — Core value, active requirements, and key decisions.
- [.planning/REQUIREMENTS.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/REQUIREMENTS.md) — Phase 4 requirements (ASSET-04, BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05).
- [.planning/ROADMAP.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/ROADMAP.md) — Phase 4 goals, dependencies, and success criteria.

### Prior Phase Decisions & Verification
- [.planning/phases/03-booking-integrity-audit-core/03-CONTEXT.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/phases/03-booking-integrity-audit-core/03-CONTEXT.md) — Booking state machine, row locks, dormitory capacity model, and cancellation rules.
- [.planning/phases/03-booking-integrity-audit-core/03-VERIFICATION.md](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/.planning/phases/03-booking-integrity-audit-core/03-VERIFICATION.md) — Validated server functions and services.

### Database & Server Functions
- [src/db/schema.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/db/schema.ts) — Assets, bookings, availability, closures, and audit schemas.
- [src/lib/booking/service.server.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/lib/booking/service.server.ts) — Authoritative `BookingService` creating requests, validating availability, and handling cancellations.
- [src/lib/booking/server-fns.server.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/lib/booking/server-fns.server.ts) — Server functions (`submitBookingRequestFn`, `cancelBookingByPublicReferenceFn`).
- [src/lib/booking/availability.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/lib/booking/availability.ts) — Room capacity, operating hours, and closure validation.
- [src/lib/booking/dormitory.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/lib/booking/dormitory.ts) — Dormitory shared capacity calculations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- [src/components/ui/button.tsx](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/components/ui/button.tsx) — Standard UI button component with variants.
- [src/lib/timezone/datetime.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/lib/timezone/datetime.ts) — Timezone normalization and `Asia/Jakarta` helpers.
- [src/lib/booking/types.ts](file:///c:/Users/yudhiar/Downloads/oprek/Dev/sarpras/src/lib/booking/types.ts) — Zod validation schemas (`CreateBookingInputSchema`, `CancelPublicBookingInputSchema`).

### Established Patterns
- Full-stack type safety with TanStack Router file-based routing and TanStack Start `createServerFn`.
- Privacy-safe server queries omitting requester names/phones from public endpoints.

### Integration Points
- `src/routes/index.tsx` — Public portal home page with Hero and asset catalog.
- `src/routes/book/$assetId.tsx` — Dedicated multi-step booking request wizard.
- `src/routes/status.tsx` / `src/routes/status/$ref.tsx` — Request status lookup and public cancellation view.

</code_context>

<specifics>
## Specific Ideas
- Provide rich visual feedback during booking (e.g. green checkmarks on available slots, red warnings with clear Indonesian explanation on capacity or closure conflicts).
- Status lookup page should accept either the Reference Code or Booking ID.

</specifics>

<deferred>
## Deferred Ideas
- Email/SMS notification dispatch upon submission or status change (deferred to v2 - NOTF-01, INTG-02).
- Admin booking approval queue and administrative calendar operations (deferred to Phase 5).

</deferred>

---

*Phase: 04-Public Discovery & Booking Requests*
*Context gathered: 2026-08-14*
