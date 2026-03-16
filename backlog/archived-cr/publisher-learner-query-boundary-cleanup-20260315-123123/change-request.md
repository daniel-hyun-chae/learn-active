Summary
- Implement BG-003 by removing learner compatibility aliases (`courses`, `course`) from the GraphQL resolver and aligning remaining clients and tests to explicit boundary-safe queries (`learnerCourses`, `learnerCourse`, `publisherCourses`, `publisherCourse`, `publicCourses`, `publicCourse`, `myCourses`).
- Keep the change continuable by preserving repository contracts and authorization behavior while enforcing clear query-path separation across web and mobile clients.

Implementation Plan
- Audit resolver, web routes, mobile app queries, and tests for alias usage.
- Remove compatibility alias fields from GraphQL resolver.
- Update mobile and e2e usage that still call `courses` to `learnerCourses`.
- Update evaluations and tests to reflect alias removal and explicit boundary requirements.
- Update backlog metadata for BG-003 completion.
- Run unit, integration, and e2e tests and record outcomes.

Task List
- [x] Audit and update all remaining alias query usage across app and tests.
- [x] Remove `courses` and `course` alias queries from resolver.
- [x] Update evaluation criteria for explicit alias removal and boundary separation.
- [x] Update backlog status for BG-003 and backlog index.
- [x] Run test:unit and record result.
- [x] Run test:integration and record result.
- [x] Run test:e2e and record result.

Tests
- PASS: `pnpm test:unit`
  - Result: 4 passed, 0 failed.
- PASS: `pnpm test:integration`
  - Result: 29 passed, 0 failed.
- PASS: `pnpm test:e2e`
  - Result: smoke suite passed (1/1) and publisher e2e suite passed (6/6).
