# Coding Conventions

**Analysis Date:** 2026-08-12

## Naming Patterns

**Files:**
- Routes & Layouts: lowercase/kebab-case or double underscore prefix (e.g. `index.tsx`, `__root.tsx`).
- Configurations: lowercase/kebab-case (e.g., `vite.config.ts`, `tsr.config.json`).
- Non-component modules: kebab-case.

**Functions:**
- Standard functions: camelCase (e.g. `getRouter`).
- React Components: PascalCase (e.g. `RootDocument`, `Home`).

**Variables:**
- Local variables: camelCase.
- Route constants: PascalCase (e.g., `Route` in `index.tsx` and `__root.tsx`).

**Types & Interfaces:**
- Interfaces and Type aliases: PascalCase.
- Module interfaces: redeclaring `@tanstack/react-router` Register using PascalCase properties.

## Code Style

**Formatting:**
- Formatter: Biome (`biome.json`).
- Indentation: tab (1 tab spacing).
- Quotes: Double quotes (`"`) for JavaScript strings/attributes.
- Semi-colons: Managed automatically by Biome parser.

**Linting:**
- Linter: Biome (`biome.json`) with recommended rules enabled (`"recommended": true`).
- Run code check via command: `npm run check` or `npm run lint`.

## Import Organization

**Order:**
- Biome automatically organizes imports on save:
  1. External modules (`react`, `@tanstack/react-router`, etc.)
  2. Relative styles / static assets
  3. Internal files / generated modules
- Grouping: blank line between core imports and local path scripts.
- Path Aliases: `@/*` and `#/*` mapping to `./src/*` are preferred over deep relative paths.

## Error Handling

**Patterns:**
- Standard React boundary flow. Route validation failures and redirects are thrown using TanStack Router redirection signals (e.g. `throw redirect()`).

## Logging

**Framework:**
- No custom logger config. Use standard web-console logging utilities (`console.log`, `console.error`) in local environments.

## Comments

**When to Comment:**
- Comment on custom/non-obvious compiler workarounds or configuration overrides.
- Use TODO comments for placeholders or upcoming feature branches.

---

*Style analysis: 2026-08-12*
*Update when modifying linters, styling guides, or format properties*
