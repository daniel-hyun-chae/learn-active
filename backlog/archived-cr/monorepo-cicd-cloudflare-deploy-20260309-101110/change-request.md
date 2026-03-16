## Summary

Implement CI/CD for the existing monorepo structure with Cloudflare Workers (API) and Cloudflare Pages (web), including PR validation, automatic staging deploy on `main`, and manual production deploy by commit ref. Keep React Native in CI checks only, use environment-specific resources/secrets, and document release and rollback operations for contributors.

## Implementation Plan

1. Add GitHub Actions workflows for PR validation, staging deploy, and production deploy.
2. Add monorepo change detection to avoid unnecessary staging deployments.
3. Configure Wrangler/environment targeting for staging and production resources.
4. Add CI/CD documentation and README linkage.
5. Add evaluation criteria and integration test coverage for CI/CD behavior.
6. Run unit, integration, and e2e tests and record results.
7. Align Supabase CI/CD secret naming with Supabase dashboard terminology (Project URL + Publishable key).
8. Align lockfile format with CI pnpm version and harden CI validation for dependency/tooling consistency.
9. Ensure integration env template checks rely only on committed `.env.example` and never require committed `.env.production`.

## Task List

- [x] Add PR CI validation workflow for all pull requests.
- [x] Add staging deployment workflow triggered by pushes to `main`.
- [x] Add manual production deployment workflow with commit ref input and main-branch ancestry validation.
- [x] Add monorepo change detection so staging deploy only runs for changed deployable areas.
- [x] Update API Wrangler config/scripts for staging and production Worker targets.
- [x] Update web deployment scripts for staging and production Pages projects.
- [x] Ensure learners mobile participates only in CI checks and never in deployment jobs.
- [x] Add CI/CD documentation at `docs/ci-cd.md` and link it from `README.md`.
- [x] Add/update evaluation criteria under `evaluations/` for CI/CD behavior.
- [x] Add/update integration tests referencing the new evaluation criteria.
- [x] Run `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e` and capture outcomes.
- [x] Update CI/CD secrets to use `SUPABASE_PROJECT_URL_*` and `SUPABASE_PUBLISHABLE_KEY_*` naming.
- [x] Regenerate `pnpm-lock.yaml` using pnpm `9.12.2` to match CI frozen-lockfile installation.
- [x] Harden CI validation workflow to surface pnpm/lockfile issues early and install Playwright browser dependencies before e2e.
- [x] Re-run local CI parity checks after pnpm/CI hardening updates.
- [x] Update CI/integration checks to require only `.env.example` and keep `.env.production` non-committed.

## Tests

- `pnpm test:unit` -> PASS (2 passed, 0 failed)
- `pnpm test:integration` -> PASS (21 passed, 0 failed)
- `pnpm test:e2e` -> PASS (2 passed, 0 failed)
- `pnpm verify:setup` -> PASS
- `pnpm smoke:local` -> PASS

Re-validation after Supabase secret naming update:

- `pnpm test:unit` -> PASS (2 passed, 0 failed)
- `pnpm test:integration` -> PASS (21 passed, 0 failed)
- `pnpm test:e2e` -> PASS (2 passed, 0 failed)

CI hardening validation run:

- `pnpm lint` -> PASS
- `pnpm build` -> PASS
- `pnpm test:unit` -> PASS (2 passed, 0 failed)
- `pnpm test:integration` -> PASS (21 passed, 0 failed)
- `pnpm test:e2e` -> PASS (2 passed, 0 failed)
- `pnpm verify:setup` -> PASS
- `pnpm smoke:local` -> PASS

Template-file reliability validation run:

- `pnpm test:unit` -> PASS (2 passed, 0 failed)
- `pnpm test:integration` -> PASS (21 passed, 0 failed)
- `pnpm test:e2e` -> PASS (2 passed, 0 failed)

Notes:

- Wrangler warns that v3.95.0 is out of date; this does not fail tests.
- Local smoke/e2e logs show in-memory API repository fallback when no runtime DB adapter is configured; checks still pass.
- During local CI parity verification, web lint initially failed because `apps/web` lint script used workspace-wide ESLint scope. This was fixed by narrowing `apps/web` lint to app-local scope (`pnpm exec eslint .` in `apps/web`).
- CI integration failures (`ENOENT .env.production`) were caused by tests expecting committed `.env.production`; fixed by changing CI/integration checks to rely on committed `.env.example` only and by keeping `.env.production` non-committed.
