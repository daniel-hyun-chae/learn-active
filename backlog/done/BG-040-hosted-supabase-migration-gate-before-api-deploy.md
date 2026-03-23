# BG-040: Hosted Supabase migration gate before API deploy

Priority: P0
Status: Done
Theme: Foundation
Spec: spec/platform.md > CI/CD > Staging deployment, spec/platform.md > CI/CD > Production deployment, spec/platform.md > CI/CD > Deployment environment contract validation

## Why now

Staging API deploy failed with Worker 1101 because runtime started against a hosted Supabase project whose schema did not include required tables (`public.courses`). Deployment must guarantee hosted migrations are applied before API deploy and health verification.

## What changes

Staging and production deploy workflows apply Supabase migrations via Supabase CLI before API worker deploy. Deploy env validation gains a migrations credential contract for API deploy jobs so missing migration credentials fail early and explicitly.

## Acceptance criteria

- Staging deploy applies hosted Supabase migrations before API worker deploy.
- Production deploy applies hosted Supabase migrations before API worker deploy.
- API deploy env validation fails when migration credentials are missing.
- CI/CD docs and environment variable docs list required migration secrets.
- Integration/spec coverage asserts migration-before-deploy workflow wiring and secret contract.

## Out of scope

- Data backfill and one-off manual SQL beyond migration execution.
- Changing migration authoring format.

## Dependencies

- BG-022
- BG-037

## Notes

Supabase docs recommend CI/CD-managed `supabase db push` for hosted environments; this item codifies that pattern.

---

## Implementation Plan

1. Extend deploy-env validation contract to support API migration credential checks.
2. Update staging and production API deploy workflows to run Supabase CLI migration steps before worker deploy.
3. Update CI/CD docs, environment-variable docs, and platform spec for the migration gate.
4. Update integration tests for workflow wiring and validation contract.
5. Run CI-equivalent validation and test suite.

## Task List

- [x] Extend deployment env validation for migration credential gating.
- [x] Add hosted Supabase migration steps to staging/production API deploy jobs.
- [x] Update docs/spec for migration gate and required secrets.
- [x] Update integration tests for workflow and validation behavior.
- [x] Run `pnpm validate:lockfile`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`.

## Implementation Notes

- Started from staging incident where PostgREST schema cache lacked `public.courses`, indicating hosted schema was behind runtime expectation.
- Added `--require-migrations` mode to `scripts/validate-deploy-env.mjs`, requiring `SUPABASE_ACCESS_TOKEN` and env-scoped `SUPABASE_DB_PASSWORD_<SUFFIX>` for API deploy jobs.
- Updated staging/production API deploy workflows to install Supabase CLI, derive project ref from `SUPABASE_PROJECT_URL_<SUFFIX>`, run `supabase link`, and execute `supabase db push` before Worker deploy.
- Updated CI/CD and environment-variable docs to include migration credentials and migration-before-deploy gate.
- Updated platform spec and integration tests to assert migration credential contract and workflow wiring.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass (includes known non-fatal local workerd noise logs during run)
