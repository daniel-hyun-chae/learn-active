# Adopt Supabase PostgreSQL and Supabase CLI SQL migrations

Date: 2026-03-08
Status: Accepted

## Context

Local and production database workflows were split across a custom local Postgres container setup and Drizzle migration artifacts. This created drift risk, duplicate migration authorities, and inconsistent environment handling for future platform evolution.

## Decision

Adopt Supabase-managed PostgreSQL for production and Supabase local stack for development. Make `supabase/migrations/*` the single schema source of truth and use Supabase CLI commands (`supabase start`, `supabase db push --local`, `supabase db reset --local --yes`) in project scripts. Keep application runtime database access Postgres-only through `DATABASE_URL`, with Drizzle retained as the runtime ORM/query layer.

## Consequences

- Local and production database workflows are aligned around PostgreSQL on Supabase.
- Schema evolution is centralized in SQL migrations under `supabase/migrations/*`.
- Legacy Drizzle migration tooling and artifacts are removed to prevent dual migration sources.
- Developers must run Supabase local services for local DB-backed development.
- Future Supabase Auth integration is unblocked by schema compatibility (`profiles.user_id` UUID).

## Alternatives Considered

- Keep Drizzle migrations as primary and use Supabase only as hosting.
- Keep local custom Postgres compose service and only migrate production.

## Links

- `supabase/config.toml`
- `supabase/migrations/0001_initial_schema.sql`
- `scripts/dev-db.mjs`
- `scripts/setup-local.mjs`
- `evaluations/local-startup.md`
- `evaluations/portable-startup.md`
