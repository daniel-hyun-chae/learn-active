# Learning Platform Monorepo

This repository contains:

- web app (learn + publish),
- learners mobile app,
- GraphQL API,
- shared packages.

## Dev container (recommended)

If you cloned the repo and opened it in a dev container, run this exact flow:

1. Start Supabase local services:

```
pnpm db:up
```

2. Start the application:

```
pnpm dev
```

`pnpm dev` is the canonical local startup. It waits for DB readiness, applies Supabase migrations fail-hard, starts API + web servers, and verifies health checks.

`pnpm db:up` excludes Supabase edge runtime by default for better reliability in restricted/offline environments. Include it only when needed:

```
pnpm db:up -- --with-edge-runtime
```

## Human-facing commands

Core local development:

```
pnpm db:up
pnpm dev
pnpm db:status
pnpm db:logs
```

Guardrails:

```
pnpm verify:setup
pnpm smoke:local
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

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

## Local / staging / production usage

- Local development (devcontainer-first): this README.
- Technical architecture overview: `architecture/overview.md`.
- CI/CD, staging, production deploy, and rollback runbook: `architecture/ci-cd.md`.
- Environment variable and secret scope: `architecture/environment-variables.md`.
- Key implementation decisions: `decision-log/`.

## Host requirements

For devcontainer workflow, you only need:

- Docker (or compatible container runtime)
- VS Code + Dev Containers extension
