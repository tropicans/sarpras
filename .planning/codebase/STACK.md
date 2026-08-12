# Technology Stack

**Analysis Date:** 2026-08-12

## Languages

**Primary:**
- TypeScript 6.0.2 - All application code

**Secondary:**
- JavaScript - Configuration files (e.g., `vite.config.ts`, `biome.json`)

## Runtime

**Environment:**
- Node.js (via npm runner/Vite bundling)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.0 - UI library
- @tanstack/react-start (latest) - Full-stack framework (SSR, routing, server functions)
- @tanstack/react-router (latest) - File-based routing engine

**Testing:**
- None configured

**Build/Dev:**
- Vite 8.x - Bundler and development server
- @tailwindcss/vite 4.x - Tailwind compiler plugin for Vite
- @tanstack/devtools-vite (latest) - Devtools bundling integration
- @tanstack/router-cli (latest) - Route generation tool (`tsr generate`)
- @biomejs/biome 2.4.5 - Linter and formatter

## Key Dependencies

**Critical:**
- `react` ^19.2.0 - Core rendering library
- `@tanstack/react-start` latest - Full-stack runtime orchestrator
- `@tanstack/react-router` latest - Routing and navigation core
- `tailwindcss` ^4.1.18 - Utility-first styling framework

**Infrastructure:**
- `@tanstack/react-devtools` latest - Core React devtools integration
- `@tanstack/react-router-devtools` latest - Route visualizer tool

## Configuration

**Environment:**
- No environment variables currently defined.

**Build:**
- `vite.config.ts` - Vite bundler and plugin assembly
- `tsconfig.json` - TypeScript compiler and import paths
- `tsr.config.json` - TanStack Router target definition
- `biome.json` - Linting, formatting rules, and VCS integration

## Platform Requirements

**Development:**
- Cross-platform (Windows, macOS, Linux) with Node.js and npm installed.

**Production:**
- Node.js environment supporting SSR or static hosts (Vercel, Cloudflare, etc.).

---

*Stack analysis: 2026-08-12*
*Update after major dependency changes*
