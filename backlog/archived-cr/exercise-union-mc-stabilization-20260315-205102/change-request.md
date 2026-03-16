Summary
- Continue and complete BG-005 and BG-006 by stabilizing the discriminated exercise union migration and ensuring multiple-choice works end-to-end in publisher, learner web, and learner mobile.
- Keep BG-004 skipped (no grading implementation), maintain backward compatibility for legacy fill-in-the-blank payloads, and verify backlog and evaluation alignment.

Implementation Plan
- Create/confirm a single normalized exercise model in API and client types (`fillInBlank` and `multipleChoice`) with safe legacy normalization.
- Finish publisher editor migration so all exercise editing paths are type-safe and no stale `exercise.steps` assumptions remain.
- Finalize learner renderers and route/query payload alignment for multiple-choice.
- Update and stabilize integration/e2e tests for the new payload shape and workflows.
- Run unit, integration, and e2e test suites and record outcomes.

Task List
- [x] Audit and fix remaining stale exercise shape usage in publisher/editor and shared mapping paths.
- [x] Resolve API/query/type mismatches introduced by discriminated union migration.
- [x] Stabilize learner web/mobile exercise rendering and interactions for multiple-choice.
- [x] Update tests and fixtures for BG-005/BG-006 criteria coverage.
- [x] Verify evaluations/backlog alignment for BG-005 and BG-006.
- [x] Run test:unit and record result.
- [x] Run test:integration and record result.
- [x] Run test:e2e and record result.

Tests
- PASS: `pnpm test:unit`
  - Result: 4 passed, 0 failed.
- PASS: `pnpm test:integration`
  - Result: 30 passed, 0 failed.
- PASS: `pnpm test:e2e`
  - Result: smoke + publisher e2e passed.
