# Codebase Concerns

**Analysis Date:** 2026-08-12

## Tech Debt

**Starter application remains in place:**
- Issue: The only user-facing route renders the generated TanStack Start welcome message, while the root route retains the generated title and document language.
- Files: `src/routes/index.tsx`, `src/routes/__root.tsx`, `README.md`
- Impact: The application has no implemented domain behavior, navigation, or product-specific metadata; development work starts from a placeholder rather than a defined application shell.
- Fix approach: Replace the starter route and document metadata with the intended feature shell, route hierarchy, navigation, and product title before adding domain features.

**Generated route tree is checked in:**
- Issue: File-based routes are represented by the generated `routeTree.gen.ts` file, which is intentionally excluded from formatting and linting.
- Files: `src/routeTree.gen.ts`, `package.json`, `biome.json`
- Impact: Adding or renaming routes requires route generation to stay synchronized; stale generated types and route definitions can block builds or hide newly added routes.
- Fix approach: Keep route edits in `src/routes/` only and run `npm run generate-routes` after route changes; add this command to automated verification.

## Known Bugs

**No confirmed application bugs:**
- Symptoms: Not detected in the current minimal implementation.
- Files: `src/routes/index.tsx`, `src/routes/__root.tsx`, `src/router.tsx`
- Trigger: Not applicable.
- Workaround: Not applicable.

## Security Considerations

**Developer tooling is rendered in the document shell:**
- Risk: `TanStackDevtools` and the Router devtools panel are rendered unconditionally, so they can be bundled and exposed in a production deployment unless build configuration removes them.
- Files: `src/routes/__root.tsx`, `vite.config.ts`, `package.json`
- Current mitigation: The project uses a local development server script and has no production deployment configuration checked in.
- Recommendations: Gate devtools to development builds or configure production stripping before deployment; confirm the resulting production bundle does not include the panels.

**No authentication or authorization boundary exists:**
- Risk: Current routes have no identity, session, role, or request-authorization mechanism.
- Files: `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/router.tsx`
- Current mitigation: No data-mutating route or API endpoint exists in the current source tree.
- Recommendations: Establish server-side authentication, session handling, and route guards before exposing user data or state-changing endpoints.

**No input-validation pattern exists:**
- Risk: The source tree contains no server functions or API handlers that demonstrate validation of untrusted input.
- Files: `src/routes/index.tsx`, `src/routes/__root.tsx`
- Current mitigation: The current UI has no inputs and no server endpoint implementation.
- Recommendations: Introduce schema validation at every server-function and API-route boundary when those interfaces are added.

## Performance Bottlenecks

**Production debug panel payload:**
- Problem: The root document always mounts devtools and the router panel.
- Files: `src/routes/__root.tsx`
- Cause: The component imports and renders `TanStackDevtools` without a development-only guard.
- Improvement path: Use a production-removal configuration or conditional implementation, then inspect the production bundle after each tooling update.

## Fragile Areas

**Route generation workflow:**
- Files: `src/routes/`, `src/routeTree.gen.ts`, `package.json`
- Why fragile: The generated route tree must reflect filesystem routes, yet generation is a separate script with no checked-in CI workflow enforcing it.
- Safe modification: Add, rename, or remove route files under `src/routes/`, regenerate the route tree, and run the project checks before committing.
- Test coverage: No route tests or route-generation verification files are present.

**Document-level configuration:**
- Files: `src/routes/__root.tsx`
- Why fragile: The root route owns global metadata, stylesheet loading, scripts, and development tooling in one component; changes affect every rendered page.
- Safe modification: Verify document head output, global styling, script hydration, and production bundle behavior whenever the root route changes.
- Test coverage: No document-shell, metadata, or hydration tests are present.

## Scaling Limits

**Application capabilities:**
- Current capacity: One static `/` route, zero application data stores, zero API handlers, and zero server functions are present in `src/`.
- Limit: The codebase cannot currently support persisted records, concurrent users, access control, or integrations.
- Scaling path: Define the data model and persistence boundary, add validated server APIs and authorization, then introduce route-level loading and error handling with tests.

## Dependencies at Risk

**TanStack packages declared as `latest`:**
- Risk: `@tanstack/react-devtools`, `@tanstack/react-router`, `@tanstack/react-router-devtools`, `@tanstack/react-start`, and `@tanstack/devtools-vite` use the moving `latest` tag rather than an explicit version range.
- Impact: A fresh dependency resolution can select incompatible package releases despite the current `package-lock.json`, causing unexpected build, runtime, or type behavior.
- Migration plan: Pin compatible package versions in `package.json`, retain `package-lock.json`, and update them together through a tested dependency-update process.

**Toolchain compatibility is not automated:**
- Risk: The project combines Vite `^8.0.0`, TypeScript `^6.0.2`, React `^19.2.0`, and several TanStack packages without a CI compatibility check.
- Impact: Dependabot-style updates or a clean install can reveal version incompatibilities only during local development or deployment.
- Migration plan: Add a CI workflow that performs a clean install, route generation, static checks, and production build for every change.

## Missing Critical Features

**Error and not-found experiences:**
- Problem: No route-level `errorComponent`, `notFoundComponent`, or global error-boundary implementation exists.
- Blocks: The application cannot provide tailored recovery or not-found UI once routes load data or execute server-side behavior.

**Deployment and continuous verification configuration:**
- Problem: No CI workflow or deployment configuration is present in the tracked project files.
- Blocks: Reproducible build validation, automated route generation checks, and controlled release deployment are not established.

## Test Coverage Gaps

**Entire application surface:**
- What's not tested: No unit, integration, route, document-shell, accessibility, or end-to-end test files or test-runner configuration are present.
- Files: `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/router.tsx`, `package.json`
- Risk: Changes to routing, rendering, hydration, metadata, or future business logic can regress without automated detection.
- Priority: High

**Build and generated-route integrity:**
- What's not tested: There is no automated assertion that generated `src/routeTree.gen.ts` matches `src/routes/` or that the production build succeeds.
- Files: `src/routeTree.gen.ts`, `src/routes/`, `package.json`, `vite.config.ts`
- Risk: Route changes and toolchain upgrades can fail late in development or deployment.
- Priority: High

---

*Concerns audit: 2026-08-12*
