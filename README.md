# Learning Platform Monorepo

This repo contains a single web app (learn + publish), a learners mobile app, the GraphQL API, and shared packages.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Expo Go (for mobile testing)

## Install

```
pnpm install
```

## Development

Run everything (web + API):

```
pnpm dev
```

Run local smoke check (build + start + HTTP checks):

```
pnpm smoke:local
```

Run dev stack with checks (dev servers + health checks):

```
pnpm dev:stack
```

Verify setup and run a local smoke test:

```
pnpm verify:setup
pnpm smoke:local
```

Dev container (recommended):

- Install the Dev Containers extension for VS Code.
- Open the repo and choose "Reopen in Container".
- Run the dev stack inside the container:

```
pnpm dev:stack
```

The devcontainer keeps Postgres data persistent and runs `pnpm --filter @app/api db:migrate` on start.

OpenCode is installed in the devcontainer. Run it with:

```
opencode
```

If OpenCode is not found, rebuild the devcontainer to refresh the image.

If your environment blocks direct downloads, you can re-run the installer script:

```
sh scripts/devcontainer-install-opencode.sh
```

You can also provide a custom CA certificate or allow insecure TLS for the script:

```
OPENCODE_CA_CERT=/path/to/ca.crt sh scripts/devcontainer-install-opencode.sh
OPENCODE_INSTALL_INSECURE=1 sh scripts/devcontainer-install-opencode.sh
```

When the data model changes, generate a migration and re-apply it:

```
pnpm --filter @app/api db:generate
pnpm --filter @app/api db:migrate
```

Run everything in Docker (production-style):

```
pnpm setup
pnpm verify:startup
docker compose build --no-cache
docker compose up
```

Notes:

- Docker builds use multi-stage images and include only production dependencies at runtime.

Run a specific app:

```
pnpm --filter @app/web dev
pnpm --filter @app/api dev
pnpm --filter @app/learners-mobile start
```

## URLs and Ports

- Web app (learn + publish): http://localhost:4100
- GraphQL API: http://localhost:4000/graphql

## Environment Variables

- `DATABASE_URL` (optional for now; required when running migrations or DB-backed resolvers)
- `GRAPHQL_ENDPOINT` (server-side GraphQL endpoint for web apps)
- `VITE_GRAPHQL_ENDPOINT` (client-side GraphQL endpoint for web apps)
- `EXPO_PUBLIC_GRAPHQL_ENDPOINT` (mobile GraphQL endpoint when running the Expo app on device)

Notes:

- Do not commit `.env` (it is gitignored). Use `.env.example` as the template.

## Tests

```
pnpm test:unit
pnpm test:integration
pnpm test:e2e
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

## Notes

- Mobile app runs via Expo. Use Expo Go or a simulator.
- The API boots without `DATABASE_URL`, but DB access will be disabled until it is set.
