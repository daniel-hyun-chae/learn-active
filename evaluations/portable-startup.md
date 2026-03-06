# Portable Startup Evaluations

## EVAL-PLATFORM-DOCKER-001: Docker compose startup

Goal: Provide a portable startup that runs the API, web app, and database consistently.
Criteria:

- A `docker-compose.yml` exists at the repo root and defines services for API, web, and Postgres.
- The web service depends on the API; the API depends on Postgres.
- The compose file exposes ports 4100 and 4000.
- The compose file includes health checks for API and web services.

## EVAL-PLATFORM-DEVCONTAINER-001: Devcontainer startup

Goal: Provide a dev container setup with live reload, persistent data, and migrations.
Criteria:

- A `.devcontainer/devcontainer.json` exists and uses `docker-compose.devcontainer.yml` with a `dev` service.
- The devcontainer forwards ports 4000 and 4100.
- The devcontainer runs `pnpm --filter @app/api db:migrate` on start.
- `docker-compose.devcontainer.yml` defines `dev` and `postgres` services and a named Postgres data volume.
- The dev service sets `DATABASE_URL` for the Postgres service and enables polling for live reload.
- The devcontainer mounts OpenCode auth to the container user home (for the configured remoteUser).
- The dev service user aligns with the devcontainer remoteUser (no root override).

## EVAL-PLATFORM-DOCKER-002: Environment configuration

Goal: Document and template runtime configuration for containerized startup.
Criteria:

- `.env.example` exists and lists database and GraphQL endpoint variables.
- `README.md` documents Docker startup and notes `.env` usage.
- Shared config reads `GRAPHQL_ENDPOINT` and `VITE_GRAPHQL_ENDPOINT` when present.
- A startup setup script (`pnpm setup`) and verification script (`pnpm verify:startup`) exist and are documented.
