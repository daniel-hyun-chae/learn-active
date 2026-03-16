# BG-004: Learner attempt and progress persistence

Priority: P1
Status: Done
Theme: Learner Experience
Spec: spec/learner-experience.md > Learner attempt persistence and progress visibility

## Why now

The platform has enrollment and course rendering, but no server-side record of what a learner has actually done. Without durable attempt data, there is no progress tracking, no review, no analytics, and no way to know whether a learner finished a course.

## What changes

A learner who completes an exercise has their answers and results saved on the server. Progress becomes visible: the learner sees how far they have gotten through a lesson, module, and course. Each exercise shows whether it was attempted and whether the last attempt was correct. Progress persists across devices and sessions.

## Acceptance criteria

- Learner completes an exercise and the attempt is recorded with their answers and correctness.
- Learner sees lesson-level progress (e.g. "3 of 5 exercises completed") on the lesson view.
- Learner sees course-level progress (e.g. "Module 1: 80% complete") on the course view.
- Progress persists across browser sessions and devices for the same learner.
- Attempts reference a specific course version so answers are graded against the correct content.
- Exercise identifiers within the course content are stable across saves (edits to other exercises do not change existing IDs).

## Out of scope

- Offline sync (BG-009).
- Spaced repetition scheduling (BG-012).
- Analytics dashboards for publishers.

## Dependencies

- BG-001

## Notes

Attempts reference exercise IDs from the JSONB blob in `course_versions.content`. Attempt records store the course version ID for grading resolution. The existing local-only `quizAttemptStore` in `shared/shared-utils/` saves to IndexedDB/AsyncStorage as a demo scaffold -- this work adds the server-side persistence layer.

---

## Implementation Plan

1. Add database persistence for learner exercise attempts with course-version linkage.
2. Extend API repository and GraphQL schema to record attempts and return learner progress summaries.
3. Wire web learner lesson/exercise flows to submit attempts and surface progress at lesson/course levels.
4. Update spec and integration coverage for attempt persistence and progress visibility behaviors.
5. Run unit, integration, and e2e suites; then finalize backlog lifecycle updates.

## Task List

- [x] Add migration and schema definitions for learner exercise attempts.
- [x] Add repository contract/model support for attempt recording and progress summary queries.
- [x] Add GraphQL mutation/query fields and types for learner attempt persistence and progress payloads.
- [x] Integrate web learner lesson/exercise UI with attempt submission and progress rendering.
- [x] Add localization keys for new learner-facing progress and attempt status strings.
- [x] Update `spec/learner-experience.md` with BG-004 behaviors.
- [x] Update integration tests for BG-004 wiring and stability expectations.
- [x] Run `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e` and record results.
- [x] Mark item Done and move file to `backlog/done/`; update `backlog/README.md` status table.

## Implementation Notes

- 2026-03-16: Started implementation. Confirmed current learner flow only persists quiz attempt drafts locally via `quizAttemptStore` and has no server-side attempt table or progress API payload.
- 2026-03-16: `evaluations/README.md` is absent in current repo state despite implementation-gate instruction referencing it; creating a lightweight `evaluations/` artifact with BG-004 EVAL entries to preserve acceptance traceability.
- 2026-03-16: Added migration `0006_learner_attempt_progress.sql` for `learner_exercise_attempts` with RLS policies and uniqueness by learner+course+version+lesson+exercise.
- 2026-03-16: Extended course repository contract and implementations (in-memory, node, worker) with `upsertLearnerExerciseAttempt` and `getLearnerCourseProgress`; progress is computed from published course content and latest attempt rows for the active version.
- 2026-03-16: Added GraphQL types/inputs/resolver operations for learner attempt persistence and progress readback (`upsertLearnerExerciseAttempt`, `learnerCourseProgress`). Attempt correctness is evaluated server-side against exercise content in the referenced course version.
- 2026-03-16: Wired web learner lesson/home flows to show lesson, module, and course progress labels; exercise components now submit attempts to API on completion/check.
- 2026-03-16: Added new i18n keys and integration wiring assertions; updated learner experience spec with BG-004 behavior section.
- 2026-03-16: Test run summary - `pnpm test:unit` passed, `pnpm test:integration` initially failed due stale expectation (`!repository.includes('courseVersionId')`) then passed after updating test assertion, `pnpm test:e2e` passed including publisher E2E flow.
- 2026-03-16: Documentation updates completed: codebase map notes learner attempt migration and root evaluations traceability folder; glossary now includes `LearnerExerciseAttempt` term.

## Tests

- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass (after one expectation fix and rerun)
- `pnpm test:e2e` -> pass
