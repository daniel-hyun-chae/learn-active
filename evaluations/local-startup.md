# Local Startup Evaluations

## EVAL-PLATFORM-LOCAL-001: Smoke startup script

Goal: Provide a deterministic local smoke check that builds and verifies services without Docker.
Criteria:

- A `pnpm smoke:local` script exists and runs build + runtime checks.
- The smoke script verifies API health and web app responses.
- The smoke script verifies the learner landing page includes an API-backed status marker.
- The smoke script verifies the landing page serves style assets (stylesheet link or modulepreload asset).
- The API startup tolerates an unavailable local database by using seed-backed fallback data.

## EVAL-PLATFORM-LOCAL-002: Unified dev startup command

Goal: Provide a single dev-mode startup command with fail-hard DB setup and automated health checks.
Criteria:

- A `pnpm dev` script exists and is the primary local/devcontainer startup command.
- `pnpm dev` runs `setup:local` before starting the dev stack.
- `setup:local` waits for DB reachability and runs Supabase SQL migrations fail-hard.
- A `pnpm dev:stack` script exists and starts API + web dev servers with health checks.
- The dev stack script verifies the landing page serves its stylesheet.
- The dev stack script fails fast when critical runtime SSR middleware errors are emitted after initial health checks.
- The dev stack script does not run migrations directly.

## EVAL-PLATFORM-LOCAL-003: Setup verification preflight

Goal: Ensure verify:setup and smoke:local run with consistent pnpm dependencies.
Criteria:

- A `pnpm verify:setup` script exists.
- The verify script runs a pnpm preflight to clean mixed node_modules state.
- The smoke script runs the same pnpm preflight before building.
- The preflight verifies required tooling (turbo) is available or reinstalls.
- The preflight verifies build tools (tsc, vite) are available or reinstalls.
- On Windows, the preflight attempts permission repair before removal.
- The preflight retries pnpm install after removing .ignored artifacts.
- The preflight verifies package-level binaries (vite.js, tsc) are present.
- The preflight validates package executables via pnpm exec when module paths are missing.
- The preflight installs with --prod=false to ensure dev dependencies are present.
- The preflight can reinstall workspace packages when their binaries are missing.

## EVAL-PLATFORM-LOCAL-004: Supabase migration authority

Goal: Ensure Supabase SQL migrations are the only schema authority.
Criteria:

- The repository includes `supabase/config.toml` and `supabase/migrations/*`.
- A baseline migration exists and defines required schema objects (tables, indexes, constraints, enums, extensions).
- Runtime API startup does not execute schema-changing DDL.

## EVAL-PLATFORM-LOCAL-005: Route tree resolution

Goal: Ensure generated route tree imports resolve during dev.
Criteria:

- The verify script validates routeTree imports exist.
- Route tree import verification uses generated `./routes/*` imports without rewriting generated files.
- The verify script fails if the routes directory is missing.
- The verify script fails if imported route modules referenced by `routeTree.gen.ts` do not exist.

## EVAL-PLATFORM-LOCAL-006: Devcontainer database workflow

Goal: Provide a simple Supabase local database setup flow for development.
Criteria:

- The repository exposes `pnpm db:up`, `pnpm db:status`, and `pnpm db:logs` commands.
- The repository exposes `pnpm db:push` and `pnpm db:reset` commands.
- The database helper script uses Supabase CLI local workflow (`supabase start`, local status, local migration push/reset).
- `pnpm db:up` starts Supabase local services reliably in restricted/offline environments by excluding edge runtime by default, with a documented opt-in flag/env to include it.
- A destructive reset command exists and requires explicit confirmation (`--yes`).
- The README clearly documents Supabase local startup, migration application, and reset semantics.

## EVAL-PLATFORM-LOCAL-007: Fail-hard local DB setup

Goal: Ensure local dev setup has an explicit fail-hard migration step without blocking container startup.
Criteria:

- The repository exposes `pnpm setup:local`.
- `setup:local` waits for DB reachability and then runs Supabase migration push.
- `setup:local` fails when migrations fail.
- In devcontainer mode, setup logic normalizes localhost DB host usage to `host.docker.internal` for Supabase local connectivity.
- Devcontainer compose sets `DATABASE_URL` to the Supabase local Postgres endpoint.

## EVAL-PLATFORM-LOCAL-008: Browser runtime startup validation

Goal: Ensure local startup validation covers real browser behavior, not only HTTP-level checks.
Criteria:

- The repository exposes a `pnpm browser:check` script.
- Browser checks validate a real browser page load for `/learn`.
- Browser checks fail on hydration mismatch warnings or client runtime errors.
- Browser checks validate unknown routes render the global not-found experience.
- `pnpm smoke:local` runs the browser checks as part of startup validation.

## EVAL-PLATFORM-LOCAL-009: Devcontainer Playwright readiness

Goal: Ensure Playwright browser checks run in devcontainer without manual setup.
Criteria:

- Devcontainer post-create setup installs Playwright Chromium.
- Devcontainer config sets a deterministic Playwright browser cache path.
- Devcontainer mounts a persistent volume for Playwright browser binaries.
- Devcontainer image installs Chromium runtime dependencies required by Playwright.
- Devcontainer compose config provides shared memory sizing suitable for Chromium.
