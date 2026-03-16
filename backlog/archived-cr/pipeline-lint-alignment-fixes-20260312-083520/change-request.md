## Summary

Resolve CI validation failures by fixing lint issues in API repository factories and running the full CI validation command sequence used in `.github/workflows/ci-validation.yml`.

## Implementation Plan

1. Fix `@typescript-eslint/no-unused-vars` errors in `apps/api/src/features/course/repository.ts`.
2. Execute the same validation commands as CI in workflow order.
3. Address any additional failures and re-run until all commands pass.

## Task List

- [x] Fix unused-parameter lint errors in `apps/api/src/features/course/repository.ts`.
- [x] Run lockfile and pnpm-major validation script.
- [x] Run `pnpm install --frozen-lockfile` (executed with `pnpm@9.12.2` via `npx` to match CI tooling).
- [x] Validate `.env.example` presence.
- [x] Run `pnpm exec playwright install --with-deps chromium`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm --filter @app/learners-mobile lint`.
- [x] Run `pnpm build`.
- [x] Run `pnpm test:unit`.
- [x] Run `pnpm test:integration`.
- [x] Run `pnpm test:e2e`.

## Tests

- lockfile/major validation script -> pass (expected 9, detected 9).
- `pnpm install --frozen-lockfile` -> local shell pnpm incompatible; rerun with `npx -y pnpm@9.12.2 install --frozen-lockfile` -> pass.
- `.env.example` existence check -> pass.
- `pnpm exec playwright install --with-deps chromium` -> pass.
- `pnpm lint` -> pass.
- `pnpm --filter @app/learners-mobile lint` -> pass.
- `pnpm build` -> pass.
- `pnpm test:unit` -> pass.
- `pnpm test:integration` -> pass.
- `pnpm test:e2e` -> pass.
