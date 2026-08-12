# Codebase Concerns

**Analysis Date:** 2026-08-12

## Tech Debt

**Double Devtools Components (`src/routes/__root.tsx`):**
- Issue: In the root route component, both `TanStackDevtools` (from `@tanstack/react-devtools`) and `TanStackRouterDevtoolsPanel` (from `@tanstack/react-router-devtools`) are rendered together.
- Why: Simple starter template imports both for visibility.
- Impact: UI/DOM clutter and redundant rendering overhead in local development.
- Fix approach: Conditionally render or clean up devtools depending on environment preferences, or render only the core router devtools panel inside the shell.

## Known Bugs

- None currently identified.

## Security Considerations

**Exposed Devtools in Bundles:**
- Risk: Exposing development UI panels in production bundles.
- Current mitigation: Checked by the `@tanstack/devtools-vite` build plugin configuration (strips development views in production compiles).
- Recommendations: Ensure environment switches verify dev/prod separation before mounting.

## Performance Bottlenecks

- None currently identified (blank starter template).

## Fragile Areas

**Generated Code (`src/routeTree.gen.ts`):**
- Why fragile: This file is automatically compiled by the `tsr` router CLI engine. Any manual edits inside will be overwritten on development restarts or production builds.
- Safe modification: Modify routing schemas exclusively by renaming files or structure inside `src/routes/`.

## Scaling Limits

- None currently identified.

## Dependencies at Risk

- None currently identified.

## Missing Critical Features

**Lack of Testing Pipelines:**
- Issue: No automated test configurations (unit/integration/E2E) or frameworks are installed or set up.
- Impact: Code evolution risks regression errors.
- Fix approach: Set up Vitest or Playwright for unit and integration checks.

---

*Concerns audit: 2026-08-12*
*Update as codebase grows and debt or fragile paths emerge*
