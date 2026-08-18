# Coding Conventions

**Analysis Date:** 2026-08-18

## Naming Patterns

**Files:**
- React components: `kebab-case.tsx` (e.g., `booking-review-drawer.tsx`, `theme-toggle.tsx`)
- Server functions (TanStack Start RPC): `*.functions.ts` (e.g., `public-fns.functions.ts`, `admin-fns.functions.ts`)
- Server-only modules: `*.server.ts` (e.g., `service.server.ts`, `client.server.ts`, `auth.server.ts`)
- Unit and integration tests: `*.test.ts` (e.g., `booking.test.ts`, `service.test.ts`)
- Shared schemas and utilities: `kebab-case.ts` (e.g., `state-machine.ts`, `datetime.ts`)
- Routes: `kebab-case.tsx` or dynamic `$param.tsx` in `src/routes/`

**Functions:**
- camelCase for standard functions (e.g., `calculateEndTime`, `validateTimeRange`, `formatWibDate`)
- Server functions named with suffix `Fn` (e.g., `submitBookingFn`, `reviewBookingFn`, `getAdminBookingsFn`)
- Event handlers prefixed with `handle` (e.g., `handleSubmit`, `handleStatusFilterChange`, `handleApprove`)
- React components named in PascalCase (e.g., `BookingReviewDrawer`, `HeroConsole`)

**Variables:**
- camelCase for variables and properties (e.g., `bookingId`, `requesterEmail`, `startDateWib`)
- UPPER_SNAKE_CASE for global constants (e.g., `TIMEZONE_JAKARTA`, `DEFAULT_PAGE_SIZE`, `ALLOWED_ROLES`)

**Types:**
- PascalCase for type aliases and interfaces (e.g., `BookingWithAsset`, `CreateBookingInput`, `AssetAvailability`)
- Avoid `I` prefix on interfaces

## Code Style

**Formatting & Linting:**
- Configured in `biome.json` using `@biomejs/biome: 2.4.5`
- Indentation: Tabs (`"indentStyle": "tab"`)
- Quotes: Double quotes for strings (`"quoteStyle": "double"`)
- Semicolons: Required (`"semicolons": "always"`)
- Run commands:
  - `pnpm format` (formats codebase)
  - `pnpm lint` (runs linter)
  - `pnpm check` (formats and lints)

**Styling & Design System:**
- Tailwind CSS v4 utility classes (`className="..."`)
- Variant merging using `clsx` and `tailwind-merge` (`cn(...)` helper in `src/lib/utils.ts`)
- Theme styling using CSS variables defined in `src/styles.css` (e.g., `--bg-background`, `--color-primary`)
- Class-based dark mode toggling (`html.dark`)

## Import Organization

**Order:**
1. Node.js built-ins (`node:http`, `node:fs`, `node:path`, `node:crypto`)
2. External third-party packages (`react`, `@tanstack/react-router`, `@tanstack/react-start`, `drizzle-orm`, `lucide-react`)
3. Internal application modules using `#/*` path alias (e.g., `#/db/schema`, `#/lib/booking/service.server`)
4. Relative imports (`./types`, `../components/ui/button`)
5. Type-only imports (`import type { ... } from "..."`)

**Path Aliases:**
- `#/*` mapped to `./src/*` in `package.json` imports and `tsconfig.json` paths

## Error Handling

**Server Functions & Services:**
- Guard clauses at function entry checking preconditions and permissions
- Input validation using Zod (`.parse()` or `.safeParse()`)
- Explicit error throwing with descriptive Indonesian or technical messages (e.g., `throw new Error("Jadwal fasilitas telah terisi oleh pengajuan lain.")`)
- Non-fatal background errors (such as notification dispatch failures) caught and logged with `console.error` without rolling back critical database transactions

**Client UI:**
- Error states managed in React components via state variables (`error`, `errorMessage`) or toast alerts
- Route-level error boundaries using `errorComponent` on TanStack Router routes

## Logging

**Patterns:**
- Use standard console methods (`console.info`, `console.warn`, `console.error`) with clear context tags
- Example: `console.error("[BookingService] Failed to create booking:", error)`
- Example: `[WhatsApp] Mock sending message to +6281234567890: ...`
- Critical business actions must also create records in the `audit_logs` table via `src/lib/audit/audit.server.ts`

## Comments & Documentation

**Language:**
- Domain concepts, facility terms, user-facing error messages, and operational labels in Bahasa Indonesia (PPKASN terminology: Sarana Prasarana, Ruang Rapat, Asrama, Pimpinan, Operator).
- Technical architecture, code comments, and test descriptions in English or Bahasa Indonesia.

**JSDoc & Type Annotations:**
- Exported helper functions in `src/lib/` include concise JSDoc comments explaining parameters, expected formats, and return values.

---

*Conventions analysis: 2026-08-18*
*Update after style changes*
