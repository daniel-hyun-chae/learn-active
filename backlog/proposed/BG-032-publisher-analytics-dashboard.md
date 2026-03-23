# BG-032: Publisher analytics dashboard

Priority: P2
Status: Proposed
Theme: Publisher Tools
Spec: spec/publisher-authoring.md > Course authoring workflow

## Why now

Publishers creating courses for a marketplace need feedback on how learners engage with their content. Without analytics, publishers publish into a void and have no way to improve their courses. This is the primary publisher retention feature -- publishers who see engagement data stay and create more courses. The data already exists in the enrollment and attempt tables; it just needs aggregation and a presentation layer.

## What changes

Publishers see an analytics section in their workspace showing how learners interact with their courses. The dashboard shows enrollment trends, completion rates by module and lesson, exercise performance (correctness rates and difficulty), and revenue summary for paid courses. Publishers can identify which exercises learners struggle with and where in the course learners stop progressing, giving them actionable insight to improve content.

## Acceptance criteria

- Publisher workspace includes an analytics view accessible from the publisher landing.
- Analytics shows total enrollments and enrollment trend (new enrollments over time) per course.
- Analytics shows completion rate per module and per lesson (percentage of enrolled learners who completed all exercises).
- Analytics shows per-exercise correctness rate (percentage of attempts that were correct).
- Analytics highlights drop-off points (lessons where learner activity decreases significantly).
- Analytics shows revenue summary for paid courses (total revenue, recent period).
- Analytics data is scoped to the publisher's own courses only.
- Analytics reflects data from the currently published course version.

## Out of scope

- Real-time analytics (daily aggregation is sufficient).
- Per-learner tracking (publishers see aggregate data, not individual learner behavior).
- A/B testing of content variations.
- Export or download of analytics data.

## Dependencies

- None (reads from existing enrollment, attempt, and payment data).

## Notes

The i18n resources already include a 'publishers.nav.analytics' key, suggesting this was anticipated. Analytics can be computed from existing tables: enrollments for enrollment data, learner_exercise_attempts for exercise performance, learner_exercise_attempt_history for attempt trends, payments for revenue. Consider whether to compute on-read (simpler, slower for large datasets) or pre-aggregate (more complex, faster reads). On-read is likely sufficient for v1 given expected data volume.
