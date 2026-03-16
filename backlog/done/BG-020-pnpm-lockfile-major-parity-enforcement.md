# BG-020: Pnpm lockfile major parity enforcement

Priority: P1
Status: Done
Theme: Foundation
Spec: spec/platform.md > CI/CD > Pull request validation

## Why now

CI keeps failing due to repeated mismatch between the repository-declared pnpm major and the committed lockfile major. This creates avoidable churn and blocks delivery for unrelated work.

## What changes

The product enforces that `package.json` pnpm major and `pnpm-lock.yaml` lockfile major stay aligned. Local and CI checks fail with a clear actionable message when they drift. Regenerating the lockfile with the repo-declared pnpm major resolves the issue predictably.

## Acceptance criteria

- CI fails fast when pnpm major and lockfile major are mismatched.
- Local validation includes the same lockfile-major parity check used in CI.
- Product governance explicitly requires pnpm-major/lockfile-major parity for this repository.
- `pnpm-lock.yaml` is regenerated with the repository-declared pnpm major.

## Out of scope

- Changing package manager for this repository.
- Introducing machine-global developer tooling requirements.

## Dependencies

- BG-019

## Notes

User asked for product-specific governance instead of global governance because not every project uses pnpm.

---

## Implementation Plan

1. Add product-specific rule language for pnpm/lockfile major parity.
2. Add a reusable validation script and package script for local/CI parity checks.
3. Update CI workflow to call the script rather than inline shell logic.
4. Add integration test coverage and platform spec behavior for the guard.
5. Regenerate lockfile with pnpm 9 and run full test suite.

## Task List

- [x] Add product-specific governance rule for pnpm/lockfile major parity.
- [x] Add `scripts/validate-pnpm-lockfile-major.mjs` and package script wiring.
- [x] Update CI workflow parity step to call shared script.
- [x] Extend `spec/platform.md` and integration tests for parity guard behavior.
- [x] Regenerate `pnpm-lock.yaml` with pnpm 9.
- [x] Run `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e` and record results.
- [x] Set status to Done, move item to `backlog/done/`, and update `backlog/README.md`.

## Implementation Notes

- 2026-03-16: Opened as ad-hoc non-trivial implementation item after repeated CI failure pattern and explicit request for durable guardrail.
- 2026-03-16: Implemented product-specific governance in `.opencode/rules/product-guidelines.md` (not global) per user direction.
- 2026-03-16: Added shared parity script `scripts/validate-pnpm-lockfile-major.mjs` and wired root script `pnpm validate:lockfile`.
- 2026-03-16: Updated CI workflow lockfile parity step to call the shared script for local/CI command parity.
- 2026-03-16: Updated platform spec and integration assertions to cover lockfile parity behavior.
- 2026-03-16: Regenerated `pnpm-lock.yaml` with Corepack pnpm 9.12.2; lockfile now reports `lockfileVersion: '9.0'`.
- 2026-03-16: Validation run complete: `pnpm test:unit` pass, `pnpm test:integration` pass, `pnpm test:e2e` pass.
- 2026-03-16: Added optional repo-local pre-commit hook flow: `.githooks/pre-commit` runs `pnpm validate:lockfile`, with installer command `pnpm hooks:install` (sets `core.hooksPath` to `.githooks`).
- 2026-03-16: Updated README, codebase map, platform spec, and integration tests to document and verify optional pre-commit hook installation and behavior.

## Tests

- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass
- `pnpm test:unit` -> pass (rerun after hook/docs updates)
- `pnpm test:integration` -> pass (rerun after hook/docs updates)
- `pnpm test:e2e` -> pass (rerun after hook/docs updates)
