# Technology Stack

**Analysis Date:** 2026-08-18

## Languages

**Primary:**
- TypeScript ~6.0.2 (`tsconfig.json`) - All application code, server functions, route definitions, schemas, and tests

**Secondary:**
- JavaScript (Node.js ESM) - Production server runtime (`prod-server.js`), build configs
- CSS (Tailwind CSS v4) - Global styling, theme variables, UI tokens (`src/styles.css`)
- Python 3.x - Standalone reporting scripts (`scripts/generate_report_pdf.py`)

## Runtime

**Environment:**
- Node.js v22.x (ESM `type: "module"`)
- Target: ES2022 (`tsconfig.json`)
- Module Resolution: Bundler (`tsconfig.json`)

**Package Manager:**
- pnpm (with `onlyBuiltDependencies: ["esbuild", "lightningcss"]`)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- `@tanstack/react-start` (latest) - Full-stack React framework with SSR and RPC server functions
- `@tanstack/react-router` (latest) - Type-safe routing engine with file-based route tree generation (`tsr generate`)
- React 19 (`react: ^19.2.0`, `react-dom: ^19.2.0`) - UI component library

**Testing:**
- Node.js Native Test Runner (`node --test --import tsx`) - Unit, integration, and regression test suite
- `tsx: ^4.23.12` - Runtime TypeScript execution and ESM loader

**Build/Dev:**
- Vite 8 (`vite: ^8.0.0`, `@vitejs/plugin-react: ^6.0.1`) - Bundler and dev server
- `@tanstack/devtools-vite`, `@tanstack/react-devtools`, `@tanstack/react-router-devtools` - TanStack development instrumentation
- `@biomejs/biome: 2.4.5` - Linter and code formatter

## Key Dependencies

**Critical:**
- `better-auth: ^1.6.27` & `@better-auth/drizzle-adapter: ^1.6.27` - Authentication engine with session handling, TOTP 2FA, and RBAC
- `drizzle-orm: ^0.45.2` & `drizzle-kit: ^0.31.10` - Type-safe SQL ORM and schema migration manager
- `pg: ^8.23.0` & `@types/pg: ^8.21.0` - PostgreSQL connection client with connection pooling
- `zod: ^4.4.3` - Runtime schema validation for forms, APIs, and environment variables
- `date-fns: ^4.4.0` & `date-fns-tz: ^3.2.0` - Date manipulation and strict timezone handling (`Asia/Jakarta` / WIB)

**Infrastructure & UI:**
- `tailwindcss: ^4.1.18` & `@tailwindcss/vite: ^4.1.18` - Utility-first styling engine
- `@base-ui/react: ^1.7.0` & `shadcn: ^4.17.0` - Headless component primitives
- `lucide-react: ^1.31.0` - Icon system
- `clsx: ^2.1.1`, `tailwind-merge: ^3.6.0`, `class-variance-authority: ^0.7.1` - Dynamic styling and variant management
- `@fontsource-variable/geist: ^5.3.0` - Typography system

## Configuration

**Environment:**
- Configured via `.env` file (loaded with `dotenv`) and container environment variables
- Key variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_BASE_URL`, `FONNTE_API_TOKEN`, `FONNTE_ADMIN_TARGET`, `FONNTE_MOCK`, `RESEND_API_KEY`, `RESEND_MOCK`, `EMAIL_FROM`, `ADMIN_DEFAULT_EMAIL`

**Build:**
- `vite.config.ts` - Vite bundler configuration with TanStack Start, React, Tailwind, and DevTools plugins
- `tsconfig.json` - TypeScript configuration with path alias `#/* -> ./src/*`
- `drizzle.config.ts` - Drizzle Kit migration and PostgreSQL connection settings
- `biome.json` - Biome formatter and linter rule configuration

## Platform Requirements

**Development:**
- Cross-platform: Windows, macOS, Linux with Node.js 22+ and pnpm
- Local PostgreSQL instance or Docker container (`docker-compose.yml`)

**Production:**
- Multi-stage Docker container (`Dockerfile` based on `node:22-alpine` and `postgres:16-alpine`)
- Node.js runtime executing `prod-server.js` with static asset serving and TanStack Start fetch handler

---

*Stack analysis: 2026-08-18*
*Update after major dependency changes*
