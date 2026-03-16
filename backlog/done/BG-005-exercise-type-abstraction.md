# BG-005: Exercise type abstraction

Priority: P1
Status: Done
Theme: Content Engine

## Why now

The current exercise model is deeply specific to fill-in-the-blank. `ExerciseStep` has `segments: SentenceSegment[]` and `blanks: ExerciseBlank[]`. `SentenceSegment` uses `blankId` to link text to blank slots. `ExerciseBlank` has `correct`, `variant` (TYPING/OPTIONS), and `options`. The `ExerciseType` enum has exactly one value: `FILL_IN_THE_BLANK`. Multiple-choice, reordering, and matching exercises do not fit this shape. Before adding a second exercise type, the schema needs a generic structure.

## Scope

- Design a discriminated union for exercise payloads: each exercise type defines its own step/answer shape under a common `Exercise` wrapper with `type` as discriminator.
- Define a generic validation contract: given an exercise type and a user answer payload, the server can determine correctness without type-specific logic in the resolver.
- Refactor the existing fill-in-the-blank type to fit within the new union structure (backward-compatible migration of existing content).
- Update GraphQL types to expose the union or interface pattern (TypeGraphQL `createUnionType` or interface with type-specific fields).
- Update the publisher authoring UI to work with the refactored fill-in-the-blank structure.
- Update the learner exercise rendering to work with the refactored structure.
- Define the validation contract in a shared package or module so web, mobile, and API can all validate answers consistently.

## Out of scope

- Implementing new exercise types (covered by BG-006, BG-010).
- Changing the course content storage format (still JSONB blob).
- AI-assisted exercise generation.

## Dependencies

- BG-001 (content must persist to validate the migration works).

## Notes

- Key design decision: discriminated union vs. flattened generic fields. Discriminated union is cleaner but requires GraphQL union/interface handling. Flattened generic fields are simpler in GraphQL but lose type safety.
- The `normalizeCourseInput` function in `apps/api/src/features/course/model.ts` will need updating to handle multiple type shapes.
- Consider creating a decision log entry for the chosen approach.
