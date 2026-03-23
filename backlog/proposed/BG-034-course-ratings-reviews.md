# BG-034: Course ratings and reviews

Priority: P3
Status: Proposed
Theme: Learner Experience
Spec: spec/learner-experience.md > Public catalog and enrollment

## Why now

Not urgent. Ratings and reviews are standard marketplace social proof but require active learners to be meaningful. Empty review sections are worse than no review section. This should be built once the platform has enough enrollments that reviews will actually accumulate.

## What changes

Enrolled learners who have completed a meaningful portion of a course can leave a star rating and optional text review. Ratings are visible on course cards in the catalog and on course detail pages. Publishers can respond to reviews. Average rating and review count are displayed as social proof to help prospective learners make enrollment decisions.

## Acceptance criteria

- Enrolled learner who has completed a minimum percentage of exercises can rate a course (1-5 stars).
- Learner can optionally write a text review alongside their rating.
- Learner can update their rating and review for a course.
- Course cards in the catalog show average rating and review count.
- Course detail page shows individual reviews with rating, text, and date.
- Publisher can write a response to a review.
- Unenrolled learners can read reviews but cannot submit them.
- Reviews are ordered by most recent by default.

## Out of scope

- Review moderation or flagging by other learners.
- Verified purchase badges.
- Sorting reviews by helpfulness.
- AI-generated review summaries.

## Dependencies

- None (extends existing enrollment model).

## Notes

The minimum completion threshold for reviews prevents drive-by ratings from learners who never engaged with the content. A reasonable threshold might be 25-50% exercise completion. Consider whether to require review text or allow rating-only submissions. Rating-only is lower friction and accumulates data faster.
