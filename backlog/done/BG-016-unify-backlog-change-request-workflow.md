# BG-016: Unify backlog and change-request workflow

Priority: P0
Status: Done
Theme: Foundation

## Why now

The repo had two disconnected tracking artifacts: backlog items (planning) and change requests (implementation records). 48 change requests existed with no link to backlog items. The change-orchestrator agent had no backlog awareness, and sessions that hit context limits lost all implementation context because progress was only tracked in ephemeral change-request files created mid-session.

## Scope

- Restructure backlog into `proposed/`, `done/`, and `archived-cr/` subfolders.
- Move existing change requests into `backlog/archived-cr/` as historical archive.
- Create `backlog-planner` agent for planning sessions (create/update/reprioritize items).
- Update `change-orchestrator` agent to be backlog-aware: read items as input, track implementation progress directly in the backlog item file, move to `done/` on completion.
- Add session continuity requirement: backlog item files must contain enough context for a new session to continue interrupted work.
- Update `AGENTS.md` and `backlog/README.md` to reflect the unified workflow.

## Out of scope

- Migrating historical change-request content into backlog item format.
- Changing evaluation, decision-log, or architecture conventions.

## Dependencies

- None.

## Notes

- Status lifecycle: `Proposed` (backlog-planner) -> `Ready` (human) -> `In Progress` (change-orchestrator) -> `Done` (change-orchestrator).
- Only humans set `Ready`. Agents never promote to `Ready`.
- Trivial ad-hoc fixes can skip backlog items entirely.

---

## Implementation Plan

1. Create folder structure: `backlog/proposed/`, `backlog/done/`, `backlog/archived-cr/`.
2. Move existing done backlog items (BG-001, BG-002, BG-003, BG-005, BG-006) to `done/`.
3. Move remaining proposed items to `proposed/`.
4. Move all 51 existing `change-request/` subdirectories to `backlog/archived-cr/`.
5. Remove empty `change-request/` directory.
6. Rewrite `backlog/README.md` with updated conventions, folder structure, and unified template.
7. Create `.opencode/agents/backlog-planner.md`.
8. Rewrite `.opencode/agents/change-orchestrator.md` with backlog-aware workflow and session continuity requirements.
9. Update `AGENTS.md` to document both agents and add backlog to Source of Truth.
10. Run tests.

## Task List

- [x] Create folder structure: backlog/proposed/, backlog/done/, backlog/archived-cr/
- [x] Move done backlog items (BG-001, BG-002, BG-003, BG-005, BG-006) to done/
- [x] Move proposed backlog items to proposed/
- [x] Move all change-request/\* to backlog/archived-cr/ and remove change-request/
- [x] Rewrite backlog/README.md with unified conventions
- [x] Create .opencode/agents/backlog-planner.md
- [x] Rewrite .opencode/agents/change-orchestrator.md
- [x] Update AGENTS.md
- [x] Create BG-016 in done/
- [x] Run tests

## Implementation Notes

- 51 change-request directories moved to archived-cr (48 with change-request.md files, plus some with additional test log/summary files).
- BG-003, BG-005, BG-006 were already marked Done in the README but initially moved to proposed/ -- corrected to done/.
- The change-orchestrator now requires continuous backlog file updates during implementation for session continuity. This directly addresses the context-limit problem: if a session explodes mid-implementation, the next session reads the backlog file and can continue.
- LSP errors in model.ts are pre-existing (from exercise type abstraction work), not caused by this change.

## Tests

- `pnpm test:unit` -> PASS (4/4)
- `pnpm test:integration` -> PASS (30/30)
- `pnpm test:e2e` -> PASS (smoke 1/1, publisher e2e 6/6)
