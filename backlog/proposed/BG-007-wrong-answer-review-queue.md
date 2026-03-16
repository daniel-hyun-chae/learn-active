# BG-007: Wrong-answer review queue

Priority: P1
Status: Proposed
Theme: Learner Experience

## Why now

Once attempt data exists (BG-004), the most immediately valuable learner feature is revisiting exercises they got wrong -- the core feedback loop for active learning. This also validates that the attempt model stores enough detail to reconstruct exercise context for retry.

## What changes

A learner who has answered exercises incorrectly can access a "Review mistakes" screen that shows only the exercises they got wrong. The learner retries each exercise, and a correct answer updates their record. This gives learners a focused way to work on their weak areas without re-doing an entire lesson.

## Acceptance criteria

- Learner sees a "Review mistakes" entry point from their course view.
- The review screen shows only exercises where the learner's most recent attempt was incorrect.
- Exercises in the review screen use the same exercise components as normal lesson flow (fill-in-the-blank, multiple-choice).
- Learner retries an exercise and a correct answer replaces the previous incorrect record.
- Learner sees a summary of how many exercises are pending review.
- Review is scoped per course (not cross-course).
- Web implementation first; mobile deferred.

## Out of scope

- Spaced repetition scheduling (BG-012).
- Cross-course review aggregation.
- Publisher analytics on common mistakes.

## Dependencies

- BG-004
- BG-005

## Notes

Reuses existing exercise rendering components. Review shows exercises in isolation (outside their original lesson context) for the initial version.
