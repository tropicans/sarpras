# Roadmap: Sarpras PPKASN

## Milestones

- 🔄 **v1.2 WhatsApp Integration** — Phase 7 (active)
- ✅ **v1.1 RBAC Enforcement** — Phase 6 (shipped 2026-08-14) — [v1.1 Roadmap](milestones/v1.1-ROADMAP.md)
- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-08-14) — [v1.0 Roadmap](milestones/v1.0-ROADMAP.md)

## Phases

- [x] **Phase 7: WhatsApp Notification & Integration** (2/2 plans) — completed 2026-08-14
  - **Goal**: Integrate Fonnte WhatsApp Gateway for automated booking submissions, approval/rejection updates to requesters, and instant operational notifications to administrators.
  - **Depends on**: Phase 6
  - **Requirements**: WA-01, WA-02, WA-03, WA-04, WA-05, WA-06, WA-07, WA-08
  - **Success Criteria**:
    1. Fonnte client module and mock/logger fallback correctly format and dispatch WhatsApp payloads.
    2. Booking submissions trigger confirmation messages to requester phone numbers and admin alerts.
    3. Status transitions (approve/reject) automatically trigger WhatsApp messages with reference numbers, status URLs, and rejection reasons.
    4. Asynchronous dispatch guarantees that gateway timeouts or errors do not affect booking transactions.

<details>
<summary>✅ v1.1 RBAC Enforcement (Phase 6) — SHIPPED 2026-08-14</summary>

- [x] **Phase 6: Role-Based Access Control (RBAC)** (1/1 plans) — completed 2026-08-14

</details>

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-08-14</summary>

- [x] **Phase 1: Canonical Data & Migration** (1/1 plans) — completed 2026-08-12
- [x] **Phase 2: Secure Administration & Asset Setup** (3/3 plans) — completed 2026-08-12
- [x] **Phase 3: Booking Integrity & Audit Core** (3/3 plans) — completed 2026-08-14
- [x] **Phase 4: Public Discovery & Booking Requests** (3/3 plans) — completed 2026-08-14
- [x] **Phase 5: Administrative Decisions & Operations** (3/3 plans) — completed 2026-08-14

</details>
