# Technology Stack

**Analysis Date:** 2026-08-12

## Languages

**Primary:**
- TypeScript 6.0.3 - Application routes, router setup, and Vite configuration in `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/router.tsx`, and `vite.config.ts`.

**Secondary:**
- TSX / React JSX - UI components in `src/routes/__root.tsx` and `src/routes/index.tsx`.
- CSS - Global styles and Tailwind import in `src/styles.css`.
- JSON - Package, TypeScript, Router CLI, and Biome configuration in `package.json`, `tsconfig.json`, `tsr.config.json`, and `biome.json`.

## Runtime

**Environment:**
- Node.js - Required by the npm scripts in `package.json`; no engine version is pinned in `package.json`.

**Package Manager:**
- npm - Script runner and dependency installer documented in `package.json` and `README.md`.
- Lockfile: present (`package-lock.json`).

## Frameworks

**Core:**
- TanStack Start 1.168.42 - Full-stack React application framework, registered by `tanstackStart()` in `vite.config.ts`.
- React 19.2.8 and React DOM 19.2.8 - Component rendering in `src/routes/__root.tsx` and `src/routes/index.tsx`.
- TanStack Router 1.170.25 - File-based route definitions and router setup in `src/routes/__root.tsx`, `src/routes/index.tsx`, and `src/router.tsx`.
- Tailwind CSS 4.3.3 - Utility-first styling imported by `src/styles.css` and compiled through `vite.config.ts`.

**Testing:**
- Not detected - `package.json` contains no test script or test-runner dependency.

**Build/Dev:**
- Vite 8.2.1 - Development server, production build, and preview commands in `package.json`; configured in `vite.config.ts`.
- @vitejs/plugin-react 6.0.5 - React transform integration in `vite.config.ts`.
- @tanstack/router-cli 1.167.27 - Route-tree generation through the `generate-routes` script in `package.json` and target configuration in `tsr.config.json`.
- @tanstack/devtools-vite 0.8.3 - TanStack developer-tooling Vite plugin registered in `vite.config.ts`.
- Biome 2.4.5 - Formatting, linting, and checks configured in `biome.json` and exposed by `package.json` scripts.

## Key Dependencies

**Critical:**
- @tanstack/react-start 1.168.42 - Provides the Start Vite plugin used to build and run the application from `vite.config.ts`.
- @tanstack/react-router 1.170.25 - Defines routes and router behavior in `src/routes/__root.tsx`, `src/routes/index.tsx`, and `src/router.tsx`.
- react 19.2.8 / react-dom 19.2.8 - Render the route components in `src/routes/__root.tsx` and `src/routes/index.tsx`.
- tailwindcss 4.3.3 / @tailwindcss/vite 4.3.3 - Process the Tailwind import in `src/styles.css` through `vite.config.ts`.

**Infrastructure:**
- @tanstack/react-devtools 0.10.10 and @tanstack/react-router-devtools 1.167.1 - Render in-app router inspection from `src/routes/__root.tsx`.
- typescript 6.0.3 and @types/node 22.20.1 - Type checking for sources included by `tsconfig.json`.
- @biomejs/biome 2.4.5 - Static analysis and formatting for paths selected by `biome.json`.

## Configuration

**Environment:**
- No environment files are present at the repository root; `.gitignore` reserves `.env` for environment configuration.
- No runtime environment-variable access is implemented in application source under `src/`.

**Build:**
- `vite.config.ts` configures TanStack Devtools, Tailwind, TanStack Start, and React plugins.
- `tsconfig.json` enables strict TypeScript, bundler resolution, ES2022 targets, and `#/*` / `@/*` source aliases.
- `tsr.config.json` sets React as the generated-router target; generated output is `src/routeTree.gen.ts`.
- `biome.json` configures formatting and recommended lint rules.

## Platform Requirements

**Development:**
- Node.js with npm is required to install `package-lock.json` dependencies and run `npm run dev` from `package.json`.
- A modern browser is required to render React DOM and Tailwind output from `src/routes/__root.tsx` and `src/styles.css`.

**Production:**
- Deployment target is not specified in `package.json`, `vite.config.ts`, or `README.md`; the production artifact is built with `npm run build` in `package.json`.

---

*Stack analysis: 2026-08-12*
