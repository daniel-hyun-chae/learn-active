# BG-027: Learner resume and home experience

Priority: P1
Status: Done
Theme: Learner Experience
Spec: spec/learner-experience.md > Course list and navigation

## Why now

Every learning platform needs a compelling return experience. Today a learner opens the app and sees a generic course list with no context about where they left off. This friction kills daily return habits and makes the platform feel stateless. Resume position is the smallest change with the biggest impact on learner retention.

## What changes

When a learner opens the platform, they see a personalized home that surfaces their active learning. The most recently accessed course appears prominently with a "Continue" action pointing to the exact lesson, content page, or exercise they last visited. Other enrolled courses show recent activity and progress. The learner can jump back into any course with one tap instead of navigating through the course structure each time.

## Acceptance criteria

- Learner's last visited position (lesson, content page, or exercise) is recorded per enrollment.
- Learner home shows a primary "Continue learning" card with the most recently accessed enrolled course and position.
- Tapping "Continue" opens the course at the exact last-visited position.
- Other enrolled courses appear below with their last-accessed time and progress summary.
- Enrolled courses are ordered by most recently accessed, not enrollment date.
- Resume position updates as the learner navigates within a course.
- Learner with no enrollments sees the course catalog instead.
- Resume experience works on both web and mobile.

## Out of scope

- AI-suggested next actions ("you should review these exercises").
- Learning streaks or gamification.
- Push notifications for return prompts.

## Dependencies

- None (builds on existing enrollment and progress tracking).

## Notes

Resume position could be stored as a simple JSON field on the enrollment record (last_visited_lesson_id, last_visited_exercise_id, last_visited_at) or as a separate lightweight table. The former is simpler and sufficient for v1. The learner home replaces or enhances the current `/my-courses` route.

---

## Implementation Plan

1. Add enrollment-level resume persistence in database + repository contracts for both Node and Worker runtime implementations.
2. Add GraphQL resume read/write support so learner course payloads include last-visited context and lesson/mobile flows can update it.
3. Update web learner home to surface a primary Continue card, ordered enrolled courses, and catalog fallback when no enrollments exist.
4. Update mobile learner home and lesson navigation to support Continue-at-position and persist resume updates while navigating.
5. Add/adjust integration coverage and update learner-experience spec behaviors to match BG-027 acceptance criteria.
6. Run required validation/test suite, complete backlog bookkeeping, and move item to done when all checks pass.

## Task List

- [x] Add enrollment resume persistence fields and repository/runtime support.
- [x] Add GraphQL types/inputs/resolver mutation for learner resume updates.
- [x] Implement web continue/resume home UX with ordered enrolled courses and catalog fallback.
- [x] Implement mobile continue/resume UX and lesson selection resume persistence.
- [x] Update integration coverage and learner-experience spec behaviors.
- [x] Run validate/lint/build/unit/integration/e2e and record results.
- [x] Mark item Done, move file to backlog/done, and update backlog summary table.

## Implementation Notes

- Implementation started from explicit user command: "implement backlog BG-027-learner-resume-home".
- Orientation files and BG-027 scope reviewed before edits.
- Existing learner home and lesson flows were inspected for both web and mobile. Current behavior does not persist enrollment-level last-visited position and web `/learn` currently shows only enrolled-course cards (no catalog fallback content).
- Next step is backend persistence/API support first so both clients can consume the same resume contract.
- Added migration `0008_learner_resume_position.sql` and Drizzle schema updates to persist resume fields on `enrollments` (`last_visited_lesson_id`, block type, optional content/exercise IDs, `last_visited_at`) plus a user/time index and block-value constraint.
- Extended API domain/repository contracts and GraphQL types/inputs/resolver with `LearnerResumePosition` and `upsertLearnerResumePosition` mutation, plus `Course.resumePosition` in learner course payloads.
- Updated all repository implementations (in-memory, Node Postgres, Worker Supabase) to store and return resume position, and to order learner courses by `coalesce(last_visited_at, enrolled_at)` so recent activity appears first.
- Web learner flow now persists resume position from lesson route/search changes, and learner home now shows a primary Continue card, recency-ordered enrolled courses, and catalog fallback content for non-enrolled learners.
- Mobile learner flow now consumes resume position in learnerCourses, opens enrolled courses at resume lesson/block context when available, persists selection changes via `upsertLearnerResumePosition`, and surfaces recency hints/primary continue UI.
- Added integration wiring assertions for migration/schema/repository/resolver/client resume paths and updated `spec/learner-experience.md` Course list and navigation behaviors to capture resume/continue expectations.
- Full required validation suite completed successfully; e2e run was executed twice because the first run output was truncated in console capture, and the second run confirmed clean pass/exit status.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass
