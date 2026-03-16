## Summary

Introduce course versioning and publisher draft/publish workflow, plus a public catalog, version-pinned learner enrollment, and a My Courses view. Publisher management stays owner-scoped, while learner/public access stays a separate policy domain.

## Implementation Plan

1. Replace course schema with identity-focused `courses` and add `course_versions`, `course_publications`, and version-pinned `enrollments` with migration from legacy content to published v1.
2. Implement GraphQL backend services/resolvers for publisher draft and publish flow, public catalog/detail, idempotent enrollment, and learner My Courses.
3. Update web routes for public `/courses`, `/courses/{slug}`, and authenticated `/my-courses`, and align existing publisher/learner flows to versioned APIs.
4. Apply RLS/policy updates to separate owner management from published learner/public visibility and self enrollment access.
5. Add/update evaluation criteria and automated tests for publishing workflow, catalog visibility, enrollment idempotency, and authorization boundaries.
6. Run unit, integration, and e2e tests and capture outcomes.

## Task List

- [x] Add schema/migration for versioned courses, publications, and pinned enrollments with legacy v1 publication backfill.
- [x] Implement backend repository and GraphQL operations for versioning, publish flow, catalog/detail, enroll, and my-courses.
- [x] Update frontend routes and data flows for public catalog/detail and learner my-courses.
- [x] Add/update RLS policies for owner-managed writes, published reads, and self enrollment access.
- [x] Add/update evaluations and tests for new behavior and separation of access concerns.
- [x] Run required test suites and record results.

## Tests

- `pnpm build` -> pass (api + web build successful)
- `pnpm test:unit` -> pass (2/2)
- `pnpm test:integration` -> pass (25/25)
- `pnpm test:e2e` -> pass (smoke + publisher flows)
