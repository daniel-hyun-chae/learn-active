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

- Use `.opencode/agents/change-orchestrator.md` as the main conversational workflow.
- Keep planning, verification, and governance checks inside the orchestrator unless a user-facing command has a clear approval or execution boundary.
- Treat `implement` as the explicit approval to leave planning mode and start editing.

## Source Of Truth

- `evaluations/` defines acceptance criteria and test alignment.
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
- When governance changes affect startup or tooling, update evaluations, tests, and docs in the same change.
