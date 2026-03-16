## Summary

Implement simplified internal course versioning for draft and publish lifecycle, history, compare, rollback-as-new-version, and learner access via course identity. Keep commercial edition logic out of versioning. All published updates remain free for enrolled learners.

## Implementation Plan

1. Align database schema and migration behavior with internal versioning invariants (single published version, archived previous, no version-pinned entitlement).
2. Update API types, repository logic, and GraphQL resolvers for draft creation, publishing, history, structured diff, restore-as-draft rollback, and idempotent enrollment by course identity.
3. Update publisher UI with minimal functional controls for draft status, publish, version history, compare, and restore-as-draft.
4. Update learner-facing catalog/detail/my-courses behavior so reads resolve through the current published version of a course.
5. Update evaluation criteria and integration/e2e coverage to match the new versioning contract and authorization expectations.
6. Run unit, integration, and e2e suites and record results.

## Task List

- [x] Update DB schema and migration logic for simplified versioning invariants and remove enrollment version pinning.
- [x] Implement API repository and GraphQL mutations/queries for create draft from published, publish draft, version history, version diff, and restore version as draft.
- [x] Enforce owner-member authorization (owner/admin/editor) for publisher-side version management actions.
- [x] Implement structured content diff summary (added/removed/changed fields) for version compare.
- [x] Wire learner/public reads to currently published course version via course identity and keep enrollment idempotent by (user_id, course_id).
- [x] Add minimal publisher UI for draft/publish, history, compare, and restore-as-draft.
- [x] Update evaluations in `evaluations/` for new criteria and remove conflicting pinned-version assumptions.
- [x] Update/add tests for lifecycle, rollback, access control, enrollment idempotency, and My Courses behavior.
- [x] Run required test suites and record commands/results.

## Tests

- `pnpm test:unit` -> pass (2/2).
- `pnpm test:integration` -> pass (25/25), including `course versioning, catalog, and enrollment wiring`.
- `pnpm test:e2e` -> pass (smoke + publisher flows).
