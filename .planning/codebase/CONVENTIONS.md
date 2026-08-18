# Code Conventions & Style Guide

**Analysis Date:** 2026-08-18

---

## 1. Code Style & Formatting

- **Formatter & Linter:** Biome (`biome.json`) enforces 2-space indentation, double quotes, and strict linting rules.
- **Imports:**
  - Internal project imports use `#/*` path alias mapping to `./src/*`.
  - Type-only imports use `import type { ... }` syntax.
- **Naming Conventions:**
  - Components: PascalCase (e.g., `AssetCard`, `BookingReviewDrawer`).
  - Route Files: kebab-case with TanStack conventions (e.g., `check-booking.tsx`, `$assetId.tsx`).
  - Server Functions: CamelCase ending with `Fn` (e.g., `getAssetsListFn`, `createBookingFn`).
  - Services: PascalCase classes or camelCase factory functions (e.g., `EmailService`, `recordAuditEvent`).

---

## 2. Server Function Patterns

- Define server functions with `createServerFn({ method: "GET" | "POST" })`.
- Validate payloads with `.validator(zodSchema)`.
- Enforce authentication via `.middleware([authMiddleware])` or `.middleware([requireRoleMiddleware(["admin", "operator"])])`.
- Return structured error responses or throw standard errors with user-friendly messages.

```typescript
export const updateAssetFn = createServerFn({ method: "POST" })
  .middleware([requireRoleMiddleware(["admin", "operator"])])
  .validator(zodAssetSchema)
  .handler(async ({ data, context }) => {
    // Business logic...
  });
```

---

## 3. Database & Schema Conventions

- All table names use plural or snake_case conventions in PostgreSQL (e.g., `assets`, `bookings`, `audit_logs`, `two_factor`).
- Primary keys use UUIDs (`uuid("id").defaultRandom().primaryKey()`) or Better Auth text IDs.
- Timestamps include timezone (`timestamp("created_at", { withTimezone: true })`).
- Relations are explicitly declared using Drizzle `relations(...)`.

---

## 4. UI & Styling Guidelines

- Use Tailwind CSS v4 design tokens defined in `src/styles.css` (`bg-background`, `text-foreground`, `border-border`, `bg-card`, etc.).
- Always maintain high contrast in both light and dark modes (avoid hardcoded neutral hex codes; use semantic theme variables).
- Micro-animations using `tw-animate-css` for modals, popovers, and interactive status badges.
- All user-facing times formatted in Indonesian locale (`WIB`) via `src/lib/timezone/datetime.ts`.

---

*Codebase conventions and patterns analysis: 2026-08-18*
