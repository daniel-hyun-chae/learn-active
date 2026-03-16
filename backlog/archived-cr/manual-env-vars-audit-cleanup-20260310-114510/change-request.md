# Summary

Audit all manually managed environment variables across repository env files, GitHub workflows/secrets references, and runtime code usage. Build a source-of-truth inventory from implementation, identify duplicates/misplaced/obsolete variables, and clean up unreferenced variables and mismatched documentation/configuration.

# Implementation Plan

1. Inventory all env variables referenced in code, scripts, workflows, validation scripts, and env templates.
2. Classify each variable by required manual-setting location: repo env file, GitHub repository secret, or GitHub environment secret.
3. Detect duplicates, misplaced scope, and obsolete/unreferenced variables based on implementation references.
4. Update env templates/docs/validators/workflows to remove obsolete variables and align locations with actual usage.
5. Update evaluations/tests if contract expectations change.
6. Run unit, integration, and e2e tests and record outcomes.

# Task List

- [x] Build comprehensive environment variable inventory from implementation references.
- [x] Map each variable to manual-setting location and usage paths.
- [x] Identify duplicates, misplaced scope, and obsolete variables.
- [x] Implement cleanup in env templates/docs/workflows/scripts.
- [x] Update evaluations/tests to reflect cleaned env contract if needed.
- [x] Run `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e`; record results.

# Tests

- `pnpm test:unit`: passed (2/2).
- `pnpm test:integration`: passed (23/23).
- `pnpm test:e2e`: passed (2/2 in sequential e2e suite: `smoke.test.js` and `publisher-flows.test.js`).
