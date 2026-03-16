# BG-022: Hosted service-role deploy secret enforcement

Priority: P1
Status: Done
Theme: Foundation
Spec: spec/platform.md > CI/CD > Deployment environment contract validation

## Why now

Staging API deploy now fails post-deploy health verification with Worker 1101 because hosted runtime requires a Supabase service-role key that deploy workflows did not validate or sync.

## What changes

Hosted deploy contracts and workflows explicitly require environment-scoped Supabase service-role secrets and sync them into Cloudflare Worker secrets before API deploy. Governance/docs/spec/tests are updated so this requirement is durable and cannot be silently missed.

## Acceptance criteria

- Deploy environment validation fails when `SUPABASE_SERVICE_ROLE_KEY_STAGING` or `SUPABASE_SERVICE_ROLE_KEY_PROD` is missing.
- Staging and production API deploy workflows sync `SUPABASE_SERVICE_ROLE_KEY` into target Worker before deploy.
- CI/CD docs and environment variable docs list hosted service-role secrets as required for API deploy.
- Product governance includes hosted secret handling guidance to prevent recurring omissions.
- Integration/spec coverage asserts the new secret contract and workflow wiring.

## Out of scope

- Rotating existing Supabase credentials.
- Replacing service-role usage with alternative key model in runtime code.

## Dependencies

- BG-021

## Notes

User explicitly requested governance updates so this is not missed in future deploy changes.

---

## Implementation Plan

1. Update deploy env validator contract for service-role secrets.
2. Update staging/production deploy workflows to pass and sync service-role secrets.
3. Update governance/docs/spec/tests to codify requirement.
4. Run full validation suite and record results.

## Task List

- [x] Update `scripts/validate-deploy-env.mjs` required keys for hosted service-role secrets.
- [x] Update `.github/workflows/deploy-staging.yml` and `deploy-production.yml` to validate and sync service-role secret.
- [x] Update governance/docs (`.opencode/rules/product-guidelines.md`, `architecture/ci-cd.md`, `architecture/environment-variables.md`).
- [x] Update `spec/platform.md` and integration tests to assert the new deploy secret contract.
- [x] Run `pnpm validate:lockfile`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`.
- [x] Move item to `backlog/done/` and update `backlog/README.md`.

## Implementation Notes

- 2026-03-16: Opened from staging deploy failure (`verify-hosted-api-health` got Worker 1101) and confirmed workflow omitted `SUPABASE_SERVICE_ROLE_KEY` validation/sync despite worker runtime requiring it.
- 2026-03-16: Added deploy validator requirement for `SUPABASE_SERVICE_ROLE_KEY_<SUFFIX>`.
- 2026-03-16: Updated staging and production API deploy workflows to include service-role environment secret in deploy-contract validation and sync `SUPABASE_SERVICE_ROLE_KEY` into Worker secrets before deploy.
- 2026-03-16: Updated product governance and architecture docs so runtime-required secret changes must be reflected in validator scripts, workflows, and docs in the same change.
- 2026-03-16: Updated platform spec and CI/CD integration tests for new hosted service-role deploy secret contract.
- 2026-03-16: CI-equivalent local validation suite passed: `pnpm validate:lockfile`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass
