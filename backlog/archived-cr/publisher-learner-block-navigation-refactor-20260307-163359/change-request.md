# Summary

Implement a publisher and learner navigation refactor so course editing and consumption are both selection-driven and block-oriented.

- Remove `language` from the course data model and all API/UI/test usage.
- Split publisher flow into a landing route with card selection/creation and a dedicated per-course editor route.
- Keep publish workspace always parallel with three columns and per-column vertical collapse rails (48px collapsed), without horizontal scrolling in normal usage.
- Update learner lesson navigation to a vertical left navigator that supports lesson summary, lesson content page, and exercise selection, with main area showing only the selected block.
- Support cross-boundary up/down moves for lessons (across modules) and exercises (across lessons).
- Introduce lesson content pages under lessons (alongside exercises), keeping existing lesson contents as lesson summary and creating new pages empty by default.

# Implementation Plan

1. Refactor shared and API course models to remove `language` and update GraphQL schema, inputs, resolvers, and seed handling.
2. Extend publisher draft/types/utilities with lesson content pages under lessons while preserving legacy lesson summary contents.
3. Split publisher route flow into `/publish` (card selection/create) and `/publish/$courseId` (course editor entry) and wire data loading per route.
4. Refactor `PublisherHome` editor tree and preview to include lesson content pages, remove full-parallel toggle, enforce always-parallel layout, and implement vertical collapse rails.
5. Implement cross-boundary up/down movement logic for lessons and exercises.
6. Refactor learner lesson route and `LessonView` into block-selection mode (lesson summary, lesson content page, exercise) with vertical left navigator.
7. Update styles for no-normal horizontal scroll and desired column expansion behavior (structure minimal growth; designer/preview shared growth).
8. Update i18n resources, evaluation criteria, integration tests, and e2e tests for the new behavior.
9. Run required validation and test commands, record outcomes.

# Task List

- [x] Remove `language` from course model/API/UI/tests.
- [x] Add lesson content page model and utilities under lessons; keep existing lesson contents as lesson summary.
- [x] Implement publisher landing card flow (`/publish`) with create/select/enter behavior.
- [x] Implement dedicated publisher course editor route (`/publish/$courseId`).
- [x] Refactor publisher workspace to always-parallel with 48px collapse rails and no full-parallel toggle.
- [x] Add selection-synced designer/preview support for lesson content pages.
- [x] Implement cross-boundary up/down moves for lessons and exercises.
- [x] Refactor learner vertical navigator and block-only rendering (no content/exercise tab toggle).
- [x] Prevent normal horizontal scrollbar in publish workspace while keeping responsive behavior.
- [x] Update localization resources for new/changed UI text.
- [x] Update evaluation docs and integration/e2e tests for all new behavior.
- [x] Run unit, integration, and e2e tests and record results.
- [x] Enforce learner left-nav/right-content layout at all breakpoints with collapsible nav rail behavior.

# Tests

- `pnpm test:unit` -> PASS (2 passed, 0 failed).
- `pnpm test:integration` -> PASS (16 passed, 0 failed).
- `pnpm test:e2e` -> PASS (2 passed, 0 failed).
  - `publisher landing and block authoring flow @eval(EVAL-PUBLISHERS-COURSE-001,EVAL-PUBLISHERS-COURSE-002,EVAL-PUBLISHERS-COURSE-003,EVAL-PUBLISHERS-COURSE-004)` -> PASS.
  - `app entry points present @eval(EVAL-PLATFORM-INIT-001)` -> PASS.
