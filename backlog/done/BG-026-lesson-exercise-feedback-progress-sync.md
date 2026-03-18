# BG-026: Lesson exercise feedback and progress sync

Priority: P1
Status: Done
Theme: Learner Experience
Spec: spec/learner-experience.md > Fill-in-the-blank exercises, spec/learner-experience.md > Discriminated exercise rendering with multiple-choice, spec/learner-experience.md > Learner attempt persistence and progress visibility

## Why now

Learners reported that key exercises do not provide completion feedback and that progress/history can remain stale after answer submission. This blocks confidence in the core lesson loop.

## What changes

Lesson exercises provide clear submission feedback for both fill-in-the-blank and multiple-choice, and progress/history refresh reliably after submission without requiring manual navigation workarounds.

## Acceptance criteria

- Fill-in-the-blank exercises show correctness feedback after final-step submission.
- Multiple-choice submission triggers reliable backend attempt persistence and visible progress update.
- Lesson progress labels and review/history state reflect newly submitted attempts.
- Regression tests cover the reported `Dialog: Termin verschieben` and `Formelle E-Mail: beste Option` paths.

## Out of scope

- New exercise types.
- Offline sync enhancements (BG-009).

## Dependencies

- BG-025

## Notes

User reports indicate two concrete regressions in existing seed-course exercises, suggesting UI feedback and/or route invalidation race behavior.

---

## Implementation Plan

1. Reproduce and isolate the reported behaviors in lesson exercise components and route submission handling.
2. Implement fill-in-the-blank completion feedback and harden submission lifecycle to avoid silent/no-op outcomes.
3. Harden multiple-choice submission/progress refresh path so progress and history always reflect latest attempt.
4. Add focused tests for both reported exercises and general submission-progress contract.
5. Run required validation suite and finalize backlog/spec bookkeeping.

## Task List

- [x] Reproduce both reported exercise issues and identify root causes.
- [x] Fix fill-in-the-blank completion feedback behavior.
- [x] Fix multiple-choice progress/history refresh synchronization.
- [x] Add regression tests for both reported exercise scenarios.
- [x] Run full CI-equivalent validation and tests.
- [x] Mark item Done and move to backlog/done with updated summary table.

## Implementation Notes

- Implementation started from direct user report after BG-025 hardening.
- Root cause 1 (`Dialog: Termin verschieben`): fill-in-the-blank component submitted without surfacing result state, so successful completion looked like a no-op.
- Root cause 2 (`Formelle E-Mail: beste Option`): multiple-choice component fired async submission without awaiting/recovering from backend outcome, so the learner could see local correctness while backend progress/history remained stale when submission failed or lagged.
- Updated lesson submission contract to return backend `isCorrect` and throw actionable errors when course version context is unavailable.
- Added explicit submitting/error/correctness feedback states for fill-in-the-blank and multiple-choice web exercise components.
- Added focused e2e regression coverage for the exact reported seed exercises (`exercise-b1-termin-fib-1`, `exercise-b1-termin-mc-1`) including progress and history assertions.
- Added integration assertions for new learner exercise feedback/error hooks and i18n keys.
- Hardened e2e runner fail-fast/timeout behavior so failing e2e runs terminate instead of hanging indefinitely.
- Follow-up fix: made multiple-choice feedback submission-authoritative so error and success feedback cannot appear simultaneously; correctness now displays only after successful backend submission.
- Follow-up fix: lesson route query was missing `learnerCourse.versionId`, leaving `courseVersionId` null at submit time and causing all exercise submissions to fail with submit-error UX; restored `versionId` selection and added integration coverage.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `PUBLISHER_E2E_MAX_DURATION_MS=420000 pnpm test:e2e` -> pass
- `pnpm lint` -> pass (follow-up)
- `pnpm build` -> pass (follow-up)
- `pnpm test:integration` -> pass (follow-up)
- `pnpm lint` -> pass (versionId follow-up)
- `pnpm build` -> pass (versionId follow-up)
- `pnpm test:integration` -> pass (versionId follow-up)
