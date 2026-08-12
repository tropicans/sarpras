<!-- refreshed: 2026-08-12 -->
# Architecture

**Analysis Date:** 2026-08-12

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                  TanStack Start application                  │
├──────────────────┬──────────────────┬───────────────────────┤
│ Router factory   │ Root document    │ Index route           │
│ `src/router.tsx` │ `src/routes/     │ `src/routes/index.tsx`│
│                  │ __root.tsx`      │                       │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│             File-route tree and framework runtime            │
│                    `src/routeTree.gen.ts`                    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                         Browser output                        │
│ `src/styles.css`; document head, page markup, devtools panel │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Router factory | Creates and registers the typed TanStack Router instance, including scroll restoration and preload defaults. | `src/router.tsx` |
| Root route and shell | Defines document metadata, loads the global stylesheet, renders route children, scripts, and TanStack devtools. | `src/routes/__root.tsx` |
| Index route | Registers `/` and renders the starter home screen. | `src/routes/index.tsx` |
| Generated route tree | Connects filesystem route modules to a type-safe route hierarchy. | `src/routeTree.gen.ts` |
| Global styling | Imports Tailwind CSS and defines document-wide box-sizing, minimum-height, and body-margin rules. | `src/styles.css` |

## Pattern Overview

**Overall:** File-based, route-centric TanStack Start React application.

**Key Characteristics:**
- Define each URL route as a module exporting `Route` from `createFileRoute`, as in `src/routes/index.tsx`.
- Keep document-level head, shell, assets, and shared developer tooling in the root route at `src/routes/__root.tsx`.
- Let TanStack Router generate `src/routeTree.gen.ts`; application code consumes its `routeTree` through `src/router.tsx`.

## Layers

**Route definition layer:**
- Purpose: Declares pages and shared document composition.
- Location: `src/routes/`
- Contains: `createRootRoute` and `createFileRoute` modules.
- Depends on: `@tanstack/react-router`, developer-tool packages, and stylesheet URL imports.
- Used by: `src/routeTree.gen.ts` and the TanStack Start runtime.

**Routing composition layer:**
- Purpose: Builds the router with generated route metadata and runtime navigation settings.
- Location: `src/router.tsx`
- Contains: `getRouter` factory and the router `Register` module augmentation.
- Depends on: `src/routeTree.gen.ts` and `@tanstack/react-router`.
- Used by: TanStack Start runtime discovery.

**Generated routing metadata layer:**
- Purpose: Represents the discovered filesystem route hierarchy and TypeScript route mappings.
- Location: `src/routeTree.gen.ts`
- Contains: generated imports, route IDs, full-path maps, and `routeTree`.
- Depends on: `src/routes/__root.tsx` and `src/routes/index.tsx`.
- Used by: `src/router.tsx`.

**Presentation layer:**
- Purpose: Provides global CSS and route-local Tailwind utility markup.
- Location: `src/styles.css` and `src/routes/index.tsx`
- Contains: Tailwind import, base document rules, and page JSX.
- Depends on: Tailwind CSS processed by `vite.config.ts`.
- Used by: `src/routes/__root.tsx` through `../styles.css?url`.

## Data Flow

### Primary Request Path

1. TanStack Start invokes `getRouter` to create the registered router (`src/router.tsx:4`).
2. The router receives `routeTree`, which links the root and `/` route modules (`src/router.tsx:5`, `src/routeTree.gen.ts:57`).
3. The root route provides the document shell and renders matched children (`src/routes/__root.tsx:28`, `src/routes/__root.tsx:31`).
4. The `/` route renders the home content (`src/routes/index.tsx:3`, `src/routes/index.tsx:5`).

### Styling and Document Metadata Flow

1. The root route imports the stylesheet as a Vite URL asset (`src/routes/__root.tsx:5`).
2. Its `head` configuration attaches that asset and metadata to the document (`src/routes/__root.tsx:7`).
3. `RootDocument` renders `HeadContent` and `Scripts` around every matched route (`src/routes/__root.tsx:34`, `src/routes/__root.tsx:50`).

**State Management:**
- No application state store, server data loader, or persistence layer is implemented in `src/`.
- Router state is managed by TanStack Router via the instance returned from `src/router.tsx`.

## Key Abstractions

**Route module:**
- Purpose: Couples a filesystem route path to route configuration and UI.
- Examples: `src/routes/__root.tsx`, `src/routes/index.tsx`.
- Pattern: Export a `Route` constant created with `createRootRoute` or `createFileRoute`.

**Router factory:**
- Purpose: Supplies the framework with a typed router instance.
- Examples: `src/router.tsx`.
- Pattern: `getRouter` returns `createRouter({ routeTree, ...options })`, then augments the TanStack `Register` interface.

## Entry Points

**Router factory:**
- Location: `src/router.tsx`
- Triggers: TanStack Start runtime requests the application's router.
- Responsibilities: Creates the router, supplies the generated tree, enables scroll restoration, and configures intent preloading.

**Root route:**
- Location: `src/routes/__root.tsx`
- Triggers: The generated route tree matches every application route beneath the root.
- Responsibilities: Sets metadata, attaches global CSS, wraps route children in the HTML document, and mounts devtools.

**Index route:**
- Location: `src/routes/index.tsx`
- Triggers: Navigation to `/`.
- Responsibilities: Renders the current starter home screen.

## Architectural Constraints

- **Threading:** The active application code is browser/React code running through the JavaScript event loop; no worker-thread or background-worker code exists in `src/`.
- **Global state:** No module-level mutable application state or singleton outside the router created by `getRouter` in `src/router.tsx` is present.
- **Circular imports:** No circular import chain is present in the active source graph: routes feed `src/routeTree.gen.ts`, which feeds `src/router.tsx`.
- **Generated routing:** Do not hand-edit `src/routeTree.gen.ts`; its header identifies it as TanStack Router-generated and it is regenerated from route files.
- **Route contract:** New pages must follow TanStack Router file-route conventions in `src/routes/` so the generated tree can discover them.

## Anti-Patterns

### Editing generated route metadata

**What happens:** Application changes are made directly in `src/routeTree.gen.ts`.
**Why it's wrong:** The file states it is generated and will be overwritten, so manual route changes are not durable.
**Do this instead:** Define or modify route modules in `src/routes/`, then run `npm run generate-routes` to update `src/routeTree.gen.ts`.

### Putting document shell concerns in leaf routes

**What happens:** Shared metadata, stylesheet links, or persistent tooling are duplicated in files such as `src/routes/index.tsx`.
**Why it's wrong:** Leaf route configuration only applies to that route and duplicates shared document concerns.
**Do this instead:** Keep shared shell behavior in `src/routes/__root.tsx` and leave leaf routes focused on their page UI.

## Error Handling

**Strategy:** No application-specific error boundary, route error component, server function, or API handler is implemented in `src/`.

**Patterns:**
- Use TanStack Router route-level error configuration when routes that can fail are added under `src/routes/`.
- Keep framework setup errors localized to the router and route modules at `src/router.tsx` and `src/routes/`.

## Cross-Cutting Concerns

**Logging:** No application logging implementation is present in `src/`.
**Validation:** No input, schema, or request validation implementation is present in `src/`.
**Authentication:** No authentication implementation is present in `src/`.

---

*Architecture analysis: 2026-08-12*
