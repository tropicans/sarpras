# Sarpras PPKASN

## What This Is

Sarpras PPKASN is a web application for managing facilities at Pusat Pengembangan Kompetensi Aparatur Sipil Negara. It lets visitors submit room and dormitory booking requests, while administrators manage assets, schedules, and approvals through a secure dashboard.

This project rebuilds the deployed application at `https://sarpras-ppkasn.vercel.app/` with a maintainable full-stack implementation, a more reliable booking workflow, and migration of the current assets, bookings, and administrator accounts.

## Core Value

Users can confidently request an available room or dormitory, and administrators can make and track an accountable booking decision without conflicts or lost data.

## Requirements

### Validated

- ✓ A TanStack Start application can render a public route — existing `src/routes/index.tsx`.
- ✓ File-based routing and the application shell are established — existing `src/router.tsx` and `src/routes/__root.tsx`.

### Active

- [ ] Rebuild public room and dormitory booking flows.
- [ ] Add durable storage and migrate current assets, bookings, and administrator accounts.
- [ ] Provide authenticated, role-based administration for assets, schedules, and booking decisions.
- [ ] Prevent booking conflicts and preserve an auditable booking history.
- [ ] Improve usability, responsiveness, filtering, and validation across public and administrative workflows.

### Out of Scope

- Native mobile applications — v1 is a responsive web application.
- Replacing the organization’s upstream identity system — v1 migrates and manages the existing administrator accounts only.
- Real-time chat or public social features — they do not support the booking workflow.

## Context

- The live reference application exposes public booking schedules for rooms and dormitories, a public booking form, and an administrator dashboard at `/auth`.
- The current local repository is a minimal TanStack Start starter using React, TypeScript, Vite, Tailwind CSS, and Biome; its existing implementation does not yet contain the deployed product domain.
- The codebase map is available in `.planning/codebase/` and should guide changes to the existing TypeScript/TanStack foundation.

## Constraints

- **Migration**: Existing assets, booking records, and administrator accounts must be migrated — preserve operational continuity.
- **Compatibility**: Keep the project’s TanStack Start, React, TypeScript, Vite, Tailwind CSS, and Biome foundation unless a planned phase justifies a change.
- **Security**: Administrator authentication, authorization, and migrated account data require secure server-side handling.
- **Availability**: Booking availability and conflict checks must remain correct under concurrent requests.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebuild the full application | The existing local repository is only a starter while the deployed product includes public and administrative workflows. | — Pending |
| Migrate assets, bookings, and administrator accounts | The replacement must preserve existing operational data. | — Pending |
| Enhance rather than clone the current application | The rebuilt product should improve validation, usability, approval tracking, and maintainability. | — Pending |
| Prioritize booking integrity | Preventing conflicts and retaining accountable decisions is the product’s core value. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-12 after initialization*
