## Summary

Introduce an extensible owner-based course model where publisher management access is governed by owner membership while learner/public read access remains separate. Implement personal owners now, migrate existing global courses to a reserved system owner, and keep schema ready for future organization ownership.

## Implementation Plan

1. Add ownership schema and migration: owners (user/organization/system), owner_members, courses.owner_id, indexes, and backfill to a reserved system owner.
2. Add transactional idempotent provisioning in trusted backend path to ensure profile, personal owner, and matching owner membership.
3. Refactor publisher course access to be owner-scoped using centralized authorization helpers; keep learner/public read concern separate.
4. Update web publisher flow to consume owner-scoped course queries while keeping UX as My courses.
5. Add and update evaluation criteria and automated tests for provisioning, authorization boundaries, and migration behavior.
6. Run unit, integration, and e2e test suites and record outcomes.

## Task List

- [x] Add ownership schema, migration/backfill, and indexes.
- [x] Implement idempotent backend provisioning for personal owner + membership invariant.
- [x] Refactor API course authorization and queries to owner-scoped publisher access.
- [x] Update frontend publisher flow for owner-scoped data.
- [x] Add/update evaluations and tests for new ownership behavior.
- [x] Run required test suites and record results.
- [x] Make local migration push non-interactive for dev setup.

## Tests

- `pnpm test:unit` -> pass (2/2)
- `pnpm test:integration` -> pass (24/24)
- `pnpm test:e2e` -> pass (smoke + publisher flows)
- `node scripts/dev-db.mjs push` -> initially failed on SQL trigger syntax; fixed and now pass
- `node scripts/setup-local.mjs` -> pass (fail-hard migration step succeeds non-interactively)
