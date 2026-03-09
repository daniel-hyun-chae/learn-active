# Learning Platform Monorepo

This repo contains the web app (learn + publish), learners mobile app, GraphQL API, and shared packages.

## Dev container (recommended)

Use this as the default workflow.

1. Open the repo in VS Code.
2. Choose **Reopen in Container**.
3. Start Supabase local services:

```
pnpm db:up
```

`pnpm db:up` excludes Supabase edge runtime by default to keep startup reliable in offline or TLS-inspected environments. Include it when needed with:

```
pnpm db:up -- --with-edge-runtime
```

4. Run development startup:

```
pnpm dev
```

`pnpm dev` is the single startup command for development. It:

- waits for database readiness,
- applies Supabase SQL migrations (fail-hard),
- starts API + web dev servers,
- verifies health before reporting success.

## Database Workflow (Supabase)

Schema source of truth is `supabase/migrations/*`.

Common commands:

```
pnpm db:up
pnpm db:status
pnpm db:logs
pnpm db:push
pnpm db:reset -- --yes
```

Recommended local flow:

1. `pnpm db:up`
2. `pnpm db:reset -- --yes` (or `pnpm db:push` for non-destructive apply)
3. `pnpm dev`

## Production Database

- Production uses Supabase-managed PostgreSQL.
- Store real production credentials only in deployment/platform secret storage.
- Do not commit `.env.production`.

## What Is Required on Host

For dev mode in devcontainer, you do not need host Node or pnpm.

Required on host:

- Docker / compatible container runtime
- VS Code + Dev Containers extension

## Verification

Run these checks to verify app behavior and startup reliability:

```
pnpm verify:setup
pnpm browser:check
pnpm smoke:local
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

## Development Commands

- `pnpm dev` - recommended full dev startup (setup + migrate + run + health checks)
- `pnpm dev:stack` - start API + web dev servers with health checks (used by `pnpm dev`)
- `pnpm setup:local` - fail-hard DB wait + migration step (used by `pnpm dev`)
- `pnpm dev:apps` - raw Turbo parallel app dev tasks (no DB bootstrap)

Run specific apps:

```
pnpm --filter @app/web dev
pnpm --filter @app/api dev:worker
pnpm --filter @app/learners-mobile start
```

## URLs and Ports

- Web app (learn + publish): http://localhost:4100
- GraphQL API: http://localhost:4000/graphql

## Cloudflare Compatibility Workflow (Local-First)

- API local runtime uses Wrangler Worker emulation:

```
pnpm --filter @app/api dev:worker
```

- Web local static preview (Cloudflare Pages-compatible output):

```
pnpm --filter @app/web build
pnpm --filter @app/web preview -- --port 4100 --host 0.0.0.0
```

- Cloudflare deployment-ready commands (for local verification/manual fallback):

```
pnpm --filter @app/api deploy:worker
pnpm --filter @app/web deploy:pages
```

- CI/CD release flow (PR validation, staging auto deploy, production manual deploy, rollback) is documented in:

```
docs/ci-cd.md
```

## React Native -> Local API Validation

For local development, point Expo/mobile to the local Wrangler API endpoint:

- `EXPO_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql`

`pnpm smoke:local` validates this endpoint against local GraphQL health as part of local startup readiness.

## Authentication (Supabase, local-first)

This phase introduces identity/authentication foundations only.

Supported sign-in methods in v1:

- Google OAuth
- Magic link

Not enabled in v1:

- Email/password login

### Local auth setup

1. Start local Supabase services:

```
pnpm db:up
```

2. Set local auth env values in `.env.local` from local Supabase status output:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

3. For browser/mobile clients, provide aliases as needed:

- Web: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Mobile: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

4. Google OAuth local provider wiring uses placeholders only:

- `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`
- `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`

If Google provider setup cannot be fully automated locally, Google initiation paths are still implemented and can be validated up to provider redirect.

### Session and API behavior

- Web/mobile bootstrap and restore session state from Supabase Auth.
- Clients send bearer access tokens to the API for protected operations.
- API verifies bearer tokens against Supabase JWKS and exposes `request.user.id` on authenticated requests.
- Course GraphQL operations are protected and reject unauthenticated requests.

### Local auth testing notes

- Magic-link flow can be exercised against local Supabase.
- Google OAuth requires local provider credentials and redirect setup; keep credentials in local secret storage only.
- Production Supabase secrets are not required for local implementation/testing.

## Environment Variables

- `DATABASE_URL` (local default: `postgresql://postgres:postgres@localhost:54322/postgres`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL` (web runtime alias)
- `VITE_SUPABASE_ANON_KEY` (web runtime alias)
- `EXPO_PUBLIC_SUPABASE_URL` (mobile runtime alias)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (mobile runtime alias)
- `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` (local/provider setup)
- `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` (local/provider setup)
- `GRAPHQL_ENDPOINT` (server-side GraphQL endpoint for web apps)
- `VITE_GRAPHQL_ENDPOINT` (client-side GraphQL endpoint for web apps)
- `EXPO_PUBLIC_GRAPHQL_ENDPOINT` (mobile GraphQL endpoint for Expo)
- `APP_ENV` (runtime stage selector: local/staging/production)
- `API_AUTH_BYPASS_FOR_E2E` (local test-only auth bypass flag)

Do not commit real secrets. Use:

- `.env.example` as template
- `.env.local` for local/private values

## OpenCode in Devcontainer

OpenCode is installed in the devcontainer:

```
opencode
```

## Docker Startup (Production-Style)

```
pnpm setup
pnpm verify:startup
docker compose build --no-cache
docker compose up
```

## Repo Layout

```
apps/
  web/
  learners-mobile/
  api/
shared/
  shared-ui/
  shared-tokens/
  shared-i18n/
  shared-utils/
  shared-config/
  shared-graphql/
```
