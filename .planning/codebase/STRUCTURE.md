# Codebase Structure

**Analysis Date:** 2026-08-12

## Directory Layout

```
sarpras/
├── src/                         # Application source
│   ├── routes/                   # Filesystem route modules
│   │   ├── __root.tsx            # Root route and HTML document shell
│   │   └── index.tsx             # `/` page route
│   ├── router.tsx                # Typed TanStack Router factory
│   ├── routeTree.gen.ts          # Generated route hierarchy; do not edit
│   └── styles.css                # Tailwind import and global CSS
├── .planning/codebase/           # Generated codebase mapping documents
├── .tanstack/                    # TanStack Router tooling state; ignored by Git
├── .vscode/                      # Editor configuration
├── package.json                  # npm scripts and dependency manifest
├── package-lock.json             # npm dependency lockfile
├── vite.config.ts                # Vite, TanStack Start, React, Tailwind setup
├── tsconfig.json                 # TypeScript compiler and alias configuration
├── tsr.config.json               # TanStack Router CLI target configuration
├── biome.json                    # Biome formatter and linter configuration
└── README.md                     # Starter setup and framework usage notes
```

## Directory Purposes

**`src/`:**
- Purpose: Contains all active application source.
- Contains: Router composition, generated router metadata, styles, and route modules.
- Key files: `src/router.tsx`, `src/routeTree.gen.ts`, `src/styles.css`.

**`src/routes/`:**
- Purpose: Holds filesystem-defined TanStack Router routes.
- Contains: One root route and one leaf route.
- Key files: `src/routes/__root.tsx`, `src/routes/index.tsx`.

**`.planning/codebase/`:**
- Purpose: Stores architecture and codebase mapping artifacts.
- Contains: Mapping Markdown documents including `ARCHITECTURE.md` and `STRUCTURE.md`.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`.

## Key File Locations

**Entry Points:**
- `src/router.tsx`: Exports `getRouter`, the TanStack Start router factory.
- `src/routes/__root.tsx`: Defines the shared HTML document shell and root route.
- `src/routes/index.tsx`: Defines the route for `/`.

**Configuration:**
- `vite.config.ts`: Registers TanStack devtools, Tailwind, TanStack Start, and React Vite plugins.
- `tsconfig.json`: Enables strict TypeScript settings and maps `#/*` and `@/*` to `src/*`.
- `tsr.config.json`: Sets TanStack Router CLI generation target to React.
- `biome.json`: Controls formatting and linting for active source and selected configuration files.
- `package.json`: Defines npm development, build, route-generation, and Biome scripts.

**Core Logic:**
- `src/router.tsx`: Central router options and type registration.
- `src/routes/__root.tsx`: Shared document, metadata, stylesheet, and developer-tool composition.
- `src/routeTree.gen.ts`: Generated route connections and typed route maps.

**Testing:**
- Not detected: no test directory, test files, or test-runner configuration exists in the current repository.

## Naming Conventions

**Files:**
- Route modules use TanStack file-route names: `__root.tsx` for the root and `index.tsx` for the index route, as in `src/routes/`.
- TypeScript React modules use `.tsx`, as in `src/router.tsx` and `src/routes/index.tsx`.
- Generated router output uses the `.gen.ts` suffix, as in `src/routeTree.gen.ts`; treat this suffix as generated-only.
- Global stylesheet uses `styles.css` at `src/styles.css`.

**Directories:**
- Route nesting belongs under the lowercase `src/routes/` directory.
- Application source uses the lowercase `src/` directory.
- Planning artifacts use the dot-prefixed `.planning/codebase/` directory.

## Where to Add New Code

**New Feature:**
- Primary code: Add a page or layout route in `src/routes/`; extract feature-specific modules into a new directory under `src/` only when a route needs them.
- Tests: No existing test location is established. Introduce a project-level test convention before adding the first tests.

**New Component/Module:**
- Implementation: Place route-owned markup in the relevant `src/routes/<route>.tsx`; place shared modules in a purpose-named directory under `src/` once shared usage exists.

**Utilities:**
- Shared helpers: No utility directory exists. Add shared helpers under a new `src/` subdirectory with a purpose-specific name, and import them through the configured `@/*` or `#/*` aliases from `tsconfig.json` when appropriate.

## Special Directories

**`src/routes/`:**
- Purpose: Source of truth for the filesystem route hierarchy.
- Generated: No.
- Committed: Yes.

**`src/routeTree.gen.ts`:**
- Purpose: Generated TanStack Router route tree consumed by `src/router.tsx`.
- Generated: Yes.
- Committed: Yes; the file is present in the repository and excluded from Biome in `biome.json`.

**`.tanstack/`:**
- Purpose: TanStack Router tooling state.
- Generated: Yes.
- Committed: No; `.gitignore` excludes `.tanstack`.

**`.planning/codebase/`:**
- Purpose: Generated repository reference documents.
- Generated: Yes.
- Committed: Repository commit status is not determined by the active source configuration; do not infer it from the current files.

---

*Structure analysis: 2026-08-12*
