# BG-010: Reordering exercise end-to-end

Priority: P3
Status: Done
Theme: Content Engine
Spec: spec/publisher-authoring.md > Exercise type abstraction with multiple-choice and reordering authoring, spec/learner-experience.md > Discriminated exercise rendering with multiple-choice and reordering

## Why now

Reordering is the next exercise type after fill-in-the-blank and multiple-choice. It validates that the exercise type system (BG-005) handles a fundamentally different interaction pattern -- drag-and-drop ordering -- and is useful for language learning (word order) and procedural learning (step sequences).

## What changes

A publisher can create reordering exercises where the learner must arrange items in the correct order. The publisher defines items and their correct sequence, optionally adding distractor items. The learner sees the items shuffled and reorders them by dragging (or tapping on mobile). The system grades the attempt by comparing the submitted order to the correct order.

## Acceptance criteria

- Publisher creates a reordering exercise with a prompt, a set of items, and a defined correct order.
- Publisher can optionally add distractor items that do not belong in the correct sequence.
- Publisher previews the reordering exercise in the authoring workspace.
- Learner sees items in a shuffled order and reorders them using drag-and-drop (web) or tap-to-move (mobile).
- Learner submits the ordering and sees whether it matches the correct sequence.
- Reordering exercises are keyboard-accessible (arrow keys to reorder).
- Reordering exercises work on both web and mobile.

## Out of scope

- Partial credit for partially correct ordering.
- Grouped reordering (multiple groups to sort simultaneously).

## Dependencies

- BG-005
- BG-006

## Notes

The i18n resources already reference `learners.quiz.format.ordering`. Drag-and-drop accessibility requires keyboard support (arrow keys) per the global accessibility guidelines.

---

## Implementation Plan

1. Extend exercise contracts across API, publisher, web learner, and mobile learner for a new REORDERING type with item payload and GraphQL wiring.
2. Implement reordering correctness evaluation in API and add publisher validation for invalid reordering authoring states.
3. Implement publisher authoring and preview for reordering exercises, including item add/remove/reorder, distractor toggles, and type switching defaults.
4. Implement learner reordering rendering in web and mobile, including shuffled item presentation, submit feedback, and keyboard-accessible reorder controls on web.
5. Update seed content, i18n resources, integration/e2e wiring tests, and spec/domain docs to reflect reordering behavior.
6. Run full validation and test suite, then finalize backlog bookkeeping.

## Task List

- [x] Extend shared exercise contracts and GraphQL fields for REORDERING.
- [x] Add API grading and publisher validation support for reordering exercises.
- [x] Add publisher authoring + preview UX for reordering exercises.
- [x] Add web and mobile learner reordering exercise rendering.
- [x] Update seed data, i18n strings, tests, and specs/docs.
- [x] Run validate/lint/build/unit/integration/e2e and record results.

## Implementation Notes

- Implementation started from backlog scope in this file. Assumption used: distractors are non-sequence items and grading checks the relative order of non-distractor items against the canonical publisher-defined order.
- Assumption used: mobile implementation uses tap-based move controls to satisfy tap-to-move acceptance criteria; web implementation provides drag-and-drop plus keyboard arrow-key reordering.
- No new third-party library planned; implementation uses existing React/React Native capabilities.
- Implemented new REORDERING payload in API GraphQL/input/domain model, including `reordering.prompt` and ordered `reordering.items` with `isDistractor` support.
- Implemented API correctness evaluation for reordering attempts by comparing learner-submitted non-distractor sequence to canonical non-distractor sequence order.
- Implemented API and shared publisher validation rules for reordering exercises (`REORDERING_HAS_NO_ITEMS`, `REORDERING_NEEDS_TWO_SEQUENCE_ITEMS`, `REORDERING_ITEM_TEXT_EMPTY`).
- Implemented publisher editor UX for reordering exercise type switch, prompt editing, item add/edit/delete/reorder, distractor toggles, and preview wiring.
- Implemented learner web `ReorderingExercise` with shuffled initial list, drag-and-drop, keyboard ArrowUp/ArrowDown reorder, submit handling, and correctness feedback.
- Implemented learner mobile `ReorderingExercise` with shuffled initial list, tap-to-select + move controls, submit handling, and correctness feedback.
- Updated seed content with a realistic reordering exercise including one distractor item.
- Updated i18n resources and integration wiring tests for reordering authoring and learner flows.
- Updated specs (`spec/publisher-authoring.md`, `spec/learner-experience.md`) and glossary (`architecture/domain-glossary.md`) to document REORDERING behavior and terminology.
- Strengthened repo-local governance by updating `.opencode/rules/product-guidelines.md` to explicitly require the canonical German seed course to include every supported learner exercise type when applicable.
- Added integration coverage to enforce the seed-governance contract by deriving `ExerciseType` entries from `apps/api/src/features/course/types.ts` and asserting each type exists in `apps/api/src/features/course/seed.ts`.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass (includes known non-fatal wrangler/workerd log noise during run)
