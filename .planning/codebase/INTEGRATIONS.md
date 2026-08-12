# External Integrations

**Analysis Date:** 2026-08-12

## APIs & External Services

**Application APIs:**
- Not detected - application source in `src/` contains no outbound HTTP client, API SDK, server function, or API route implementation.
  - SDK/Client: Not detected in `package.json` or `src/`.
  - Auth: Not applicable; no application API integration is implemented in `src/`.

**Developer tooling:**
- TanStack Devtools - Development-time inspection is enabled by `devtools()` in `vite.config.ts` and rendered with `TanStackDevtools` in `src/routes/__root.tsx`.
  - SDK/Client: `@tanstack/devtools-vite`, `@tanstack/react-devtools`, and `@tanstack/react-router-devtools` from `package.json`.
  - Auth: Not applicable; no credentials or environment variables are referenced by `vite.config.ts` or `src/routes/__root.tsx`.

## Data Storage

**Databases:**
- Not detected - `package.json` and application source under `src/` contain no database provider, connection configuration, ORM, or client.
  - Connection: Not applicable.
  - Client: Not detected.

**File Storage:**
- Local application source only - no external file-storage SDK or storage calls are present in `package.json` or `src/`.

**Caching:**
- Not detected - no cache provider or client is configured in `package.json` or `src/`.

## Authentication & Identity

**Auth Provider:**
- Not detected - no identity provider, authentication library, middleware, or session handling is implemented in `package.json` or `src/`.
  - Implementation: Not applicable.

## Monitoring & Observability

**Error Tracking:**
- None detected - no error-tracking SDK appears in `package.json` or `src/`.

**Logs:**
- No application logging integration is implemented in `src/`; Vite and TanStack Devtools tooling are configured in `vite.config.ts`.

## CI/CD & Deployment

**Hosting:**
- Not specified - no hosting adapter or platform configuration exists in `package.json`, `vite.config.ts`, or `README.md`.

**CI Pipeline:**
- None detected - no workflow configuration is present in the repository root or `.github/`.

## Environment Configuration

**Required env vars:**
- None detected - no environment-variable references occur in `src/`, `package.json`, or `vite.config.ts`.

**Secrets location:**
- No secrets location is configured. `.gitignore` designates `.env` as an ignored environment configuration filename; no such file is present at the repository root.

## Webhooks & Callbacks

**Incoming:**
- None detected - no webhook endpoint or server route is implemented under `src/routes/`.

**Outgoing:**
- None detected - no webhook client or outbound callback implementation is present under `src/`.

---

*Integration audit: 2026-08-12*
