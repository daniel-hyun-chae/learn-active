# Platform

Infrastructure, local development, deployment, and cross-cutting platform concerns.

## Monorepo structure

The repository is a pnpm monorepo with deployable applications under `apps/` and shared packages under `shared/`. Applications include the web app (learner + publisher), a mobile app (learner), and the GraphQL API. Shared packages provide design tokens, UI components, internationalization, GraphQL client setup, configuration constants, and utilities.

Feature/domain folders live inside each app for their primary feature areas. Domain-agnostic, cross-cutting implementations live under `shared/`.

### Behaviors

- The repository includes apps for web, learners mobile, and the API.
- Shared domain-agnostic packages live under `shared/`.
- Feature/domain folders exist inside each app for their primary feature area.
- App entry points exist for web, mobile, and API.

## Localization

All user-facing strings are translatable. Learner and publisher web UI pull strings from shared i18n resources. The mobile app pulls strings from the same shared i18n resources.

### Behaviors

- Learner and publisher web UI pull strings from shared i18n resources.
- Learner mobile UI pulls strings from shared i18n resources.
- Shared i18n resources include the initial UI copy for learners and publishers.

## Offline attempt scaffolding

Learners can start an exercise attempt offline and persist it locally. The web app uses a web-storage-backed attempt store. The mobile app uses an AsyncStorage-backed attempt store.

### Behaviors

- Web app includes an exercise attempt store backed by web storage.
- Mobile app includes an exercise attempt store backed by AsyncStorage.
- Creating an exercise attempt stores a draft with attempt ID, exercise ID, answers, and timestamps.

## GraphQL API

The API exposes a GraphQL endpoint served by GraphQL Yoga and TypeGraphQL. It runs as a Cloudflare Worker in production and via Wrangler locally. A health query returns a static "ok" string.

### Behaviors

- API server exposes a GraphQL endpoint.
- Health query returns a static "ok" string.

## Local startup

### Unified dev command

`pnpm dev` is the primary local/devcontainer startup command. It runs setup (DB reachability check, Supabase SQL migrations) fail-hard, then starts API and web dev servers with health checks.

### Behaviors

- `pnpm dev` exists and is the primary local startup command.
- `pnpm dev` runs setup and stack scripts in sequence before reporting success.
- Setup script waits for DB reachability and runs Supabase SQL migrations fail-hard.
- Dev stack starts API and web dev servers with health checks.
- Dev stack verifies the landing page serves its stylesheet.
- Dev stack fails fast when API or web processes exit unexpectedly.

### Smoke startup

`pnpm smoke:local` provides a deterministic build + verify cycle without Docker.

### Behaviors

- `pnpm smoke:local` exists and runs build + runtime checks.
- Smoke script verifies API health and web app responses.
- Smoke script verifies the learner landing page includes an API-backed status marker.
- Smoke script verifies the landing page serves style assets.
- API startup tolerates an unavailable local database by using seed-backed fallback data.

### Setup verification

`pnpm verify:setup` and `pnpm smoke:local` run a pnpm preflight to ensure consistent dependencies.

### Behaviors

- `pnpm verify:setup` exists.
- Verify script runs a pnpm preflight to clean mixed node_modules state.
- Smoke script runs the same pnpm preflight before building.
- Preflight verifies required tooling (turbo) is available or reinstalls.
- Preflight verifies build tools (tsc, vite) are available or reinstalls.

### Route tree resolution

Generated route tree imports are validated during dev and build.

### Behaviors

- Verify script validates routeTree imports exist.
- Verify script fails if imported route modules referenced by routeTree.gen.ts do not exist.

## Database

### Supabase migration authority

Supabase SQL migrations are the only schema authority. The repository includes `supabase/config.toml` and migration files. Runtime API startup does not execute schema-changing DDL.

### Behaviors

- Repository includes `supabase/config.toml` and `supabase/migrations/`.
- A baseline migration defines required schema objects.
- Runtime API startup does not execute schema-changing DDL.

### Devcontainer database workflow

The repository provides simple database lifecycle commands for development.

### Behaviors

- Repository exposes `pnpm db:up`, `pnpm db:status`, and `pnpm db:logs` commands.
- Database helper uses Supabase CLI local workflow.
- `pnpm db:up` starts Supabase local services excluding edge runtime by default in restricted environments.
- Destructive reset requires explicit confirmation.

### Fail-hard local DB setup

Local dev setup has an explicit fail-hard migration step.

### Behaviors

- `scripts/setup-local.mjs` exists and `pnpm dev` invokes it before starting the dev stack.
- Setup script waits for DB reachability and runs Supabase migration push.
- Setup script fails when migrations fail.
- In devcontainer mode, setup normalizes localhost DB host for Supabase local connectivity.

## Browser runtime validation

Local startup validation covers real browser behavior.

### Behaviors

- Browser checks validate a real browser page load for `/learn`.
- Browser checks fail on hydration mismatch warnings or client runtime errors.
- Browser checks validate unknown routes render the global not-found experience.
- `pnpm smoke:local` runs browser checks as part of startup validation.

## Devcontainer

The devcontainer uses Docker Compose with a `dev` service that connects to the host Supabase local stack.

### Behaviors

- `.devcontainer/devcontainer.json` exists and uses docker-compose with a dev service.
- Devcontainer forwards ports 4000 and 4100.
- Post-start hook does not run DB migrations.
- `pnpm dev` is the command that runs fail-hard setup and migrations before the dev stack.
- Dev service sets DATABASE_URL for Supabase local Postgres.
- Devcontainer mounts OpenCode auth to the container user home.
- Dev service user aligns with devcontainer remoteUser.

### Playwright readiness

Playwright browser checks run in devcontainer without manual setup.

### Behaviors

- Devcontainer post-create setup installs Playwright Chromium.
- Devcontainer config sets a deterministic Playwright browser cache path.
- Devcontainer mounts a persistent volume for Playwright browser binaries.
- Devcontainer image installs Chromium runtime dependencies.
- Devcontainer compose provides shared memory sizing suitable for Chromium.

## Docker Compose

A portable Docker Compose startup runs the API and web app against an external Postgres database.

### Behaviors

- `docker-compose.yml` exists and defines services for API and web.
- Web service depends on API.
- API service reads DATABASE_URL from environment variables.
- Compose file exposes ports 4100 and 4000.
- Compose file includes health checks for API and web services.

## Environment configuration

Runtime configuration is documented and templated.

### Behaviors

- `.env.example` exists and lists database, Supabase, GraphQL endpoint, and local Stripe bootstrap variables.
- README documents the canonical local startup flow and .env usage.
- README documents a repo-local cleanup command for orphaned dev-stack processes.
- Shared config reads GRAPHQL_ENDPOINT and VITE_GRAPHQL_ENDPOINT when present.
- README documents that local Stripe webhook forwarding can auto-start during `pnpm dev`.

## Local API runtime

API local runtime matches Cloudflare Worker execution during development.

### Behaviors

- API workspace exposes a Wrangler-based local dev command.
- Dev stack startup uses Wrangler for the local API runtime.
- API local runtime keeps GraphQL endpoint compatibility at `/graphql`.

## Static web deployment

Web build is compatible with static Cloudflare Pages deployment.

### Behaviors

- Web build uses static Vite output without Node SSR runtime dependency.
- Web workspace exposes preview and Pages deploy scripts.

## Mobile local API compatibility

The React Native app can call local Wrangler API endpoints during development.

### Behaviors

- Mobile API endpoint configuration supports a local GraphQL URL override.
- Smoke startup validates a mobile-target endpoint against local GraphQL health.

## CI/CD

### Pull request validation

Every pull request is validated with consistent monorepo checks before merge.

### Behaviors

- A GitHub Actions workflow is triggered by pull_request for all PRs.
- Workflow installs dependencies and runs lint, build, unit, integration, and e2e checks.
- React Native participates in CI checks only.
- CI validates pnpm major and lockfile major parity using a shared repository script.

### CI-equivalent local validation gate

Implementation completion requires local validation parity with CI checks.

### Behaviors

- Product implementation gate requires `pnpm validate:lockfile`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e` before completion.
- Backlog implementation template includes validation and test command result entries for the same CI-equivalent suite.

### Pnpm lockfile parity

The repository enforces lockfile major parity with the repository-declared pnpm major.

### Behaviors

- Local validation command `pnpm validate:lockfile` exists and fails on major mismatch.
- CI lockfile parity step uses the same repository validation command.

### Optional local git hook parity check

The repository provides optional repo-local git hooks to surface lockfile parity errors before commit.

### Behaviors

- Repository includes `.githooks/pre-commit` running `pnpm validate:lockfile`.
- Repository exposes `pnpm hooks:install` to configure `core.hooksPath` to `.githooks`.

### Staging deployment

Merges to `main` automatically deploy staging resources.

### Behaviors

- Deploy workflow is triggered by pushes to main.
- API deploys to Cloudflare Worker staging.
- Web deploys to Cloudflare Pages project staging.
- Staging deployment validates environment contract before deployment.
- Staging deployment requires Stripe staging secrets.
- Staging API deploy performs post-deploy health verification with CORS headers.
- Staging API deploy preserves existing hosted Worker vars across redeploys.

### Production deployment

Production releases are manual and support redeploy/rollback by commit ref.

### Behaviors

- Production deploy uses workflow_dispatch with required commit_ref input.
- commit_ref is validated as reachable from main before deployment.
- API deploys to Cloudflare Worker production.
- Web deploys to Cloudflare Pages project production.
- Production deployment validates environment contract before deployment.
- Production API deploy performs post-deploy health verification.
- Production API deploy preserves existing hosted Worker vars across redeploys.

### Monorepo-aware deployment

Deployment jobs avoid unnecessary execution.

### Behaviors

- Staging deploy includes change detection for API and web scopes.
- API and web deploy jobs are conditionally skipped when their areas did not change.
- React Native-only changes do not trigger staging deployment.

### Environment safety

Hosted deployments reject local-only URL targets.

### Behaviors

- Hosted deployment validation rejects localhost, 127.0.0.1, and ::1 targets for API, web, and Supabase project URLs.
- Hosted deployment validation requires HTTPS URLs.
- CI/CD wiring executes environment-contract validation before deploy steps.

### Built web endpoint verification

Deployment verifies the bundled web GraphQL endpoint before Pages deploy.

### Behaviors

- Staging and production web deploy run built-artifact endpoint verification after build and before deploy.
- Verification logs include expected endpoint and matched artifact paths.
- Verification fails deployment when expected endpoint is not found.

### CI/CD documentation

New contributors can understand the release flow.

### Behaviors

- Documentation describes workflow structure and deployment flow.
- Documentation defines staging/production environment model and resource mapping.
- Documentation lists required secrets.
- Documentation explains manual production trigger and rollback.
- README links to CI/CD documentation.

## Governance

### Codebase map

The codebase map provides accurate structural orientation for AI agents and humans.

### Behaviors

- `architecture/codebase-map.md` exists and contains module-level path references.
- Every path referenced in the codebase map exists in the repository.
- An integration test validates codebase map paths.

### Domain glossary

The domain glossary provides unambiguous definitions for all domain concepts.

### Behaviors

- `architecture/domain-glossary.md` exists and defines domain terms.
- Each term specifies its storage location when applicable.
- Role-based concepts are distinguished from table-backed entities.

### Session bootstrap

Every agent session starts with enough context for correct decisions.

### Behaviors

- `.opencode/rules/session-bootstrap.md` exists and lists required reads.
- Required reads include codebase map, domain glossary, architecture overview, AGENTS.md, and backlog README.

## Dark mode

The web app supports theme switching.

### Behaviors

- Web root document includes a `data-theme` attribute.
- Root documents include a `color-scheme` meta tag.
