# Directory Layout & Structure

**Analysis Date:** 2026-08-14

---

## 1. Project Directory Layout

```
sarpras/
├── .agents/                 # GSD core workflows, skills, and agent profiles
├── .planning/               # GSD project plans, roadmap, state, and codebase maps
│   └── codebase/            # Codebase mapping documents (STACK, ARCHITECTURE, etc.)
├── drizzle/                 # Drizzle schema migrations and SQL snapshots
├── legacy-data/             # Seed data and migration dumps from legacy PHP/MySQL
├── src/                     # Application source root
│   ├── components/          # Reusable React components
│   │   ├── admin/           # Admin dashboard, calendar, audit viewers, KPI widgets
│   │   ├── booking/         # Public booking wizard steps & review components
│   │   ├── public/          # Public header, footer, asset card, schedule modal
│   │   └── ui/              # Base UI primitives & button styling
│   ├── db/                  # Database connectivity, Drizzle schema, migrations & seed
│   │   ├── auth.server.ts   # Better Auth server initialization & Drizzle adapter
│   │   ├── client.server.ts # Drizzle ORM client & PostgreSQL pool connection
│   │   ├── migrate.ts       # Migration executor script
│   │   ├── migrate-legacy.ts# Legacy data migration & import script
│   │   ├── schema.ts        # Canonical Drizzle database schema & relations
│   │   └── seed-admin.ts    # Initial admin user seeding script
│   ├── lib/                 # Shared utilities, services, and server functions
│   │   ├── assets/          # Asset management server functions
│   │   ├── audit/           # Audit trail logging server functions & server logger
│   │   ├── auth/            # Auth server functions, RBAC helpers, role utilities
│   │   ├── auth-client.ts   # Better Auth client instance for browser UI
│   │   ├── auth.middleware.ts# Server function authentication & RBAC middleware
│   │   ├── booking/         # Booking domain engine, validation, availability & RPCs
│   │   ├── timezone/        # Date-fns timezone utilities (Asia/Jakarta)
│   │   ├── utils.ts         # Tailwind class merging utility (`cn`)
│   │   └── whatsapp/        # Fonnte WhatsApp client, phone normalizer, templates
│   ├── routes/              # TanStack Router file-based route tree
│   │   ├── __root.tsx       # Root document layout, HTML shell, and DevTools
│   │   ├── index.tsx        # Public landing page and asset catalog
│   │   ├── login.tsx        # Admin login & authentication page
│   │   ├── admin.tsx        # Authenticated admin layout shell & navigation
│   │   ├── admin/           # Admin sub-routes
│   │   │   ├── index.tsx    # Dashboard overview with KPI summary cards & urgent widget
│   │   │   ├── assets.tsx   # Asset inventory, operating hours, & closures management
│   │   │   ├── bookings.tsx # Booking approval management with filter bar & review drawer
│   │   │   ├── calendar.tsx # Master visual calendar view with interactive popovers
│   │   │   ├── users.tsx    # User account management, roles, and status controls
│   │   │   └── audit.tsx    # Comprehensive audit log browser with diff viewer
│   │   ├── book/            # Public booking workflow
│   │   │   └── $assetId.tsx # Multi-step booking wizard for selected facility
│   │   ├── status/          # Public booking lookup & verification
│   │   │   ├── index.tsx    # Search form for tracking booking by code/reference
│   │   │   └── $ref.tsx     # Booking detail view & status timeline
│   │   └── api/             # API routes
│   │       └── auth/        # Better Auth catch-all API endpoint
│   │           └── $.ts     # `/api/auth/*` handler bridge
│   ├── routeTree.gen.ts     # Auto-generated TanStack Router route tree
│   ├── router.tsx           # Router factory function (`createRouter`)
│   └── styles.css           # Global stylesheet with Tailwind v4 & custom utilities
├── Dockerfile               # Production multi-stage Docker build configuration
├── docker-compose.yml       # Docker Compose setup for local containerized environment
├── drizzle.config.ts        # Drizzle Kit CLI configuration
├── package.json             # Package configuration, scripts, and dependencies
├── prod-server.js           # Production Node.js server wrapper
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration with TanStack Start plugin
```

---

## 2. Key File Conventions

- **Server-Only Files (`*.server.ts`):** Files containing direct database connections, secret keys, or Node-specific logic (e.g. `client.server.ts`, `service.server.ts`). These files are tree-shaken and excluded from client bundles.
- **Server Functions (`*.functions.ts`):** Files exposing RPC endpoints using `createServerFn`.
- **Test Files (`*.test.ts`):** Co-located or domain-grouped test suites run with Node native test runner and `tsx`.
- **Routes (`src/routes/**/*.tsx`):** File-based routes matching TanStack Router naming conventions:
  - `__root.tsx`: Document root.
  - `index.tsx`: Index route for a directory segment.
  - `$param.tsx`: Dynamic route parameters (e.g. `$assetId.tsx`, `$ref.tsx`).
  - `$.ts`: Splat / catch-all routes.

---

*Codebase directory layout and structure analysis: 2026-08-14*
