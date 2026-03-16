# Summary
Ensure smoke checks validate the learner landing page and its API integration without manual verification.

# Implementation Plan
1) Add API-backed loader to learner landing route and expose a data attribute for smoke validation.
2) Update smoke and dev stack scripts to verify landing page content and API interaction.
3) Update evaluations/tests for local startup verification.
4) Run local smoke and unit/integration/e2e tests.

# Task List
- [x] Add API-backed loader and landing page marker
- [x] Update smoke and dev-stack scripts for landing/API validation
- [x] Update evaluations/tests for local startup verification
- [x] Run local smoke and unit/integration/e2e tests

# Tests
- pnpm smoke:local
- npm run test:unit
- npm run test:integration
- npm run test:e2e
