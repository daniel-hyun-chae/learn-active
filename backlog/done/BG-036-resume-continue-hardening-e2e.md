# BG-036: Resume continue hardening and deterministic e2e coverage

Priority: P1
Status: Done
Theme: Learner Experience
Spec: spec/learner-experience.md > Course list and navigation

## Why now

Learners still report inconsistent Continue behavior. We need a hardened implementation and deterministic browser coverage so regressions are caught before release.

## What changes

Continue from learner home always routes with canonical lesson-block targeting and remains resilient when some progress calls fail. A deterministic e2e test validates that clicking Continue opens the saved exercise target.

## Acceptance criteria

- Continue action uses canonical route params/search and lands on saved lesson block target.
- Learner home still renders enrolled-course cards when per-course progress fetch fails.
- Browser e2e test creates enrolled learner state, seeds resume position, clicks Continue, and asserts exercise-target landing.

## Out of scope

- Changing behavior to "next incomplete exercise".
- Mobile-specific resume e2e in this item.

## Dependencies

- BG-027
- BG-035

## Notes

E2e stability requires using a deterministic authenticated learner fixture and explicit backend seeding before UI assertions.

---

## Implementation Plan

1. Harden web learner-home continue targeting and loader resilience.
2. Add deterministic browser e2e test for continue-to-exercise resume.
3. Update e2e runner expected test list for the new deterministic resume test.
4. Run full validation suite and record outcomes.
5. Complete backlog bookkeeping and move to done.

## Task List

- [x] Harden continue targeting and learner-home loader resilience.
- [x] Add deterministic e2e resume-continue test and wire into e2e runner expectations.
- [x] Run validate/lint/build/unit/integration/e2e and record results.
- [x] Mark item Done, move file to backlog/done, and update backlog summary table.

## Implementation Notes

- Started from explicit user instruction to re-implement with stronger hardening and include e2e coverage.
- Kept product behavior as resume-last-visited targeting (explicitly not next-incomplete behavior).
- Strengthened `/learn` loader auth/token setup by explicitly binding GraphQL access token from `requireWebSession('/learn')` before learner queries, matching other authenticated routes and preventing token-provider drift in e2e/runtime navigation.
- Hardened learner-home relative-time formatting in `LearnerHome` by canonicalizing locale input and falling back safely to `en` when `Intl.RelativeTimeFormat` receives invalid locale tags in Playwright/browser environments.
- Added worker-side repository hardening for large course catalogs by chunking Supabase `.in(...)` hydration queries in `hydratePublicRows`, preventing URI-too-long failures under high-cardinality lists.
- Kept learner-home course rendering resilient by making progress lookups fail-soft per course and only querying public catalog fallback when the learner has no enrollments.
- Added deterministic browser e2e test `learner continue card opens saved resume exercise target` in `tests/e2e/publisher-flows.test.js`: provisions learner auth state, enrolls learner into seeded course, seeds resume mutation to exercise block, clicks Continue card, and asserts URL + exercise render.
- Updated `scripts/run-publisher-e2e.mjs` expected test list to include the new resume e2e case so watchdog success detection remains accurate.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass (exit code 0; observed intermittent non-fatal worker/log warnings during run)
