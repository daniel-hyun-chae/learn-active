# Summary

Implement BG-001 by replacing the default in-memory course repository paths with real database-backed implementations for Node (Drizzle/Postgres) and Worker (Supabase service role), while keeping an explicit in-memory repository factory available for unit-test scenarios.

# Implementation Plan

1. Refactor `apps/api/src/features/course/repository.ts` to provide shared repository logic backed by pluggable persistence adapters.
2. Implement a Node persistence adapter using Drizzle against existing schema tables/functions.
3. Implement a Worker persistence adapter using `@supabase/supabase-js` with service role credentials.
4. Remove default in-memory fallback behavior from runtime service wiring and fail fast when required DB runtime config is missing.
5. Update local runtime orchestration (dev/smoke/e2e) to pass Supabase service role credentials required by worker-backed persistence.
6. Update evaluation criteria and integration assertions for real repository wiring and runtime fail-fast behavior.
7. Update docs impacted by runtime contract changes.
8. Run required test suites and record outcomes.

# Task List

- [x] Refactor course repository to adapter-based shared logic.
- [x] Implement Node Drizzle/Postgres repository adapter for all CourseRepository methods.
- [x] Implement Worker Supabase repository adapter for all CourseRepository methods.
- [x] Add `@supabase/supabase-js` dependency to `apps/api` for worker runtime.
- [x] Remove Node/Worker default in-memory fallback and enforce fail-fast runtime checks.
- [x] Update dev/smoke/e2e scripts to derive and pass `SUPABASE_SERVICE_ROLE_KEY` automatically.
- [x] Extend evaluations and integration tests with repository wiring/fail-fast criteria.
- [x] Update architecture docs for new runtime contract.
- [x] Run `pnpm test:unit`.
- [x] Run `pnpm test:integration`.
- [x] Run `pnpm test:e2e`.

# Tests

Planned commands:
- pnpm test:unit
- pnpm test:integration
- pnpm test:e2e

Results:
- `pnpm test:unit` -> PASS (4 passed, 0 failed).
- `pnpm test:integration` -> PASS (29 passed, 0 failed).
- `pnpm test:e2e` -> PASS (smoke + publisher flows passed).

Notes:
- Initial e2e reruns surfaced stale local DB state from earlier runs (legacy `public.courses` shape with `title/description/content` constraints). Running `node scripts/dev-db.mjs reset --yes` restored expected migration shape before final passing e2e run.
