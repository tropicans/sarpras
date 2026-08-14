# Phase 04: Public Discovery & Booking Requests - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 04-public-discovery-booking-requests
**Areas discussed:** Discovery & Availability Presentation, Booking Request Experience, Reference Tracking & Public Cancellation, Home Portal & Navigation Layout

---

## Discovery & Availability Presentation (ASSET-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Modal/Drawer Calendar & Time Slot View | Clicking "Lihat Jadwal" opens a modal showing daily time blocks / monthly calendar marked as "Terpakai" or "Tutup" without any personal requester details. | ✓ |
| Inline Date & Schedule Filter | Visitor selects date/time range on the main search bar, and each asset card directly updates its availability badge. | |
| Schedule Viewable Only During Booking Flow | Cards show general asset specs & status badge; detailed day availability is presented during the booking selection step. | |

**User's choice:** Modal/Drawer Calendar & Time Slot View
**Notes:** Full privacy-safe inspection of room and dorm booking status without revealing requester names or organizations.

---

## Booking Request Experience (BOOK-01, BOOK-02, BOOK-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated Route (`/book/$assetId`) with 3-Step Wizard & Live Validation | Step 1 (Schedule & Attendees with instant conflict/capacity checks), Step 2 (Requester Info & Organization), Step 3 (Review & Terms confirmation). | ✓ |
| Single-Page Form Route (`/book/$assetId`) | All sections on a single scrollable form with live summary sidebar. | |
| Interactive Modal Wizard | 3-step submission wizard overlay directly on the home/catalog page without leaving the current URL. | |

**User's choice:** Dedicated Route (`/book/$assetId`) with 3-Step Wizard & Live Validation
**Notes:** Ensures accessible, step-by-step form completion with immediate error feedback on conflicts and operating hours.

---

## Reference Tracking & Public Cancellation (BOOK-04, BOOK-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Full Status Timeline + Direct Self-Service Cancellation | Visual status progress (Menunggu Konfirmasi -> Disetujui/Ditolak/Dibatalkan), rejection explanation if rejected, and an in-place "Batalkan Pengajuan" action (with confirmation dialog & reason prompt) for pending/approved requests. | ✓ |
| Read-Only Status Timeline with Admin-Only Cancellation | Requesters can view status progress and rejection reasons, but cancellations must be handled through admin contact. | |
| Status Details with PIN/Secret Verification | Requesters enter Reference Code + Requester Email to view tracking info. | |

**User's choice:** Full Status Timeline + Direct Self-Service Cancellation
**Notes:** Provides requesters full visibility and ability to cancel their requests using their reference identifier.

---

## Home Portal & Navigation Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Full Public Portal | Hero with quick-filter, Live Asset Catalog grid, "Cara Pengajuan" 3-step guide, and clear Navbar with "Cek Status" & "Masuk Petugas" links. | ✓ |
| Catalog-Centric Portal | Minimal hero, prioritizing direct asset browsing with immediate search & filtering controls at the top. | |
| Step-by-Step Guided Portal | Step-oriented homepage guiding the visitor directly through asset selection -> date pick -> booking. | |

**User's choice:** Full Public Portal
**Notes:** Clean, welcoming entry page meeting all PPKASN visitor requirements.

---

## Developer's Discretion
- Component styling with Vanilla CSS / Tailwind utility classes following `src/styles.css`.
- Micro-animations, responsive layout transitions, and icon choices.

## Deferred Ideas
- Email / SMS notifications on submission/approval (deferred to v2 - NOTF-01, INTG-02).
- Administrative approval workflow (deferred to Phase 5).
