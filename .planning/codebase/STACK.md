# Technology Stack & Dependencies

**Analysis Date:** 2026-08-18

---

## 1. Languages & Runtime Environment

- **Primary Language:** TypeScript (`~6.0.2` configured via `tsconfig.json`)
- **Runtime Environment:** Node.js (v22.x / v22.22.3 ESM `type: "module"`)
- **Package Manager:** `pnpm` (with `onlyBuiltDependencies: ["esbuild", "lightningcss"]`)
- **Module Resolution:** Bundler mode (`moduleResolution: "bundler"`, `module: "esnext"`, `target: "ES2022"`)
- **Path Aliases:** `#/*` mapped to `./src/*` in `package.json` and `tsconfig.json`

---

## 2. Core Frameworks & Libraries

### Web Application & Routing
- **Framework:** `@tanstack/react-start` (latest)
- **Routing Engine:** `@tanstack/react-router` (latest) with file-based routing and code generation (`tsr generate`, `routeTree.gen.ts`)
- **UI Library:** React 19 (`react: ^19.2.0`, `react-dom: ^19.2.0`)
- **Bundler / Dev Server:** Vite 8 (`vite: ^8.0.0`, `@vitejs/plugin-react: ^6.0.1`)
- **DevTools:** `@tanstack/react-devtools`, `@tanstack/react-router-devtools`, `@tanstack/devtools-vite`

### UI & Styling System
- **Styling Engine:** Tailwind CSS v4 (`tailwindcss: ^4.1.18`, `@tailwindcss/vite: ^4.1.18`)
- **Animations:** `tw-animate-css: ^1.4.0`
- **Headless UI Primitives:** `@base-ui/react: ^1.7.0`, `shadcn: ^4.17.0`
- **Utility Helpers:** `clsx: ^2.1.1`, `tailwind-merge: ^3.6.0`, `class-variance-authority: ^0.7.1`
- **Iconography:** `lucide-react: ^1.31.0`
- **Typography:** `@fontsource-variable/geist: ^5.3.0`
- **Theme Support:** Dark/Light class-based toggling with CSS variables in `src/styles.css`

### Database & ORM
- **Database Driver:** `pg: ^8.23.0` (PostgreSQL Client with Connection Pooling)
- **ORM:** Drizzle ORM (`drizzle-orm: ^0.45.2`, `drizzle-kit: ^0.31.10`)
- **Database Schema:** `src/db/schema.ts` with PostgreSQL dialects (`pgTable`, `uuid`, `timestamp`, `jsonb`, `boolean`, `integer`, `text`)
- **Migrations:** Automated programmatic runner `src/db/migrate.ts` + legacy migrator `src/db/migrate-legacy.ts`

### Authentication & Authorization
- **Auth Framework:** Better Auth (`better-auth: ^1.6.27`, `@better-auth/drizzle-adapter: ^1.6.27`)
- **Session Strategy:** Database-backed session tokens stored in `session` table
- **Two-Factor Authentication (2FA):** Better Auth TOTP two-factor plugin with QR code generation & backup codes in `two_factor` table
- **Role-Based Access Control (RBAC):** Hierarchical roles (`admin`, `operator`, `pimpinan`) enforced via `src/lib/auth.middleware.ts` and `src/lib/auth/role-helper.ts`

### Notification Gateways & Services
- **WhatsApp Gateway:** Fonnte HTTP API (`https://api.fonnte.com/send`) with Indonesian phone normalizer and mock console fallback
- **Email Gateway:** Resend HTTP API (`https://api.resend.com/emails`) with RFC 5322 validator, HTML templates, and mock console fallback
- **Orchestration:** Dual-channel asynchronous dispatcher in `src/lib/notifications/service.server.ts`

### Timezone & Date Calculations
- **Date Utilities:** `date-fns: ^4.4.0`
- **Timezone Management:** `date-fns-tz: ^3.2.0` (Enforces standard `Asia/Jakarta` / WIB for all operations)

### Schema & Payload Validation
- **Validation Engine:** `zod: ^4.4.3`

---

## 3. Tooling & Development Ecosystem

- **Linter & Formatter:** Biome (`@biomejs/biome: 2.4.5` configured in `biome.json`)
- **TypeScript Runner:** `tsx: ^4.23.12`
- **Test Runner:** Node.js native test runner (`node --test --import tsx`)
- **Containerization:** Docker (`Dockerfile`, `docker-compose.yml`, multi-stage Node build)
- **Production Server:** `prod-server.js` (Express-compatible static + TanStack Start handler bridge with compression)

---

## 4. Key Scripts & Commands

- `pnpm dev`: Start local Vite development server on port 3000
- `pnpm build`: Generate production client and server bundles
- `pnpm start`: Run database migrations and launch production server
- `pnpm test`: Execute complete test suite across auth, booking, assets, notifications, and db
- `pnpm db:generate`: Generate Drizzle SQL migration files
- `pnpm db:migrate`: Apply pending database migrations
- `pnpm db:migrate-legacy`: Ingest and convert legacy MySQL/PHP sarpras records
- `pnpm check`: Run Biome format and lint check

---

*Codebase tech stack analysis: 2026-08-18*
