# BG-010: Reordering exercise end-to-end

Priority: P2
Status: Proposed
Theme: Content Engine

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
