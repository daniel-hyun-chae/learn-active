# BG-012: Spaced practice and review mode

Priority: P3
Status: Proposed
Theme: Learner Experience

## Why now

Not urgent. Spaced repetition is a proven learning technique but requires a meaningful volume of attempt history to be useful. This should only be built after attempt persistence (BG-004) and wrong-answer review (BG-007) are in use and generating real data.

## What changes

A learner gets scheduled review sessions within each enrolled course. The system tracks which exercises are due for review using a simple interval-based algorithm (Leitner boxes). When the learner opens the "Practice" entry point in a course, they see exercises that are due for review. Answering an exercise correctly extends the review interval; answering incorrectly resets it. Over time, well-known exercises appear less often, and weak exercises appear more frequently.

## Acceptance criteria

- Learner sees a "Practice" entry point in the course view for each enrolled course.
- Practice sessions present exercises that are due for review based on their scheduling interval.
- Correct answer on a review exercise extends the review interval to the next level.
- Incorrect answer on a review exercise resets the review interval to the shortest level.
- Learner sees the number of exercises due for review before starting a practice session.
- Review scheduling is per-course (not cross-course).
- The scheduling algorithm is transparent and deterministic (Leitner boxes, not black-box ML).

## Out of scope

- Cross-course practice sessions.
- Publisher control over review scheduling.
- Gamification (streaks, points, leaderboards).

## Dependencies

- BG-004 (attempt history is the data source).
- BG-007 (wrong-answer review is the simpler precursor).

## Notes

Leitner box system (5 boxes, double interval on success, reset on failure) is simpler to implement than SM-2 and sufficient for v1. The scheduling data could live in a dedicated table or be derived from attempt history; a dedicated table is more efficient for querying "what is due today."
