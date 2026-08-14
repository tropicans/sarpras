# Phase 4: Public Discovery & Booking Requests - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 04-Public Discovery & Booking Requests
**Areas discussed:** Discovery & Availability UI, Booking Request Form Flow, Reference & Status Tracking Flow, Public Portal & Landing Page Structure

---

## Discovery & Availability UI

| Option | Description | Selected |
|--------|-------------|----------|
| Asset Cards + Date Availability Filter with Visual Schedule Modal | Browse rooms/dormitories with type & capacity filters. Filter by desired date/time to see live availability status, with a "Lihat Jadwal" modal showing booked slots (privacy-safe: "Terpakai" without PII). | ✓ |
| Unified Public Schedule Calendar | A weekly/monthly calendar matrix showing all assets and their booked/open time blocks directly in a grid. | |
| Search-First Matching | A prominent date/time/attendee search bar that returns only matching available assets ready for immediate booking. | |

**User's choice:** Asset Cards + Date Availability Filter with Visual Schedule Modal.
**Notes:** Ensures visitors can quickly see availability status on cards and open an interactive visual schedule modal to check blocked slots without exposing any requester PII.

---

## Booking Request Form Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-Step Wizard | Step 1 (Dates, Time & Attendance with instant live availability validation) -> Step 2 (Requester info: Name, Email, Phone, Organization, Purpose) -> Step 3 (Summary Review & Submit). | ✓ |
| Single-Page Dynamic Form | All inputs on one page with real-time inline validation and a sticky booking summary card on the side. | |

**User's choice:** Multi-Step Wizard.
**Notes:** Step 1 validates date/time, capacity, operating hours, and closures live before moving to requester contact information and final review.

---

## Reference & Status Tracking Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Human-friendly reference + direct tracking URL | Human-friendly alphanumeric reference (e.g. `SP-2026-XXXXX`) + direct tracking URL `/status/:ref` with status timeline, booking details, and self-service cancellation button. | ✓ |
| UUID Reference + Email verification | Require both the UUID code and requester email address to view booking status and perform cancellation. | |

**User's choice:** Human-friendly alphanumeric reference + direct tracking URL `/status/:ref`.
**Notes:** Clean tracking experience with visual progress stepper (`Menunggu Konfirmasi` -> `Disetujui` / `Ditolak` / `Dibatalkan`) and self-service cancellation.

---

## Public Portal & Landing Page Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Integrated Public Portal | Hero with quick date/type filter + Live Asset Catalog grid + "Cara Pengajuan" guide + Header link to Track Status (/status). | ✓ |
| Dedicated Multi-Page Flow | Minimal Home page with hero & asset highlights leading to separate /katalog, /booking/:assetId, and /status pages. | |

**User's choice:** Integrated Public Portal.
**Notes:** Unified home page providing discovery, quick availability filtering, asset catalog, guidance, and easy status lookup navigation.

---

## Developer's Discretion

- Styling and micro-interactions using Vanilla CSS and existing theme styling.
- Responsive mobile optimizations and form field validation visual indicators.

## Deferred Ideas

- Email/SMS automated notifications for status updates (deferred to v2).
- Admin booking approval workflow (deferred to Phase 5).
