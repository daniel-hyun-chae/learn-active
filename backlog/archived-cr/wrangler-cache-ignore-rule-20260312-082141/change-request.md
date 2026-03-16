## Summary

Ignore local Wrangler runtime cache artifacts generated under app folders so dev-server side effects do not create noisy git changes.

## Implementation Plan

1. Add an ignore rule for app-level Wrangler cache folders.
2. Verify git status no longer reports `.wrangler` runtime cache paths as untracked.
3. Run required test suites and record results.

## Task List

- [x] Add `apps/*/.wrangler/` to `.gitignore`.
- [x] Verify `.wrangler` runtime cache paths are ignored by git.
- [x] Run `pnpm test:unit`.
- [x] Run `pnpm test:integration`.
- [x] Run `pnpm test:e2e`.

## Tests

- `pnpm test:unit` -> pass.
- `pnpm test:integration` -> pass.
- `pnpm test:e2e` -> pass.
