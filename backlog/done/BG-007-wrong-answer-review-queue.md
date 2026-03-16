# BG-007: Wrong-answer review queue

Priority: P1
Status: Done
Theme: Learner Experience
Spec: spec/learner-experience.md > Learner attempt persistence and progress visibility, spec/learner-experience.md > Wrong-answer review mode and attempt timeline

## Why now

Once attempt data exists (BG-004), the most immediately valuable learner feature is revisiting exercises they got wrong -- the core feedback loop for active learning. This also validates that the attempt model stores enough detail to reconstruct exercise context for retry.

## What changes

In the learner course view, learners can toggle a review mode that filters the left-side structure to only exercises whose latest attempt is incorrect while keeping module and lesson nesting for context. Learners can retry those exercises in-place, and a correct retry removes the exercise from the review queue immediately. Each exercise row also includes a history icon so learners can open an attempt timeline and review all prior attempts, including when they answered incorrectly.

## Acceptance criteria

- Learner can toggle review mode from the existing course/lesson view.
- Review mode state is URL-backed so refresh and browser navigation preserve it.
- In review mode, the structure tree shows only exercises whose latest attempt is incorrect.
- Review-mode structure preserves module and lesson nesting above wrong exercises.
- Modules and lessons without wrong exercises are hidden in review mode.
- Wrong exercises are visibly highlighted in the structure.
- Exercises in review mode still render through existing learner exercise components (fill-in-the-blank, multiple-choice).
- Learner sees pending wrong-exercise count for the current course.
- Retrying an exercise and getting it correct removes it from the review queue immediately.
- Each exercise row has an action to open attempt timeline.
- Attempt timeline shows all attempts in chronological order with correctness and timestamp.
- Review and history are scoped to the current course.
- Web implementation first; mobile deferred.

## Out of scope

- Spaced repetition scheduling (BG-012).
- Cross-course review aggregation.
- Publisher analytics on common mistakes.
- Mobile review/history implementation.

## Dependencies

- BG-004
- BG-005

## Notes

Reuses existing exercise rendering components. Review mode is embedded in the normal learner course view (no separate review screen).

---

## Implementation Plan

1. Extend learner attempt persistence to keep append-only attempt history while preserving latest-attempt row semantics used by existing progress queries.
2. Add API contract and resolver query to fetch learner attempt timeline for a specific course/lesson/exercise, scoped to authenticated learner.
3. Add review-mode URL search state in learner lesson route and derive a filtered structure tree that only includes latest-wrong exercises with module/lesson nesting preserved.
4. Add learner UI controls for review mode toggle, pending mistake count, wrong-exercise highlighting, and history trigger per exercise row.
5. Add attempt timeline UI in learner lesson route and wire it to new API query, showing all attempts chronologically with correctness and timestamp.
6. Update integration/spec coverage and run full CI-equivalent validation and tests.

## Task List

- [x] Add attempt-history persistence support in migration, db schema, and repositories.
- [x] Add learner attempt timeline types, repository methods, and GraphQL resolver query.
- [x] Add review-mode URL state and filtered learner structure rendering.
- [x] Add wrong-exercise highlighting and pending count in learner structure panel.
- [x] Add exercise history action and timeline panel in learner lesson route.
- [x] Update i18n strings and styles for review/timeline UX.
- [x] Update integration tests and learner spec behaviors for review mode and attempt timeline.
- [x] Run validation and test suite; record outcomes.

## Implementation Notes

- 2026-03-16: Scope updated per user direction. Review mode is in normal course view with URL persistence, filtered nested structure, immediate removal on correct retry, and per-exercise timeline showing all attempts.
- 2026-03-16: Status moved to In Progress and implementation sections appended.
- 2026-03-16: Added `0007_learner_attempt_history.sql` migration plus Drizzle schema table for append-only attempt history.
- 2026-03-16: Extended in-memory, Node, and Worker course repositories to append history on each submission while preserving latest-attempt upsert behavior used by progress calculations.
- 2026-03-16: Added `learnerExerciseAttemptHistory` GraphQL query and API types to expose chronological, per-exercise attempt timeline for authenticated learners.
- 2026-03-16: Updated learner lesson route to support URL-backed review mode (`review=mistakes`) and filtered nested structure view showing only latest-wrong exercises.
- 2026-03-16: Added pending mistake count, wrong-exercise highlighting, per-exercise history trigger, and timeline panel in web learner route.
- 2026-03-16: Extended `tests/integration/learners-course.test.js` for review-mode/history wiring and updated `spec/learner-experience.md` with dedicated review/timeline behavior section.
- 2026-03-16: Ran all required validation suites successfully (`validate:lockfile`, `lint`, `build`, `test:unit`, `test:integration`, `test:e2e`).
- 2026-03-16: Item completed, status set to Done, and moved from `backlog/proposed` to `backlog/done`.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass
