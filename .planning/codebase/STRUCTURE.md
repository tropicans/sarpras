# Codebase Structure

**Analysis Date:** 2026-08-12

## Directory Layout

```
[project-root]/
├── .agents/          # Developer AI GSD skills and configs
├── .vscode/          # Editor workspace integration configurations
├── src/              # Source code of the application
│   ├── routes/       # File-based routes for pages and templates
│   │   ├── __root.tsx # Root shell component structure
│   │   └── index.tsx # Main home page component
│   ├── routeTree.gen.ts # Router generated module mappings
│   ├── router.tsx    # TanStack router setup factory
│   └── styles.css    # Tailwind CSS layout variables
├── AGENTS.md         # Instructions and directives for GSD workflows
├── biome.json        # Linter and formatter configurations
├── package-lock.json # Package manager lockfile
├── package.json      # Package configuration and dependencies
├── tsconfig.json     # Compiler compiler config
├── tsr.config.json   # TanStack Router tool config
└── vite.config.ts    # Bundler and compile setup
```

## Directory Purposes

**.agents/:**
- Purpose: Context and execution rules for developer AI pipelines.
- Contains: Frontmatter templates, workspace hooks, skill manifest files, and GSD scripts.

**.vscode/:**
- Purpose: Developer environment workspace preferences.
- Contains: Code actions (on save triggers for Biome formatting).

**src/:**
- Purpose: Main application scripts folder.
- Contains: Views, styles, routes, configurations, and general asset trees.

**src/routes/:**
- Purpose: File system routing folder.
- Contains: Files matching path routing segments. File names start with `__` for layouts/configs, and custom names for routes.

## Key File Locations

**Entry Points:**
- `src/routes/__root.tsx`: Top-level document shell.
- `src/router.tsx`: Factory setup and client registration hooks.

**Configuration:**
- `vite.config.ts`: Vite bundling and Tailwind compile configuration.
- `tsconfig.json`: TypeScript configurations and path resolutions.
- `biome.json`: Biome styles, linters, and format configs.
- `tsr.config.json`: TanStack Router options.

**Core Logic:**
- `src/routes/index.tsx`: Homepage routing view.
- `src/routeTree.gen.ts`: Statically compiled schema of route trees.

**Testing:**
- None configured.

## Naming Conventions

**Files:**
- Components / Routes: PascalCase/lowercase (e.g. `index.tsx`, `__root.tsx`).
- General configs: lowercase / kebab-case (e.g. `vite.config.ts`).

**Directories:**
- Plural lower-case folders (e.g. `routes`).

**Special Patterns:**
- `__root.tsx`: Special root identifier layout file.
- `*.gen.ts`: Auto-generated compiler files (do not edit manually).

## Where to Add New Code

**New Feature / Route:**
- Create a corresponding `.tsx` file or subdirectory inside `src/routes/` matching the requested URL.

**New Shared Components:**
- Create a new directory `src/components/` and write reusable UI blocks inside.

**Global Styles / Assets:**
- Add CSS properties directly into `src/styles.css` or assets under `src/assets/`.

---

*Structure analysis: 2026-08-12*
*Update when modifying top-level directories or adding codebase areas*
