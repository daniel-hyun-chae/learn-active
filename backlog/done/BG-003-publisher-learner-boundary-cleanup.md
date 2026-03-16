# BG-003: Publisher-learner query boundary cleanup

Priority: P0
Status: Done
Theme: Foundation

## Why now

The resolver (`apps/api/src/features/course/resolver.ts`) has compatibility aliases where `courses()` delegates to `learnerCourses()` and `course(id)` delegates to `learnerCourse(id)`. Publisher routes and learner routes should use fully separate query paths so that ownership-scoped publisher data never leaks into learner/public views and learner-facing data never accidentally requires publisher membership.

## Scope

- Audit all GraphQL queries used by web publisher routes (`/publish`, `/publish/$courseId`) and learner routes (`/learn`, `/courses`, `/my-courses`, lesson routes).
- Confirm publisher routes exclusively use `publisherCourses`, `publisherCourse`, and related publisher mutations.
- Confirm learner and public routes exclusively use `learnerCourses`, `learnerCourse`, `publicCourses`, `publicCourse`, `myCourses`.
- Deprecate or remove the compatibility aliases (`courses`, `course`) if no client depends on them.
- Ensure mobile app queries align with the same boundary.

## Out of scope

- Adding new GraphQL fields or types.
- Changing the underlying repository methods.
- Authorization middleware beyond what auth guards already provide.

## Dependencies

- BG-001 (cleaner to verify once real data flows through).

## Notes

- Evaluation criteria already exist: `EVAL-PUBLISHERS-COURSE-005` and `EVAL-LEARNERS-COURSE-007` define the expected separation.
- The compatibility aliases at resolver.ts lines 151-162 are the primary cleanup targets.
