## Summary

Migrate database infrastructure to Supabase-managed PostgreSQL for production and Supabase local stack for development. Keep application database access Postgres-only via DATABASE_URL, make Supabase SQL migrations the single schema source of truth, and avoid committing sensitive Supabase credentials.

## Implementation Plan

1. Replace local postgres compose assumptions with Supabase local workflow.
2. Add standard Supabase project structure and baseline SQL migration.
3. Update scripts to use Supabase migration workflow and remove competing migration flow.
4. Update environment templates and gitignore protections for credentials.
5. Prepare schema for future auth with profiles compatibility for auth.users.id.
6. Update documentation, evaluations, and tests for the new workflow.
7. Run unit, integration, and e2e tests.

## Task List

- [x] Remove old local postgres service dependency from dev and devcontainer workflow.
- [x] Add Supabase config at supabase/config.toml.
- [x] Create baseline migration at supabase/migrations/0001_initial_schema.sql.
- [x] Ensure baseline migration includes required schema objects (tables, indexes, constraints, enums, extensions).
- [x] Ensure profiles table is future-compatible with auth.users.id (no auth logic/triggers).
- [x] Replace migration scripts to make Supabase SQL migrations authoritative.
- [x] Keep Drizzle for runtime ORM/query usage.
- [x] Update env templates (.env.example, placeholder .env.production) and keep .env.local gitignored.
- [x] Ensure no sensitive Supabase credentials are committed.
- [x] Update README and startup documentation for Supabase local and production workflow.
- [x] Update evaluations and tests to reference new migration and startup behavior.
- [x] Run pnpm test:unit, pnpm test:integration, pnpm test:e2e and record results.

## Tests

- `pnpm test:unit`
  - Result: PASS (2 passed, 0 failed)
- `pnpm test:integration`
  - Result: PASS (16 passed, 0 failed)
- `pnpm test:e2e`
  - Result: PASS (2 passed, 0 failed)
- `pnpm verify:setup`
  - Result: PASS
- `DYNAMIC_SMOKE_PORTS=1 pnpm smoke:local`
  - Result: PASS
