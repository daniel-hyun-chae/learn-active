# Summary

Add a pnpm preflight to clean mixed node_modules state, run pnpm install, and wire it into verify:setup so local startup checks and smoke tests run reliably.

# Implementation Plan

1. Create a preflight script to detect non-pnpm node_modules and clean them safely.
2. Update verify-startup to run the preflight before pnpm build.
3. Update evaluations and integration tests for verify:setup.
4. Update README with the new verify:setup guidance.
5. Run verify:setup and smoke:local.

# Task List

- [x] Create pnpm preflight script for mixed node_modules cleanup.
- [x] Wire preflight into verify-startup (verify:setup).
- [x] Update evaluations and tests for verify:setup.
- [x] Update README with verify:setup guidance.
- [ ] Run pnpm verify:setup.
- [ ] Run pnpm smoke:local.

# Tests

- `pnpm verify:setup`
- `pnpm smoke:local`
