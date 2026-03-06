# Local Startup Evaluations

## EVAL-PLATFORM-LOCAL-001: Smoke startup script

Goal: Provide a deterministic local smoke check that builds and verifies services without Docker.
Criteria:

- A `pnpm smoke:local` script exists and runs build + runtime checks.
- The smoke script verifies API health and web app responses.
- The smoke script verifies the learner landing page includes an API-backed status marker.
- The smoke script verifies the landing page serves its stylesheet.

## EVAL-PLATFORM-LOCAL-002: Dev stack script

Goal: Provide a dev-mode startup command with automated health checks.
Criteria:

- A `pnpm dev:stack` script exists.
- The dev stack script starts API + web dev servers and verifies they respond.
- The dev stack script verifies the landing page serves its stylesheet.

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

## EVAL-PLATFORM-LOCAL-004: Migration runner compatibility

Goal: Ensure db:migrate runs under ESM without named pg exports.
Criteria:

- The migration runner uses the pg default import and derives Pool from it.

## EVAL-PLATFORM-LOCAL-005: Route tree resolution

Goal: Ensure generated route tree imports resolve during dev.
Criteria:

- The verify script validates routeTree imports exist.
- Vite is configured with /routes and ./routes aliases pointing to the routes directory.
- The verify script normalizes routeTree imports to the /routes alias.
- The dev build config includes a normalize-route-imports plugin.
- The verify script fails if the routes directory is missing.
- The verify script ensures routes proxy files under apps/web/routes.
