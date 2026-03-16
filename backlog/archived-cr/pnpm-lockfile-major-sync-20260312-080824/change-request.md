## Summary

Regenerate `pnpm-lock.yaml` with pnpm 9 so lockfile major matches `packageManager` (`pnpm@9.12.2`) and unblocks CI preflight checks.

## Implementation Plan

1. Regenerate lockfile using pnpm 9 in lockfile-only mode.
2. Verify lockfile major now matches pnpm major 9.
3. Run required test suites to validate no regression.

## Task List

- [x] Regenerate `pnpm-lock.yaml` with pnpm 9.
- [x] Verify lockfile major is 9 and aligned with `packageManager`.
- [x] Run `pnpm test:unit`.
- [x] Run `pnpm test:integration`.
- [x] Run `pnpm test:e2e`.

## Tests

- `pnpm test:unit` -> pass (2/2).
- `pnpm test:integration` -> pass (25/25).
- `pnpm test:e2e` -> pass (smoke + publisher flows).
