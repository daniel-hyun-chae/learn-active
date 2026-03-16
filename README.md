# Learning Platform Monorepo

This repository contains:

- web app (learn + publish),
- learners mobile app,
- GraphQL API,
- shared packages.

## Dev container (recommended)

If you cloned the repo and opened it in a dev container, run this exact flow:

Stripe CLI is preinstalled in the devcontainer image, so local Stripe webhook forwarding is available without extra manual installation inside the container.

OpenCode is also installed in the devcontainer, and this repo keeps its OpenCode governance locally in `AGENTS.md`, `opencode.json`, and `.opencode/` rather than relying on host `~/.config/opencode`.

1. Start Supabase local services:

```
pnpm db:up
```

2. Start the application:

```
pnpm dev
```

`pnpm dev` is the canonical local startup. It waits for DB readiness, applies Supabase migrations fail-hard, starts API + web servers, and verifies health checks.

The API worker runtime now requires `SUPABASE_SERVICE_ROLE_KEY` for its default course repository path. Local dev/smoke/e2e scripts auto-derive this from `supabase status -o env` when not explicitly set.

`pnpm db:up` excludes Supabase edge runtime by default for better reliability in restricted/offline environments. Include it only when needed:

```
pnpm db:up -- --with-edge-runtime
```

## Human-facing commands

Core local development:

```
pnpm db:up
pnpm dev
pnpm dev:cleanup
pnpm db:status
pnpm db:logs
```

If a previous `pnpm dev` / `wrangler dev` / `vite preview` process was left behind and ports 4000 or 4100 stay occupied, run:

```
pnpm dev:cleanup
```

Guardrails:

```
pnpm hooks:install
pnpm verify:setup
pnpm smoke:local
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

Optional: install repo-local git hooks once per clone to run lockfile parity checks before commit:

```
pnpm hooks:install
```

This configures `core.hooksPath` to `.githooks/` and runs `pnpm validate:lockfile` in pre-commit.

## Local URLs

- Web: http://localhost:4100
- GraphQL API: http://localhost:4000/graphql

For React Native local validation, use:

- `EXPO_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql`

## Environment files

- `.env.example` is the template.
- `.env` is the primary local runtime file (created from the template).
- `.env.local` can be used for local private overrides.

Do not commit real secrets.

## Stripe test mode (local)

For paid course checkout development, set these variables in `.env.local` (preferred) or `.env`:

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`

Then run `pnpm dev`. In local `APP_ENV=local`, the dev stack auto-starts Stripe CLI webhook forwarding and injects `STRIPE_WEBHOOK_SECRET` for the API when:

- `STRIPE_SECRET_KEY` is present
- `STRIPE_WEBHOOK_SECRET` is blank
- `STRIPE_CLI_WEBHOOK_AUTOSTART` is not disabled

Manual fallback: set `STRIPE_WEBHOOK_SECRET` yourself or disable auto-start with `STRIPE_CLI_WEBHOOK_AUTOSTART=0` and forward Stripe webhooks to the local API:

```
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

Use Stripe test-mode credentials for local and staging. Staging should use GitHub environment secrets (`STRIPE_SECRET_KEY_STAGING`, `STRIPE_PUBLISHABLE_KEY_STAGING`, `STRIPE_WEBHOOK_SECRET_STAGING`) and a hosted webhook endpoint rather than a long-running Stripe CLI session.

If you use the devcontainer, make sure you authenticate Stripe CLI inside the container session before the first local Stripe run:

```
stripe login
```

## Local / staging / production usage

- Local development (devcontainer-first): this README.
- Technical architecture overview: `architecture/overview.md`.
- CI/CD, staging, production deploy, and rollback runbook: `architecture/ci-cd.md`.
- Environment variable and secret scope: `architecture/environment-variables.md`.
- OpenCode governance and repo-local agent tooling: `architecture/opencode-governance.md`.
- Key implementation decisions: `decision-log/`.

## Host requirements

For devcontainer workflow, you only need:

- Docker (or compatible container runtime)
- VS Code + Dev Containers extension
