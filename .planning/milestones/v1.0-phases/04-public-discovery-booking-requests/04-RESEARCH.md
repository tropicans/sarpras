# Phase 4: Public Discovery & Booking Requests - Research

**Researched:** 2026-08-14
**Domain:** Public Discovery Portal, Privacy-Safe Availability Projections, Multi-Step Booking Wizards, Non-Guessable Reference Tracking
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01: Asset Catalog & Privacy-Safe Availability:** Display rooms and dormitories as interactive cards with type filters (All, Ruang Rapat, Asrama/Wisma) and capacity info. Include live availability badges ("Tersedia", "Terisi Sebagian", "Penuh / Tutup"). [VERIFIED: CONTEXT.md:17]
- **D-02: Modal/Drawer Calendar & Time Slot View:** Provide a "Lihat Jadwal" schedule modal on each asset card showing daily time blocks / monthly calendar marked as "Terpakai" or "Tutup", strictly omitting requester names, organizations, and purpose details to maintain privacy. [VERIFIED: CONTEXT.md:18]
- **D-03: Dedicated Route (`/book/$assetId`) with 3-Step Wizard:** Implement a guided 3-step submission flow:
  - Step 1: Schedule & Attendees (Date, Time/Dates, Attendees, live availability validation)
  - Step 2: Requester Information (Name, Email, Phone, Organization, Purpose)
  - Step 3: Review & Submit (Summary review, terms, submit via `submitBookingRequestFn`) [VERIFIED: CONTEXT.md:21-24]
- **D-04: Real-time Availability Pre-flight:** Perform instant pre-flight checks on Step 1 so visitors receive immediate visual feedback if their desired slot violates operating hours, closures, or capacity before completing requester details. [VERIFIED: CONTEXT.md:25]
- **D-05: Reference Code Format & Confirmation:** Generate human-friendly reference codes (or booking UUID) returned upon submission. Display a dedicated submission success screen with copy-to-clipboard and a direct link to `/status/:ref`. [VERIFIED: CONTEXT.md:28]
- **D-06: Public Status Tracking Page:** Provide `/status` (and `/status/:ref`) route showing a visual status timeline (`Menunggu Konfirmasi` -> `Disetujui` / `Ditolak` [with recorded rejection reason] / `Dibatalkan`), asset summary, and scheduled times without exposing admin details. [VERIFIED: CONTEXT.md:29]
- **D-07: Public Self-Service Cancellation:** Allow requesters to cancel their own `pending` or `approved` booking directly from the tracking page using their reference ID/token, confirming with a confirmation dialog and short reason prompt, calling `cancelBookingByPublicReferenceFn`. [VERIFIED: CONTEXT.md:30]
- **D-08: Integrated Public Portal (`/`):** Home page features:
  - Hero banner with quick availability search (Date & Asset Type).
  - Live Asset Catalog grid with availability status.
  - "Cara Pengajuan" 3-step guide for visitors.
  - Header navigation with quick access to "Cek Status" (`/status`) and "Masuk Petugas" (`/login`). [VERIFIED: CONTEXT.md:33-37]

### the agent's Discretion
- Styling using existing Tailwind CSS & theme tokens in `src/styles.css`.
- Iconography (Lucide React), animation transitions for wizard steps, and responsive mobile layouts.

### Deferred Ideas (OUT OF SCOPE)
- Email/SMS notification dispatch upon submission or status change (deferred to v2 - NOTF-01, INTG-02).
- Admin booking approval queue and administrative calendar operations (deferred to Phase 5).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **ASSET-04** | Visitor can browse rooms and dormitories and filter availability by type and requested date/time without seeing another requester's personal data. | Public catalog query + privacy-safe projection omitting PII; calendar slot modal with masked events. |
| **BOOK-01** | Visitor can submit a responsive, accessible room booking request with requester, organization, contact, purpose, attendance, asset, date, and time details. | Dedicated `/book/$assetId` route, Step 1-3 form state machine, `submitBookingRequestFn`. |
| **BOOK-02** | Visitor can submit a responsive, accessible dormitory booking request with the required stay dates and requester details. | Check-in/check-out date range picker and guest headcount validation in `/book/$assetId`. |
| **BOOK-03** | System validates required fields, dates, times, capacity, operating availability, and closures before accepting a public request. | Pre-flight server query + authoritative transactional validation inside `BookingService.createBookingRequest`. |
| **BOOK-04** | System returns a non-guessable reference and a clear `pending` confirmation after a valid request is submitted. | Confirmation card rendering booking ID & reference code with copy button and status link. |
| **BOOK-05** | Visitor can view the privacy-safe status of a request using its reference without gaining access to administrative data. | `/status` search lookup + `/status/$ref` timeline route projecting only public booking status, asset info, schedule, and rejection reason. |
</phase_requirements>

## Summary

Phase 4 delivers the complete public interface for Sarpras PPKASN. It connects public visitors to the robust transactional core established in Phase 3 while strictly protecting privacy (zero requester PII exposed on public calendars or catalog queries).

The public interface consists of three primary touchpoints:
1. **Public Portal (`/`):** Hero search, live asset catalog, filter by asset type/date, and "Lihat Jadwal" privacy-safe availability modal.
2. **Booking Wizard (`/book/$assetId`):** Accessible 3-step submission flow with instant availability pre-flight checks, input validation with Zod, and clear success confirmation with copyable tracking code.
3. **Status Tracking & Self-Service Cancellation (`/status` & `/status/$ref`):** Public status lookup showing request timeline (`Menunggu Konfirmasi`, `Disetujui`, `Ditolak`, `Dibatalkan`) and modal-based cancellation flow.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| **Public Asset Catalog & Filtering** | Frontend Server (SSR loader) | Browser / Client | Server fetches active assets; client provides instant interactive type & date filtering. |
| **Privacy-Safe Schedule Projection** | API / Server Function | Database / Storage | Server transforms raw bookings into anonymous `[start, end, status: "booked"]` blocks, stripping names, emails, phones, and purposes. |
| **Multi-Step Form Wizard** | Browser / Client | — | Client manages step transition (1: Schedule -> 2: Requester -> 3: Review) and input drafting in local state. |
| **Real-time Pre-flight Availability** | API / Server Function | Browser / Client | Client triggers debounced validation server function on Step 1 to give instant visual feedback before step progression. |
| **Authoritative Request Submission** | API / Server Function (`submitBookingRequestFn`) | Database / Transaction | Transactional row-locking (`SELECT FOR UPDATE`), closure validation, and audit recording. |
| **Status Lookup & Public Projection** | API / Server Function | Frontend Server | Server verifies reference code/ID and returns only sanitized public fields (dates, status, asset name, rejection reason). |
| **Public Cancellation Mutation** | API / Server Function (`cancelBookingByPublicReferenceFn`) | Database / Transaction | Validates reference token match, updates state to `cancelled`, and writes audit record. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-router` | latest | File-based routing & loaders | Type-safe route params, search params validation, and SSR loaders. [VERIFIED: package.json] |
| `@tanstack/react-start` | latest | Full-stack server functions (`createServerFn`) | Isomorphic RPC mechanism with input validation. [VERIFIED: package.json] |
| `zod` | ^4.4.3 | Schema validation | Runtime validation for booking forms and server functions. [VERIFIED: package.json] |
| `drizzle-orm` | ^0.45.2 | PostgreSQL ORM | Type-safe queries and transactions. [VERIFIED: package.json] |
| `date-fns` & `date-fns-tz` | ^4.4.0 / ^3.2.0 | Date math & `Asia/Jakarta` normalization | Guarantees exact WIB wall-clock handling. [VERIFIED: package.json] |
| `lucide-react` | ^1.31.0 | UI icons | Accessible, consistent icons for badges, steps, and cards. [VERIFIED: package.json] |

## Architecture Patterns

### System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                              Public Visitor Browser                                |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  |  Home Portal (/)   |   | Booking Wizard (/book)|   | Status Page (/status)  |  |
|  | - Hero Search      |   | - Step 1: Schedule    |   | - Ref / ID Lookup      |  |
|  | - Asset Grid       |   | - Step 2: Requester   |   | - Progress Timeline    |  |
|  | - "Lihat Jadwal"   |   | - Step 3: Submit      |   | - Cancel Request       |  |
|  +---------+----------+   +-----------+-----------+   +-----------+------------+  |
+------------|--------------------------|---------------------------|---------------+
             | (SSR / RPC)              | (Pre-flight & Submit)     | (Lookup & Cancel)
             v                          v                           v
+-----------------------------------------------------------------------------------+
|                        TanStack Start Server Layer                                 |
|                                                                                   |
|  +--------------------------------+   +----------------------------------------+  |
|  | getPublicAssetsWithStatusFn    |   | checkAvailabilityPreflightFn           |  |
|  | (Active assets + basic stats)  |   | (Checks closures, hours, overlaps)     |  |
|  +--------------------------------+   +----------------------------------------+  |
|  | getAssetPublicScheduleFn       |   | submitBookingRequestFn                 |  |
|  | (Sanitized time blocks only)   |   | (Phase 3 transactional core)           |  |
|  +--------------------------------+   +----------------------------------------+  |
|  | getPublicBookingStatusFn       |   | cancelBookingByPublicReferenceFn       |  |
|  | (Sanitized booking projection) |   | (Cancels with reference token)         |  |
|  +--------------------------------+   +----------------------------------------+  |
+---------------------------------------+-------------------------------------------+
                                        | (Transactions & Row Locks)
                                        v
+-----------------------------------------------------------------------------------+
|                             PostgreSQL Database                                   |
|   [assets] <---> [asset_availability] <---> [asset_closures] <---> [bookings]     |
|                                                                  [audit_logs]     |
+-----------------------------------------------------------------------------------+
```

### Recommended Project Structure

```
src/
├── routes/
│   ├── index.tsx                 # Public Home portal (Hero, Asset Catalog, How-to-guide)
│   ├── book/
│   │   └── $assetId.tsx          # 3-step booking request wizard
│   ├── status/
│   │   ├── index.tsx             # Status lookup search form
│   │   └── $ref.tsx              # Public request status timeline & cancellation modal
│   └── ...
├── components/
│   ├── public/
│   │   ├── public-header.tsx     # Navigation header with "Cek Status" & "Masuk Petugas"
│   │   ├── public-footer.tsx     # Footer with contact & institutional info
│   │   ├── asset-card.tsx        # Room & Dormitory card with live badge & "Lihat Jadwal"
│   │   └── schedule-modal.tsx    # Privacy-safe schedule viewer (time slots / booked blocks)
│   └── booking/
│       ├── wizard-stepper.tsx    # Visual 1-2-3 progress bar
│       ├── schedule-step.tsx     # Step 1: Date/Time/Guest picker with instant pre-flight
│       ├── requester-step.tsx    # Step 2: Name, email, phone, unit, purpose inputs
│       ├── review-step.tsx       # Step 3: Summary confirmation & submission trigger
│       └── success-card.tsx      # Confirmation screen with copyable reference code
└── lib/
    └── booking/
        ├── public-fns.server.ts  # Server functions for public catalog, schedule, & status
        ├── server-fns.server.ts  # Existing submit & cancel server functions
        ├── service.server.ts     # Authoritative domain methods
        └── types.ts              # Zod schemas for input validation
```

### Pattern 1: Privacy-Safe Public Projections
**What:** Transforming database rows before sending to public clients so no personal information (name, phone, email, purpose, unit) is exposed.
**Implementation:**
```typescript
// Query active asset schedule for public calendar
export const getAssetPublicScheduleFn = createServerFn({ method: "GET" })
  .validator((assetId: string) => z.string().uuid().parse(assetId))
  .handler(async ({ data: assetId }) => {
    const approved = await db
      .select({
        startDate: bookings.startDate,
        endDate: bookings.endDate,
      })
      .from(bookings)
      .where(and(eq(bookings.assetId, assetId), eq(bookings.status, "approved")));

    const closures = await db
      .select({
        startDate: assetClosures.startDate,
        endDate: assetClosures.endDate,
        reason: assetClosures.reason,
      })
      .from(assetClosures)
      .where(eq(assetClosures.assetId, assetId));

    return {
      bookedSlots: approved.map(b => ({
        startDate: b.startDate.toISOString(),
        endDate: b.endDate.toISOString(),
        status: "booked" as const,
      })),
      closureSlots: closures.map(c => ({
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString(),
        reason: c.reason,
        status: "closed" as const,
      })),
    };
  });
```

### Pattern 2: Live Availability Pre-flight
**What:** Validating user-selected date/time against operating hours, closures, and capacity before they fill out requester info.
**Implementation:**
```typescript
export const checkAvailabilityPreflightFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => CheckPreflightSchema.parse(data))
  .handler(async ({ data }) => {
    return await BookingService.checkPreflightAvailability(data);
  });
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timezone conversion | Custom hour offsets | `date-fns-tz` & `src/lib/timezone/datetime.ts` | Handles leap years, UTC vs WIB conversions, and daylight shifts correctly. |
| State transition checks | Ad-hoc string comparisons | `validateBookingTransition` (`src/lib/booking/state-machine.ts`) | Strict finite state machine preventing invalid status transitions. |
| Form validation | Manual `if (!email)` statements | `zod` schemas (`CreateBookingInputSchema`) | Type-safe parsing with comprehensive regex and custom error messages. |
| Public Cancellation | Unchecked delete query | `BookingService.cancelBookingByPublicReference` | Enforces state machine rules, verifies reference token, and writes audit event. |

## Common Pitfalls

### Pitfall 1: Leaking PII on Public Calendar
**What goes wrong:** Public calendar endpoint returns `select().from(bookings)`, exposing requester names, department, phone numbers, or meeting purposes.
**Prevention:** Explicitly select only `startDate` and `endDate` columns in public queries. Never return the raw `bookings` row to unauthenticated callers.

### Pitfall 2: Client-Side Only Validation Bypass
**What goes wrong:** Form disables the submit button if slot is taken, but a malicious or concurrent user submits directly via RPC.
**Prevention:** `submitBookingRequestFn` authoritatively re-checks operating hours, closures, room overlap, and dormitory capacity inside a transactional row-lock before inserting.

### Pitfall 3: Timezone Desync between Client Form & Server DB
**What goes wrong:** Client date picker sends UTC ISO string which shifts the calendar day in `Asia/Jakarta` (e.g. 00:00 UTC = 07:00 WIB).
**Prevention:** Normalize all incoming start/end dates using `normalizeDate` / `parseInJakarta` helpers from `src/lib/timezone/datetime.ts`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js Test Runner with `tsx` |
| Config file | `package.json` test script |
| Quick run command | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` |
| Full suite command | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/db/migration.test.ts src/db/auth.test.ts src/lib/booking/booking.test.ts` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| **ASSET-04** | Public asset catalog & privacy-safe schedule queries omit PII | Unit/Integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` | Wave 0 |
| **BOOK-01** | Room booking submission validation and field handling | Unit/Integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` | Yes |
| **BOOK-02** | Dormitory booking submission & stay date validation | Unit/Integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` | Yes |
| **BOOK-03** | Preflight availability check for operating hours, closures, capacity | Unit/Integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` | Wave 0 |
| **BOOK-04** | Booking creation returns reference code and `pending` status | Unit/Integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` | Yes |
| **BOOK-05** | Public status tracking lookup & privacy-safe projection | Unit/Integration | `& "C:\nvm4w\nodejs\node.exe" --import tsx --test src/lib/booking/booking.test.ts` | Wave 0 |

### Wave 0 Gaps
- [ ] Add public projection tests and preflight validation helper tests to `src/lib/booking/booking.test.ts`.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Yes | Public endpoints only access sanitized projections; cancellation requires matching booking reference token. |
| V5 Input Validation | Yes | Zod schema validation for all parameters (`assetId`, date strings, headcount, email, phone). |
| V8 Data Protection | Yes | Zero PII returned on public discovery and availability endpoints. |

### Known Threat Patterns for Public Booking

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| PII Harvester / Scraping | Information Disclosure | Omit all requester and organizational data from public calendar queries. |
| Schedule Denial of Service / Overbooking | Denial of Service | Transactional row-level locking (`SELECT FOR UPDATE`) prevents double booking. |
| Reference Guessing / Unauthorized Cancellation | Tampering | Cancellation requires matching booking UUID or requester email token. |
