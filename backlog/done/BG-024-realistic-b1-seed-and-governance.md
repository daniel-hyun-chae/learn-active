# BG-024: Realistic B1 seed content and seed governance

Priority: P1
Status: Done
Theme: Foundation
Spec: spec/publisher-authoring.md > Course authoring workflow, spec/platform.md > Devcontainer, spec/platform.md > Staging deployment, spec/platform.md > Environment configuration

## Why now

Local and staging environments need realistic content to exercise end-to-end learner and publisher flows without manual setup. Current sample content is too minimal and does not systematically guarantee coverage when new feature types are introduced.

## What changes

Replace the current sample content with a realistic German B1 course that uses all currently available authoring and learner elements multiple times. Keep seed behavior idempotent and ensure local and staging runs consistently provide sample content. Add product-level governance so new feature capabilities must update seed content and related checks.

## Acceptance criteria

- Existing sample course is replaced by a realistic German B1 course.
- Seed course includes text blocks, image blocks, content pages, fill-in-the-blank exercises, single-choice multiple-choice, and multi-select multiple-choice, each used multiple times.
- Local environment automatically has seed content available without manual data creation.
- Staging deployments ensure seed content exists via idempotent upsert behavior.
- Product governance documents that new learner/publisher feature capabilities must update seed content and corresponding validation/tests.
- Integration tests assert seed coverage for currently supported content/exercise capabilities.

## Out of scope

- Additional new exercise/content feature development.
- Mobile-specific seed UX.

## Dependencies

- BG-005
- BG-006
- BG-007

## Notes

Seed persistence must remain idempotent and non-destructive.

---

## Implementation Plan

1. Replace seed content with realistic German B1 structure that exercises all available blocks and exercise modes multiple times.
2. Ensure idempotent seed-upsert behavior runs for local and staging runtime paths.
3. Add integration checks for seed structure/capability coverage.
4. Add product-specific governance guidance requiring seed updates when new feature capabilities are introduced.
5. Update spec/docs and run full validation suite.

## Task List

- [x] Replace sample seed course with realistic German B1 content using all available elements repeatedly.
- [x] Ensure local and staging runtime seed provisioning remains idempotent and always available.
- [x] Add integration tests for seed coverage and staging/local seed guarantees.
- [x] Add product-specific governance rule requiring seed updates with new feature capabilities.
- [x] Update specs/docs and run validation suite.

## Implementation Notes

- 2026-03-16: Created from ad-hoc implementation request. Scope confirmed: replace existing sample content, include all available elements multiple times, keep idempotent upsert behavior, and add product-specific governance requirement for future seed updates.
- 2026-03-16: Replaced `apps/api/src/features/course/seed.ts` with realistic German B1 course content containing repeated text/image/content-page blocks and both fill-in-the-blank plus single/multi multiple-choice exercises.
- 2026-03-16: Added repository contract method `ensureSystemSeedCourse` and wired runtime startup (`createRuntimeServices`) to enforce seed provisioning in local and staging worker/node runtime paths.
- 2026-03-16: Updated seed provisioning implementation in node/worker repositories to refresh seed content idempotently by publishing a new seed version and archiving previous published version.
- 2026-03-16: Added integration coverage for new seed title/capability markers and runtime seed bootstrap wiring.
- 2026-03-16: Added product-specific seed governance section to `.opencode/rules/product-guidelines.md`.
- 2026-03-16: Updated specs for publisher/platform seed expectations and ran full validation suite.

## Follow-up

- None.

## Tests

- `corepack pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass
