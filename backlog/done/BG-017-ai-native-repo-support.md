# BG-017: AI-native repo support

Priority: P0
Status: Done
Theme: Foundation

## Why now

AI agents lose all context between sessions and waste significant time on exploratory tool calls to understand the codebase. Adding orientation artifacts (codebase map, domain glossary, session bootstrap rule) eliminates this class of inefficiency and reduces errors from wrong file locations, incorrect terminology, and duplicated implementations.

## Scope

- Create `architecture/codebase-map.md` -- module-level structural index of the repository.
- Create `architecture/domain-glossary.md` -- precise definitions of all domain terms.
- Create `.opencode/rules/session-bootstrap.md` -- directs agents to read orientation files first.
- Add integration test validating codebase map path references exist.
- Add evaluation criteria for all new artifacts.
- Update global implementation gate to require map/glossary maintenance.
- Update change-orchestrator completion step to include map/glossary checks.
- Update architecture README to reference new files.

## Out of scope

- Known issues tracking (rejected -- AI should fix problems immediately, not defer them).
- Function-level code indexing (too fine-grained, too much staleness surface area).

## Dependencies

- BG-016 (unified backlog workflow) -- Done.

## Notes

Artifacts are written at the module/folder level to minimize staleness. An integration test catches drift by parsing the codebase map and asserting referenced paths exist.

---

## Implementation Plan

1. Create `architecture/codebase-map.md` with module-level structural index.
2. Create `architecture/domain-glossary.md` with all domain term definitions.
3. Create `.opencode/rules/session-bootstrap.md` with required reads and re-read guidance.
4. Create evaluation criteria in `evaluations/ai-native-repo-support.md`.
5. Create integration test `tests/integration/codebase-map.test.js` that parses the map and validates paths.
6. Update `.opencode/rules/global-guidelines.md` implementation gate with map/glossary maintenance.
7. Update `.opencode/agents/change-orchestrator.md` completion step with map/glossary checks.
8. Update `architecture/README.md` to reference new files.
9. Create backlog item and update backlog README.
10. Run all tests.

## Task List

- [x] Create `architecture/codebase-map.md`
- [x] Create `architecture/domain-glossary.md`
- [x] Create `.opencode/rules/session-bootstrap.md`
- [x] Create `evaluations/ai-native-repo-support.md`
- [x] Create `tests/integration/codebase-map.test.js`
- [x] Update `.opencode/rules/global-guidelines.md`
- [x] Update `.opencode/agents/change-orchestrator.md`
- [x] Update `architecture/README.md`
- [x] Create backlog item `backlog/done/BG-017-ai-native-repo-support.md`
- [x] Update `backlog/README.md`
- [x] Run all tests and record results

## Implementation Notes

- Codebase map uses markdown tables for structured path-to-purpose mapping. A root-level code block lists top-level directories. Both are validated by the integration test.
- Domain glossary organizes terms into four sections: Identity and Access, Course Structure, Exercises, Learner Progress. Role-based concepts (Publisher, Learner) are explicitly distinguished from table-backed entities.
- Session bootstrap rule lists five required reads in priority order and includes re-read guidance for mid-session context switches.
- Integration test uses two strategies: (1) parsing backtick paths from markdown table cells, (2) parsing the code block for top-level directory references. Both assert all referenced paths exist on disk.
- Evaluation criteria created with three blocks: EVAL-GOVERNANCE-MAP-001, EVAL-GOVERNANCE-GLOSSARY-001, EVAL-GOVERNANCE-BOOTSTRAP-001.
- First test run caught two incorrect paths (apps/api/worker.ts and apps/api/app.ts should be apps/api/src/worker.ts and apps/api/src/app.ts). Fixed and confirmed green. The test is already proving its value.

## Tests

- `pnpm test:unit` -> 4/4 passed
- `pnpm test:integration` -> 34/34 passed (4 new tests for codebase map, glossary, bootstrap)
- `pnpm test:e2e` -> 7/7 passed
