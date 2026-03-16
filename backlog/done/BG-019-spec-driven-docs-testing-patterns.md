# BG-019: Spec-driven documentation and testing patterns

Priority: P0
Status: Done
Theme: Foundation
Spec: spec/ (new folder, all files)

## Why now

The current evaluations layer tries to serve as both a human-readable product spec and a test traceability system, but does neither well. As the application grows, no single artifact answers "what does this product do?" for a new person. Additionally, AI-driven development needs explicit testing patterns to ensure consistent coverage beyond happy paths. This restructuring creates a clear spec as source of truth for intended behavior, inlines behavioral coverage into the spec, adds architectural testing patterns as a rule, and simplifies the governance overhead.

## What changes

A new `spec/` folder contains domain-organized files, each with a narrative description of what the product does and a "Behaviors" section listing testable assertions. The spec replaces `evaluations/` as the human-readable source of truth for intended application behavior. A new `.opencode/rules/testing-patterns.md` rule provides architecture-level test checklists (resolvers, repositories, UI components, auth guards) that the AI applies to every implementation. The backlog template gains a `Spec:` field pointing to the affected spec section. The change-orchestrator updates spec files as part of the implementation gate instead of creating evaluation entries. Existing test `@eval(EVAL-...)` references are migrated to descriptive names. The `evaluations/` directory is deprecated with a notice pointing to `spec/`.

## Acceptance criteria

- `spec/` folder exists with domain-organized files covering all current product areas.
- Each spec file contains a narrative section and a "Behaviors" section with testable assertions.
- `.opencode/rules/testing-patterns.md` exists with per-component-type testing checklists.
- Backlog template includes a `Spec:` field.
- Change-orchestrator implementation gate updates spec instead of creating evaluation entries.
- Backlog-planner reads spec during planning and references it in the `Spec:` field.
- `evaluations/README.md` contains a deprecation notice pointing to `spec/`.
- All existing tests pass with updated names (no `@eval` references).
- Global guidelines reference spec instead of evaluations.
- Session bootstrap required reads include spec.

## Out of scope

- Rewriting spec content from scratch (backfill from existing evaluations and code).
- Automated spec-to-test coverage checking script (future enhancement).

## Dependencies

- BG-018 (backlog template must exist).

## Notes

The evaluations files are not deleted -- they get a deprecation notice so historical context is preserved. Test name migration is mechanical: replace `@eval(EVAL-...)` suffix with descriptive names. The spec behaviors are derived from existing evaluation criteria, reorganized by domain.

---

## Implementation Plan

1. Create `spec/` folder with domain files, backfilling from evaluations content and architecture knowledge.
2. Create `.opencode/rules/testing-patterns.md`.
3. Update `backlog/README.md` template with `Spec:` field.
4. Update `.opencode/agents/change-orchestrator.md` -- replace evaluation step with spec update step.
5. Update `.opencode/agents/backlog-planner.md` -- read spec during planning, use `Spec:` field.
6. Update `.opencode/rules/global-guidelines.md` -- replace evaluation references with spec references.
7. Update `.opencode/rules/session-bootstrap.md` -- add spec to required reads.
8. Update `AGENTS.md` -- update source of truth references.
9. Deprecate `evaluations/` -- add deprecation notice to README.
10. Migrate test `@eval` references to descriptive names across all test files.
11. Update `architecture/codebase-map.md` with spec/ folder.
12. Update `architecture/overview.md` references.
13. Run all tests.

## Task List

- [x] Create spec/ folder with domain files
- [x] Create .opencode/rules/testing-patterns.md
- [x] Update backlog/README.md template with Spec: field
- [x] Update change-orchestrator agent
- [x] Update backlog-planner agent
- [x] Update global-guidelines.md
- [x] Update session-bootstrap.md
- [x] Update AGENTS.md
- [x] Deprecate evaluations/README.md
- [x] Migrate test @eval references to descriptive names
- [x] Update architecture/codebase-map.md
- [x] Update architecture/overview.md references
- [x] Run all tests

## Implementation Notes

Session 1: Created all 4 spec files (platform.md, authentication.md, publisher-authoring.md, learner-experience.md) and spec/README.md, backfilling from existing evaluation files organized by domain area.

Session 2: Created .opencode/rules/testing-patterns.md with architecture-level test checklists for resolvers, repositories, UI components, auth guards, and data migrations. Updated all governance files: backlog/README.md (added Spec: field, replaced evaluations refs), change-orchestrator (replaced evaluation step with spec update step), backlog-planner (read spec during planning, Spec: field, removed evaluations refs), global-guidelines.md (Testing and Spec section replaces Testing and Evaluation, implementation gate uses spec), session-bootstrap.md (added spec/README.md as 6th required read), AGENTS.md (spec replaces evaluations in Source Of Truth), evaluations/README.md (deprecation notice added), architecture/codebase-map.md (added spec/ to root listing and Spec section), architecture/overview.md (references section updated). Migrated all 45 @eval references across 20 test files to descriptive names. Updated architecture-doc.test.js to assert spec/ instead of evaluations/platform-initialization.md.

Session 3: Ran full test suite to confirm all changes work. All tests pass. Finalized backlog item and moved to done.

## Tests

- `pnpm test:unit` -> 4/4 pass
- `pnpm test:integration` -> 34/34 pass
- `pnpm test:e2e` -> 7/7 pass (1 smoke + 6 publisher-flows)
