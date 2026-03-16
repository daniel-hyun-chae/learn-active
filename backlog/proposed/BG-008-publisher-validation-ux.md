# BG-008: Publisher validation UX

Priority: P2
Status: Proposed
Theme: Publisher Tools

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
