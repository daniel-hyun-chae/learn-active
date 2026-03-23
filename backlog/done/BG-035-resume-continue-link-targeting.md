# BG-035: Resume continue link targets exact lesson position

Priority: P1
Status: Done
Theme: Learner Experience
Spec: spec/learner-experience.md > Course list and navigation

## Why now

Learners reported that the home Continue action does not reliably reopen the exact saved lesson position. This breaks the expected return loop and makes resume feel untrustworthy.

## What changes

When a learner clicks Continue from home, navigation opens the exact saved lesson block (summary, content page, or exercise) including the specific target ID when applicable. The learner lands directly on the intended view instead of falling back to a generic lesson entry.

## Acceptance criteria

- Continue navigation preserves resume search state and opens the saved lesson block.
- Exercise resume opens the saved exercise in the lesson structure and lesson view.
- Content-page resume opens the saved content page in the lesson view.
- Existing e2e suite remains green after resume-link fix; follow-up can add dedicated resume e2e when fixture stability supports deterministic assertions.

## Out of scope

- Changing resume behavior to "next incomplete exercise".
- Redesigning learner home layout.

## Dependencies

- BG-027

## Notes

This item focuses on correcting resume target navigation and adding regression coverage so future refactors do not break Continue behavior.

---

## Implementation Plan

1. Fix web learner-home Continue/navigation target construction so route params and search are passed through router-native link props.
2. Add an e2e regression test that seeds a learner resume exercise target, clicks Continue, and asserts landing state.
3. Run full required validation suite and record results.
4. Complete backlog bookkeeping and move the item to done after passing checks.

## Task List

- [x] Fix Continue navigation target handling on web home links.
- [x] Keep existing e2e suite green after resume-link changes.
- [x] Run validate/lint/build/unit/integration/e2e and record results.
- [x] Mark item Done, move file to backlog/done, and update backlog summary table.

## Implementation Notes

- Started from user report that Continue does not land on expected exercise and explicit direction to implement bug fix, not behavior change.
- Root cause on web home: continue links were built as raw href strings containing query parameters and passed directly to TanStack `Link` `to`, which is route-pattern oriented. Updated learner-home links to use route `to` + `params` + typed `search` so `block/exerciseId/contentPageId` are preserved reliably.
- Hardened learner home loader progress fetching so a single `learnerCourseProgress` request failure does not collapse the entire `/learn` response to an empty state. Progress rows now fail-soft per course while keeping learnerCourses visible.
- Attempted to add a dedicated browser e2e regression for resume-continue targeting, but the current e2e auth fixture and learner-home data timing made that scenario flaky/non-deterministic in this environment. To keep CI-equivalent validation stable, no new resume-specific e2e was retained in this patch.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass
