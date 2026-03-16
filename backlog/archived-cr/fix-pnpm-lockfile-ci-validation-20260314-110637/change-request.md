## Summary

Fix CI validation by regenerating the pnpm lockfile with the repository-declared pnpm 9 version and add durable governance that AI-run local changes must execute the same validations and tests expected by CI before completion.

## Implementation Plan

1. Regenerate `pnpm-lock.yaml` with pnpm 9 so its lockfile version aligns with `package.json`.
2. Update repo-local governance to require AI-driven local changes to run CI-equivalent validations before work is considered complete.
3. Run the relevant local validation suite that mirrors CI expectations.
4. Record the outcomes and any follow-up notes.

## Task List

- [x] Regenerate `pnpm-lock.yaml` with pnpm 9.
- [x] Update governance to require CI-equivalent local validation for AI changes.
- [x] Run local validation and test commands.
- [x] Record outcomes and follow-up notes.

## Tests

- `corepack pnpm --version` -> PASS (`9.12.2`)
- `corepack pnpm install --lockfile-only` -> PASS
- `pnpm lint` -> PASS
- `pnpm --filter @app/learners-mobile lint` -> PASS
- `pnpm build` -> PASS
- `pnpm test:unit` -> PASS
- `pnpm test:integration` -> PASS
- `pnpm test:e2e` -> PASS

## Notes

- `pnpm-lock.yaml` was regenerated with pnpm 9 and now reports `lockfileVersion: '9.0'`, which matches the repository's declared `packageManager` major and resolves the CI validation mismatch.
- The governance update was added to `.opencode/rules/global-guidelines.md` so AI-driven local changes must run relevant CI-equivalent validation, build, and test commands before work is considered complete.
- While running the requested CI-equivalent local validation suite, `pnpm lint` surfaced a pre-existing TypeScript ESLint issue in `apps/api/src/app.ts`; this was fixed as part of the same change so the full local validation suite now passes.
