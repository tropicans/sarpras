# Codebase Structure

**Analysis Date:** 2026-08-18

## Directory Layout

```
sarpras/
├── .agents/                 # GSD core workflows, skills, templates, and agent definitions
├── .planning/               # Project roadmap, state tracking, milestones, and codebase maps
│   └── codebase/            # 7 structured codebase mapping documents
├── docs/                    # Technical documentation, architectural specs, API references
├── drizzle/                 # Generated Drizzle SQL migration files
├── public/                  # Static assets and uploaded attachments
│   └── uploads/             # User-uploaded booking request letters
├── scripts/                 # Maintenance and PDF report generation utilities
├── src/                     # Core application source code
│   ├── components/          # Reusable React UI components
│   │   ├── admin/           # Admin dashboard widgets, calendar, tables, modals
│   │   ├── booking/         # Public booking wizard steps and review forms
│   │   ├── public/          # Public landing page sections, hero console, header/footer
│   │   └── ui/              # Base UI primitives (buttons, theme toggle)
│   ├── db/                  # PostgreSQL schema, Drizzle client, migrations, and seeders
│   ├── lib/                 # Core domain services, server functions, and business logic
│   │   ├── assets/          # Asset management functions and facility definitions
│   │   ├── audit/           # Audit trail logging engine and admin queries
│   │   ├── auth/            # Better Auth server functions, RBAC helpers, 2FA utilities
│   │   ├── booking/         # Booking domain engine, state machine, server functions
│   │   ├── email/           # Email service (Resend) and HTML templates
│   │   ├── notifications/   # Notification dispatcher service (WhatsApp + Email)
│   │   ├── timezone/        # Date-fns timezone utilities (Asia/Jakarta WIB)
│   │   └── whatsapp/        # WhatsApp gateway client (Fonnte) and message templates
│   ├── routes/              # TanStack Router file-based route definitions
│   │   ├── admin/           # Admin portal routes (bookings, calendar, assets, users, audit)
│   │   ├── api/             # API routes (Better Auth catch-all)
│   │   ├── book/            # Booking wizard route ($assetId)
│   │   └── status/          # Public booking tracking routes ($ref)
│   ├── types/               # Global TypeScript type augmentations
│   ├── routeTree.gen.ts     # Auto-generated TanStack Router route tree
│   ├── router.tsx           # Router instance factory
│   └── styles.css           # Global Tailwind CSS and theme design tokens
├── Dockerfile               # Production container image definition
├── docker-compose.yml       # Production/local Docker orchestration (App + Postgres)
├── package.json             # Root dependency and script manifest
├── prod-server.js           # Production HTTP server bridging TanStack Start SSR
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration
```

## Directory Purposes

**`src/components/`:**
- Purpose: React UI components divided by domain context.
- Contains:
  - `admin/`: Admin components (`admin-calendar-view.tsx`, `booking-review-drawer.tsx`, `audit-table.tsx`, `two-factor-setup-modal.tsx`, `kpi-card.tsx`).
  - `booking/`: Multi-step booking wizard (`schedule-step.tsx`, `requester-step.tsx`, `review-step.tsx`, `success-card.tsx`).
  - `public/`: Landing page showcase (`hero-console.tsx`, `bento-showcase.tsx`, `asset-card.tsx`, `public-header.tsx`, `public-footer.tsx`).
  - `ui/`: Design system primitives (`button.tsx`, `theme-toggle.tsx`).

**`src/db/`:**
- Purpose: Database configuration, Drizzle ORM schemas, migration runners, and initial seeders.
- Key files:
  - `schema.ts`: Drizzle PostgreSQL table definitions and relations.
  - `client.server.ts`: PostgreSQL connection pool setup.
  - `auth.server.ts`: Better Auth instance configuration.
  - `migrate.ts`: Schema migration runner.
  - `migrate-legacy.ts`: Legacy MySQL/PHP data migration script.
  - `seed-admin.ts`: Initial administrator account seeder.

**`src/lib/`:**
- Purpose: Domain services, server functions, validation schemas, and external integrations.
- Key subdirectories:
  - `booking/`: Booking logic (`service.server.ts`), state machine (`state-machine.ts`), server functions (`public-fns.functions.ts`, `admin-fns.functions.ts`).
  - `notifications/`: Dual-channel dispatcher (`service.server.ts`).
  - `whatsapp/`: Fonnte client (`service.server.ts`), templates (`templates.ts`), phone parser (`phone.ts`).
  - `email/`: Resend client (`service.server.ts`), HTML templates (`templates.ts`).
  - `audit/`: Audit logging (`audit.server.ts`).
  - `timezone/`: WIB timezone helpers (`datetime.ts`).
  - `auth/`: RBAC helper (`role-helper.ts`), auth server functions (`auth.functions.ts`).

**`src/routes/`:**
- Purpose: TanStack Router file-based routes for all pages and APIs.
- Key files:
  - `__root.tsx`: Root HTML layout, theme provider, font configuration.
  - `index.tsx`: Public landing page showcasing facility status and quick booking.
  - `login.tsx` & `two-factor.tsx`: Authentication and 2FA verification pages.
  - `admin.tsx`: Admin layout with sidebar navigation, session guard, and theme toggle.
  - `admin/bookings.tsx`: Booking review and management table.
  - `admin/calendar.tsx`: Monthly/weekly reservation calendar.
  - `admin/assets.tsx`: Facility catalog and availability editor.
  - `admin/users.tsx`: User management and role assignment.
  - `admin/audit.tsx`: Audit trail log table and metadata viewer.
  - `book/$assetId.tsx`: Interactive booking wizard for specific facilities.
  - `status/$ref.tsx`: Public reservation tracker by tracking reference code.

**`docs/`:**
- Purpose: Comprehensive system documentation, architectural guides, user manuals, and API specs.

## Key File Locations

**Entry Points:**
- Development: `vite dev` via `vite.config.ts`
- Client / SSR Factory: `src/router.tsx`, `src/routes/__root.tsx`
- Production Server: `prod-server.js`
- Auth API Endpoint: `src/routes/api/auth/$.ts`

**Configuration:**
- `package.json`: Dependencies, scripts, package management
- `tsconfig.json`: TypeScript compiler options and `#/*` alias
- `vite.config.ts`: Vite bundling, TanStack plugins, Tailwind
- `drizzle.config.ts`: Drizzle ORM database connection and migration schema path
- `biome.json`: Linter and code formatting rules
- `.env.example`: Template for environment variables

**Testing:**
- Unit & Integration Tests: Co-located in `src/lib/**/*.test.ts` and `src/db/*.test.ts`

## Naming Conventions

**Files:**
- React Components: `kebab-case.tsx` (e.g., `booking-review-drawer.tsx`, `hero-console.tsx`)
- Server-Only Modules: `*.server.ts` (e.g., `service.server.ts`, `auth.server.ts`, `audit.server.ts`)
- Server Functions (RPC): `*.functions.ts` (e.g., `public-fns.functions.ts`, `admin-fns.functions.ts`)
- Test Files: `*.test.ts` (e.g., `booking.test.ts`, `service.test.ts`, `rbac.test.ts`)
- Route Files: `kebab-case.tsx` or `$param.tsx` for dynamic segments (e.g., `$assetId.tsx`, `$ref.tsx`)

**Directories:**
- Feature / Domain Folders: `kebab-case` (e.g., `src/lib/whatsapp/`, `src/components/admin/`)

## Where to Add New Code

**New Feature / Domain Module:**
- Core Domain Logic: Create `src/lib/<domain>/service.server.ts`
- Server Functions: Create `src/lib/<domain>/<domain>.functions.ts`
- Types: Create `src/lib/<domain>/types.ts`
- Tests: Create `src/lib/<domain>/<domain>.test.ts`

**New UI Components:**
- Public Components: `src/components/public/<component-name>.tsx`
- Admin Components: `src/components/admin/<component-name>.tsx`
- Shared / Base Primitives: `src/components/ui/<primitive-name>.tsx`

**New Route:**
- Public Page: `src/routes/<path>.tsx`
- Admin Page: `src/routes/admin/<path>.tsx`
- API Handler: `src/routes/api/<endpoint>.ts`
- Note: Run `pnpm generate-routes` (or start dev server) to regenerate `src/routeTree.gen.ts`.

---

*Structure analysis: 2026-08-18*
*Update after directory reorganizations*
