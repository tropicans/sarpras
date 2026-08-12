# Architecture

**Analysis Date:** 2026-08-12

## Pattern Overview

**Overall:** Full-stack SPA/SSR Application (TanStack Start + React)

**Key Characteristics:**
- **File-based routing:** Automatic routing mapping via the structure inside `src/routes/`.
- **Server Side Rendering (SSR):** Supported out-of-the-box by TanStack Start, compiling routes client-side and server-side.
- **Strict Typing:** Route parameters, search queries, and route trees are fully validated and statically typed by TanStack Router.

## Layers

**Routing Layer (`src/routes/`):**
- Purpose: Defines URLs and page layout/content boundaries.
- Contains: Layout routes (`__root.tsx`) and page routes (`index.tsx`).
- Depends on: React components and TanStack core routing abstractions.
- Used by: Vite compiler, dev server, and web clients.

**Router Configuration Layer (`src/router.tsx` & `src/routeTree.gen.ts`):**
- Purpose: Configures preloading, scrolling, devtools, and TypeScript declarations.
- Contains: `getRouter` factory function and generated route mapping.
- Depends on: Routing layer.
- Used by: Application entry points.

**Styling Layer (`src/styles.css`):**
- Purpose: Global layout, Tailwind directive imports.
- Contains: Utility-first styling imports and baseline resetting rules.
- Used by: Root document components.

## Data Flow

**Hydrated SSR Rendering:**

1. User requests a page URL (e.g., `/`).
2. Server-side handler parses route, executes SSR layout mapping, compiles HTML/CSS.
3. Server returns HTML string + scripts.
4. Client-side JS hydrates the markup, initiating router instance client-side.
5. Future navigation is intercepted client-side via TanStack Link components (preloaded on intent).

**State Management:**
- Stateless: No server-side session or global store is configured yet. Client routing state is handled natively by `@tanstack/react-router`.

## Key Abstractions

**Route Definitions (`createRootRoute`, `createFileRoute`):**
- Purpose: Declaration wrapper for route components, hooks, loader requirements, and head metadata.
- Examples: `Route` in `__root.tsx`, `Route` in `index.tsx`.
- Pattern: Declarative component configuration.

**Router Instance Registration (`getRouter`):**
- Purpose: Registry interface hooking TypeScript types into global React-Router interfaces.
- Examples: `Register` interface module redeclaration in `src/router.tsx`.
- Pattern: Singleton/Factory wrapper.

## Entry Points

**Root Layout Component:**
- Location: `src/routes/__root.tsx` -> `RootDocument`
- Triggers: Initial page hit (both SSR and hydration).
- Responsibilities: Wraps rendering hierarchy with `<html>`, `<head>`, `<body>`, imports stylesheets, and injects developer tools panel.

**Application Router Setup:**
- Location: `src/router.tsx`
- Triggers: Executed on initialization of clients/servers.
- Responsibilities: Merges the generated route tree (`routeTree.gen.ts`) into a router instance with scroll restoration and intent preloading configurations.

## Error Handling

**Strategy:** Exception bubbles up to React error boundaries. No customized boundaries or fallback schemas are defined yet.

## Cross-Cutting Concerns

**Logging:**
- Standard console logging in developer environments.

**Validation:**
- TypeScript strict compiler options (in `tsconfig.json`).
- Route schema parameters validation is handled automatically via TanStack's static types.

**Authentication:**
- None configured.

---

*Architecture analysis: 2026-08-12*
*Update after adding layers, state machines, or new entry points*
