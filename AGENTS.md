# Project Agent Contract

This repository keeps OpenCode governance self-contained. Prefer repo-local governance over machine-global configuration.

## Taxonomy

- Rules define durable invariants that must remain true across tasks.
- Commands represent explicit user-invoked actions only.
- Skills capture reusable methodology for recurring classes of work.
- Agents exist only when delegation clearly reduces blast radius or responsibility overlap.
- MCP provides repo-local external tools and observation.
- Hooks-equivalent enforcement belongs in CI and optional git hooks, not in OpenCode rules.
- Memory is not part of this repo's governance model.

## Primary UX

Two agents, two workflows:

- **backlog-planner** (`.opencode/agents/backlog-planner.md`): planning sessions. Creates, updates, and reprioritizes backlog items. Never modifies code.
- **change-orchestrator** (`.opencode/agents/change-orchestrator.md`): implementation sessions. Takes a backlog item (or ad-hoc request), implements it, and tracks progress in the backlog item file.

Workflow:

1. Plan with backlog-planner -> outputs items in `backlog/proposed/` with status `Proposed`.
2. Human sets status to `Ready` when approved for implementation.
3. Implement with change-orchestrator -> reads item, implements, updates item with progress, moves to `backlog/done/` when complete.

Treat `implement` as the explicit approval to leave planning mode and start editing.

## Source Of Truth

- `backlog/` is the single source of truth for planned and completed work items. See `backlog/README.md` for conventions.
- `spec/` defines product behavior and testable assertions. See `spec/README.md` for conventions.
- `decision-log/` records implementation-affecting decisions.
- `architecture/` holds deeper technical and tooling documentation.
- `README.md` stays human-first and concise.

## Governance Skills

- Load `.opencode/skills/opencode-governance-authoring` when creating or updating repo-local OpenCode governance.
- Load `.opencode/skills/continuous-learning` when reviewing repeated user requests, recurring workflow friction, or likely governance improvement opportunities.

## Portability Rules

- Do not rely on `.opencode/memory/` or workspace session backup flows.
- Do not assume host `~/.config/opencode` is available inside the devcontainer.
- Keep repo-local MCP definitions in `opencode.json`.
- When governance changes affect startup or tooling, update spec, tests, and docs in the same change.
