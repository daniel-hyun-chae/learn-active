# BG-008: Publisher validation UX

Priority: P2
Status: Done
Theme: Publisher Tools
Spec: spec/publisher-authoring.md > Validation feedback and publish guardrails

## Why now

As the exercise type system grows (BG-005, BG-006), publishers need clear feedback when exercises are malformed. Currently, saving and publishing accept content without validating exercise integrity, which can result in broken learner experiences.

## What changes

A publisher who saves or publishes a course with structural problems sees clear validation messages in the authoring workspace. Drafts can be saved with warnings (so work-in-progress is not lost), but publishing is blocked until all errors are resolved. The publisher sees exactly which exercise or content block has the problem and what needs to be fixed.

## Acceptance criteria

- Publisher sees validation errors in the authoring workspace when an exercise is structurally incomplete (e.g. missing answer, empty blank, no correct choice).
- Publisher sees validation warnings for content issues (e.g. empty lesson title, module with no lessons, lesson with no content pages).
- Publisher can save a draft that has warnings or errors.
- Publisher cannot publish a course version that has validation errors.
- Validation messages identify the specific exercise, lesson, or module with the problem.
- Validation messages describe the problem in human-readable language (not technical error codes).

## Out of scope

- Content quality scoring or readability analysis.
- Accessibility validation of content.
- Publisher permissions beyond existing owner-scoped access.

## Dependencies

- BG-005

## Notes

Validation logic should be reusable between server-side publish checks and client-side inline warnings. Consider a decision log entry if introducing a shared validation library.

---

## Implementation Plan

1. Add a shared course validation utility that classifies publisher-facing issues as errors or warnings and includes enough context to identify specific modules, lessons, and exercises.
2. Integrate validation into publish flow server-side so publish is blocked when validation errors exist, while save behavior remains unchanged.
3. Integrate validation into publisher workspace UI so inline validation messages are visible during editing, with localized human-readable labels and messages.
4. Add or update automated tests to cover wiring for validation UX and publish guard behavior.
5. Run required validation, build, and test commands; then update spec and backlog state.

## Task List

- [x] Implement shared publisher course validation utility and exports.
- [x] Wire publish mutation to block publish when validation errors remain.
- [x] Render inline validation warnings/errors in publisher UI and keep save enabled.
- [x] Add test coverage updates for validation UX and publish-block behavior.
- [x] Run full required validation and test suite.
- [x] Update spec and backlog completion bookkeeping.

## Implementation Notes

- Started implementation from BG-008 requirements and acceptance criteria.
- Plan is to centralize validation logic in shared code reused by both API and web publisher workspace.
- Added reusable publisher validation logic for module, lesson, fill-in-the-blank, and multiple-choice integrity checks with error/warning severity classification.
- Integrated validation into API publish mutation so publish is rejected with a human-readable summary when blocking errors are present.
- Added publisher editor validation summary UI that lists localized warnings and errors and disables the publish action when errors remain; draft save remains available.
- Added translation keys for validation summary labels, issue messages, and location labels.
- Updated integration tests to assert validation wiring in publisher UI and publish guard integration in resolver stack.
- Ran full required validation and test suite successfully.
- Updated spec and architecture docs, then moved backlog bookkeeping to Done state.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass
