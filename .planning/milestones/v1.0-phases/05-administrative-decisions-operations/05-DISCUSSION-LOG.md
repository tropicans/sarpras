# Phase 5: Administrative Decisions & Operations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 05-administrative-decisions-operations
**Areas discussed:** Approval Queue & Conflict Review, Dashboard KPIs & Filter Layout, Asset-Centric Operations Calendar, Audit Trail & History Inspector

---

## Approval Queue & Conflict Review

| Option | Description | Selected |
|--------|-------------|----------|
| Table list with detail review drawer/modal | Live conflict alerts and quick Setujui/Tolak actions | ✓ |
| Dedicated full-page request review | Full page per request with schedule context & conflict diffs | |
| Kanban board column view | Partitioned by status | |

| Option | Description | Selected |
|--------|-------------|----------|
| Preset quick reason dropdown + custom text area | Standard polite presets (Jadwal Bertabrakan, Pemeliharaan Aset, Kapasitas Kurang) + custom notes | ✓ |
| Freeform required text area only | No preset templates | |

**User's choice:** Table list with detail review drawer/modal + preset quick reason dropdown with editable text area.
**Notes:** Helps administrators rapidly evaluate pending requests, see conflict warnings against approved/pending slots, and issue standardized or custom rejection explanations.

---

## Dashboard KPIs & Filter Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Top KPI cards + Urgent Pending Widget + Filterable Bookings Table | Pending actions, approved this month, active assets, closures + quick-action queue | ✓ |
| Metric cards with trend charts | Monthly volume and distribution charts | |
| Streamlined minimal counts | Simple count cards only | |

| Option | Description | Selected |
|--------|-------------|----------|
| Instant reactive filter bar + search | Status, Asset Type, Date Range presets & custom picker, reference/requester search | ✓ |
| Paginated table with form submit | Server reload filters | |

**User's choice:** Top KPI cards with urgent pending list and instant reactive filter toolbar.
**Notes:** Provides high-visibility operational awareness for daily sarpras managers.

---

## Asset-Centric Operations Calendar

| Option | Description | Selected |
|--------|-------------|----------|
| Asset selector (Room/Dorm) with Month & Week views | Approved (solid), Pending (amber/striped), Closures (red banner) | ✓ |
| Unified horizontal Gantt matrix | All assets simultaneously | |
| Day-by-day agenda list | Simple list | |

| Option | Description | Selected |
|--------|-------------|----------|
| Click-to-preview popover/modal | Quick requester and attendance details with action shortcuts | ✓ |
| Navigate directly to bookings queue | Route navigation | |

**User's choice:** Asset selector with Month/Week views and click-to-preview popover/modal.
**Notes:** Tailored for both room hourly schedules and dormitory multi-day stay allocations.

---

## Audit Trail & History Inspector

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated `/admin/audit` table | Action type, entity type, date range filters, actor search | ✓ |
| Activity stream timeline | Stream layout with infinite scrolling | |
| Embedded history tabs | Inside details only | |

| Option | Description | Selected |
|--------|-------------|----------|
| Formatted visual diff + expandable JSON view | Status old -> new diff + full structured payload | ✓ |
| Standard raw JSON payload inspector | Raw JSON modal | |

**User's choice:** Dedicated `/admin/audit` view with visual diff and expandable JSON viewer.
**Notes:** Provides accountability and audit readiness for all administrative actions and booking transitions.

---

## Developer's Discretion

- Styling tokens and animations using existing Tailwind/CSS design system.
- Exact drawer transition speeds and table column widths.

## Deferred Ideas

- Email/SMS notifications on approval or rejection (deferred to v2 - NOTF-01, INTG-02).
- Automatic booking rule policy engine (deferred to v2 - POLY-01).
