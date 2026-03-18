# BG-025: Learner attempt and progression hardening

Priority: P1
Status: Done
Theme: Learner Experience
Spec: spec/learner-experience.md > Learner attempt persistence and progress visibility, spec/learner-experience.md > My Courses and published access, spec/platform.md > Governance

## Why now

Learner attempt submission and progression tracking have runtime inconsistencies and access-control gaps that can cause submission failures or incorrect learner visibility. This undermines core learning-loop reliability.

## What changes

Learner attempt submission and progress tracking behave consistently across runtimes, attempt history is reliably recorded, and learner-only course access is enforced by enrollment checks. Progress and review features update correctly after submissions.

## Acceptance criteria

- Learner exercise attempt submission succeeds in both Node and Worker runtime repository paths.
- Each attempt submission appends to learner attempt history and updates latest-attempt status.
- Learner course detail and attempt/progress queries are enrollment-gated for the authenticated learner.
- Progress totals and per-exercise status update correctly after submissions.
- Integration coverage verifies behavioral correctness (not only wiring) for progression and submission paths.
- Governance testing patterns document repository parity and behavioral test expectations for learner progression flows.

## Out of scope

- New learner feature design beyond correctness and hardening of existing progression flows.
- Offline sync enhancements (BG-009).

## Dependencies

- BG-004
- BG-007

## Notes

The work targets defects discovered during deep-dive validation where runtime drift and missing behavior-level tests allowed regressions to pass existing wiring assertions.

---

## Implementation Plan

1. Fix repository-level attempt persistence and history recording inconsistencies across Node and Worker implementations.
2. Enforce enrollment checks for learner course detail and progression entry points used by lesson views and attempt submission.
3. Add behavior-oriented integration and e2e test coverage for progression correctness, submission persistence, and gating.
4. Update testing governance guidance and product specs to reflect durable requirements and coverage expectations.
5. Run required validation/test suite and complete backlog lifecycle updates.

## Task List

- [x] Fix Node and Worker repository attempt/history persistence parity defects.
- [x] Enforce enrollment-gated learner course/progress access used by submission flows.
- [x] Add behavior-level tests for progression updates, history append, and access boundaries.
- [x] Update governance rule (`testing-patterns.md`) and relevant specs for alignment.
- [x] Run full CI-equivalent validation and tests.
- [x] Mark item Done and move to backlog/done with updated summary table.

## Implementation Notes

- Started from user-reported issues: progression not tracked correctly and exercise submission failing in some cases.
- Confirmed runtime parity and behavior-coverage gaps requiring both implementation and governance/spec updates.
- Fixed Node repository attempt submission bug by removing invalid Supabase `client` usage in Node path and using Postgres history/latest-attempt writes only.
- Added enrollment gating to learner course lookup and progress retrieval in both Node and Worker repository implementations so non-enrolled learners cannot access learner course detail/progress paths.
- Added worker-runtime append-only history insertion for learner attempt submission to restore parity with Node/in-memory behavior.
- Added behavior-level e2e scenario covering enrollment gating, attempt submission, progress update, and history append for seed course learner flow.
- Added integration assertions for gating and history persistence coverage in learner course tests.
- Updated testing governance in `.opencode/rules/testing-patterns.md` with explicit runtime parity and learner progression checklist requirements.
- Updated `spec/learner-experience.md` and `spec/platform.md` to capture enrollment-gated progression and governance expectations.
- Added e2e runner watchdog and fail-fast behavior so `pnpm test:e2e` cannot hang indefinitely when worker/runtime processes fail to exit naturally.
- During validation, the new e2e initially failed because the test used an incorrect seed course id; corrected to `course-german-b1-alltagskommunikation` and reran successfully.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `PUBLISHER_E2E_MAX_DURATION_MS=420000 pnpm test:e2e` -> pass
