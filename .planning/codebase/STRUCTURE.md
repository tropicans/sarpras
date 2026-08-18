# Project Directory Structure & Organization

**Analysis Date:** 2026-08-18

---

## 1. Directory Tree Overview

```
sarpras/
├── .planning/                  # GSD Project planning, roadmaps, and codebase maps
│   ├── codebase/               # 7 Codebase map documents (STACK, ARCHITECTURE, etc.)
│   ├── phases/                 # Milestone phase tracking and research notes
│   ├── PROJECT.md              # Project goals and core requirements
│   ├── REQUIREMENTS.md         # Requirements matrix
│   ├── ROADMAP.md              # Milestones and phases roadmap
│   └── STATE.md                # GSD execution state
├── legacy-data/                # Legacy JSON exports (assets, bookings, users)
├── public/                     # Static assets, logos, and uploaded files
│   └── uploads/                # Letter/document attachments
├── src/                        # Primary TypeScript application source
│   ├── components/             # Reusable UI React components
│   │   ├── admin/              # Admin console components (drawers, tables, modals)
│   │   ├── booking/            # Booking wizard steps and forms
│   │   ├── public/             # Public landing page sections & widgets
│   │   └── ui/                 # Base UI primitives (buttons, theme toggles)
│   ├── db/                     # Drizzle ORM schema, client, migrations, and seeds
│   │   ├── auth.server.ts      # Better Auth server instance
│   │   ├── client.server.ts    # PG Pool connection manager
│   │   ├── migrate.ts          # Migration execution script
│   │   ├── migrate-legacy.ts   # Legacy JSON data ingestion
│   │   └── schema.ts           # Drizzle table definitions & relations
│   ├── lib/                    # Domain modules, services, and server functions
│   │   ├── assets/             # Asset management fns & facility helpers
│   │   ├── audit/              # Audit logging fns & server service
│   │   ├── auth/               # Auth client, fns, RBAC helpers
│   │   ├── booking/            # Booking engine, validation, fns, dormitory math
│   │   ├── email/              # Resend email service & templates
│   │   ├── notifications/      # Unified multi-channel notification orchestrator
│   │   ├── timezone/           # Timezone & date utilities
│   │   ├── whatsapp/           # Fonnte WhatsApp service & templates
│   │   ├── auth.middleware.ts  # TanStack Start session & role middlewares
│   │   └── utils.ts            # Class merging and formatting utilities
│   ├── routes/                 # File-based TanStack Router routes
│   │   ├── __root.tsx          # Root document shell with DevTools & styles
│   │   ├── index.tsx           # Public homepage / asset browser
│   │   ├── login.tsx           # Admin / operator login page
│   │   ├── two-factor.tsx      # TOTP 2FA verification challenge route
│   │   ├── check-booking.tsx   # Public booking reference lookup
│   │   ├── admin.tsx           # Admin layout wrapper with sidebar
│   │   ├── admin/              # Admin pages (index, assets, bookings, calendar, users, audit)
│   │   ├── book/               # Booking flow routes ($assetId.tsx)
│   │   ├── status/             # Booking tracking routes ($ref.tsx)
│   │   └── api/                # API handler routes (auth endpoints)
│   ├── types/                  # Ambient TypeScript type declarations
│   ├── routeTree.gen.ts        # Auto-generated TanStack route tree
│   ├── router.tsx              # Router instantiation factory
│   └── styles.css              # Global Tailwind v4 styles and CSS variables
├── Dockerfile                  # Production container definition
├── docker-compose.yml          # Container composition for local/prod deployment
├── package.json                # Project dependencies and script runner
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite 8 & TanStack Start build configuration
```

---

## 2. Key File Conventions

- `*.server.ts`: Server-only implementation files (never bundled into client code).
- `*.functions.ts`: TanStack Start RPC server functions created via `createServerFn`.
- `*.test.ts`: Automated tests executable with `node --test --import tsx`.
- `*.tsx`: React UI route or presentation component.
- `routeTree.gen.ts`: Managed automatically by TanStack Router CLI (`tsr generate`).

---

*Codebase directory structure analysis: 2026-08-18*
