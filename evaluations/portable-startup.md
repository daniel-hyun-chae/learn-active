# Portable Startup Evaluations

## EVAL-PLATFORM-DOCKER-001: Docker compose startup

Goal: Provide a portable startup that runs the API and web app against an external Postgres database.
Criteria:

- A `docker-compose.yml` exists at the repo root and defines services for API and web.
- The web service depends on the API.
- The API service reads `DATABASE_URL` from environment variables and does not define an embedded Postgres service.
- The compose file exposes ports 4100 and 4000.
- The compose file includes health checks for API and web services.

## EVAL-PLATFORM-DEVCONTAINER-001: Devcontainer startup

Goal: Provide a dev container setup with live reload and safe startup behavior for Supabase local Postgres usage.
Criteria:

- A `.devcontainer/devcontainer.json` exists and uses `docker-compose.devcontainer.yml` with a `dev` service.
- The devcontainer forwards ports 4000 and 4100.
- The devcontainer post-start hook does not run DB migrations.
- The repository provides `pnpm dev` as the command that runs fail-hard setup and migrations before the dev stack.
- `docker-compose.devcontainer.yml` defines a `dev` service without an embedded Postgres service.
- The dev service sets `DATABASE_URL` for Supabase local Postgres (`host.docker.internal:54322`) and enables polling for live reload.
- The devcontainer mounts OpenCode auth to the container user home (for the configured remoteUser).
- The dev service user aligns with the devcontainer remoteUser (no root override).

## EVAL-PLATFORM-DOCKER-002: Environment configuration

Goal: Document and template runtime configuration for containerized startup.
Criteria:

- `.env.example` exists and lists database, Supabase, GraphQL endpoint, and local Stripe bootstrap variables.
- `README.md` documents the canonical local startup flow (`pnpm db:up` then `pnpm dev`) and notes `.env` usage.
- `README.md` documents a repo-local cleanup command for orphaned local dev-stack processes.
- The cleanup command targets both known dev-stack processes and processes still bound to the standard local API/web ports.
- Shared config reads `GRAPHQL_ENDPOINT` and `VITE_GRAPHQL_ENDPOINT` when present.
- A startup setup script (`pnpm setup`) and verification script (`pnpm verify:setup`) exist and are documented.
- `README.md` documents that local Stripe webhook forwarding can auto-start during `pnpm dev` when Stripe test-mode keys are configured.
- Devcontainer and OpenCode setup use repo-local governance (`AGENTS.md`, `opencode.json`, `.opencode/`) without depending on host global OpenCode configuration or session backup flows.
