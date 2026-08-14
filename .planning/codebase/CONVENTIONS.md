# Coding Conventions & Design Patterns

**Analysis Date:** 2026-08-14

---

## 1. Code Style & Formatting

- **Linter & Formatter:** Configured via Biome (`biome.json`).
  - **Indentation:** Tabs (`indentStyle: "tab"`).
  - **Line Width:** 80 characters.
  - **Quotes:** Double quotes (`quoteStyle: "double"`).
  - **Semicolons:** Required (`semicolons: "always"`).
  - **Trailing Commas:** ES5 style (`trailingCommas: "es5"`).
- **Import Ordering & Aliasing:**
  - Standard/third-party imports at top.
  - Subpath imports use `#/*` alias pointing to `src/*` (e.g. `import { db } from "#/db/client.server"`).

---

## 2. Server Functions & RPC Patterns

- **Definition:** Use TanStack Start `createServerFn` with explicit HTTP methods:
  ```typescript
  export const updateAssetFn = createServerFn({ method: "POST" })
    .middleware([requireRoleMiddleware("admin")])
    .validator((data: unknown) => updateAssetSchema.parse(data))
    .handler(async ({ data, context }) => {
      // implementation
    });
  ```
- **Validation:** All incoming request payloads must be validated using `zod` schemas.
- **Middleware Stacking:** Authenticated functions must be chained with `authMiddleware` or `requireRoleMiddleware(role)` to guarantee security at the RPC boundary.

---

## 3. Timezone & DateTime Standards

- **Standard Timezone:** All business operations, operating hours, closures, and calendar views are anchored to `Asia/Jakarta` (WIB, UTC+7).
- **Database Storage:** All timestamp columns use `withTimezone: true` (`timestamp("column", { withTimezone: true })`).
- **Formatting Utilities:** Always use helpers from `src/lib/timezone/datetime.ts` (`formatWibDate`, `formatWibTime`, `formatWibDateTime`) to avoid client-side timezone drift.

---

## 4. Error Handling & Resilience

- **Public Endpoints:** Catch unhandled exceptions and return structured `{ success: false, error: "Friendly message" }` objects to avoid leaking server internals.
- **Side-Effect Resilience:** Auxiliary operations (such as sending WhatsApp notifications via `safeDispatchNotification`) must run non-blocking and catch all errors internally so they never abort core database transactions.
- **Audit Tracking:** Critical actions (mutations, approvals, rejections, status transitions, and notification dispatches) must call `recordAuditEvent()` with relevant actor ID and metadata payload.

---

## 5. UI & State Management

- **Client Navigation:** Use TanStack Router's typed `<Link to="...">` and `useNavigate()` rather than raw `window.location`.
- **Styling Patterns:** Use Tailwind CSS v4 utility classes composed with `cn(...)` from `src/lib/utils.ts`.
- **Forms & Inputs:** Controlled inputs with immediate client-side validation feedback before RPC invocation.

---

*Codebase conventions and practices analysis: 2026-08-14*
