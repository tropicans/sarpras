# Coding Conventions

**Analysis Date:** 2026-08-12

## Naming Patterns

**Files:**
- Use lowercase route filenames in `src/routes/`, such as `src/routes/index.tsx`; the TanStack Router generator produces `src/routeTree.gen.ts`.
- Use camelCase filenames for general TypeScript modules, as in `src/router.tsx`.

**Functions:**
- Use camelCase for functions, including the exported router factory `getRouter` in `src/router.tsx` and local React components such as `RootDocument` and `Home` in `src/routes/__root.tsx` and `src/routes/index.tsx`.

**Variables:**
- Use camelCase for local values, such as `router` in `src/router.tsx` and `appCss` in `src/routes/__root.tsx`.

**Types:**
- Use PascalCase for TypeScript and React types. `React.ReactNode` is used inline for the `children` prop in `src/routes/__root.tsx`.

## Code Style

**Formatting:**
- Biome is configured in `biome.json`.
- Use tabs for indentation and double quotes for JavaScript/TypeScript strings, as configured by `biome.json`.
- `biome.json` excludes generated `src/routeTree.gen.ts` and stylesheet `src/styles.css` from its file set; do not use these exclusions as a reason to manually reformat generated router output.

**Linting:**
- Biome linting is enabled with the recommended rule set in `biome.json`.
- Run `npm run check` from `package.json` for Biome’s combined checks when Node/npm is available.
- TypeScript compiler options in `tsconfig.json` enforce `strict`, unused-local/parameter checks, no switch fallthrough, and unchecked-side-effect-import detection.

## Import Organization

**Order:**
1. Third-party package imports, as in `src/router.tsx` and `src/routes/__root.tsx`.
2. Relative application and generated-module imports, as in `src/router.tsx` and `src/routes/__root.tsx`.
3. Keep stylesheet URL imports with the application imports that consume them, as `src/routes/__root.tsx` imports `../styles.css?url`.

**Path Aliases:**
- `#/*` and `@/*` both resolve to `src/*` in `tsconfig.json`; `package.json` also declares the `#/*` import mapping.
- Existing application modules currently use relative imports (`./routeTree.gen` and `../styles.css?url`); use aliases only when they improve a non-local import.

## Error Handling

**Patterns:**
- No application-specific error-handling code is present in `src/router.tsx`, `src/routes/__root.tsx`, or `src/routes/index.tsx`.
- Use TanStack Router’s route-level error patterns when adding failures; avoid inventing a global error utility until application code requires one.

## Logging

**Framework:** Not detected in `src/`.

**Patterns:**
- No `console` calls or logging abstraction are present in `src/router.tsx`, `src/routes/__root.tsx`, or `src/routes/index.tsx`.

## Comments

**When to Comment:**
- Application source currently uses no explanatory comments in `src/router.tsx`, `src/routes/__root.tsx`, or `src/routes/index.tsx`.
- Prefer self-explanatory names and add comments only where routing or framework behavior is not clear from the code.

**JSDoc/TSDoc:**
- Not detected in the handwritten source files under `src/`.

## Function Design

**Size:**
- Keep route modules small and focused: `src/routes/index.tsx` contains a single `Home` component, while `src/router.tsx` contains one router factory.

**Parameters:**
- Use inline object prop typing for small React components, as `RootDocument({ children }: { children: React.ReactNode })` does in `src/routes/__root.tsx`.

**Return Values:**
- Return configured framework objects directly from factories, as `getRouter` returns the constructed router in `src/router.tsx`.
- Return JSX directly from route components in `src/routes/__root.tsx` and `src/routes/index.tsx`.

## Module Design

**Exports:**
- Export TanStack Router route definitions as named `Route` constants in `src/routes/__root.tsx` and `src/routes/index.tsx`.
- Export reusable setup functions as named exports, as with `getRouter` in `src/router.tsx`.

**Barrel Files:**
- Not used in the handwritten `src/` modules. `src/routeTree.gen.ts` is generated route-tree output, not a handwritten barrel file.

---

*Convention analysis: 2026-08-12*
