# OpenCode Governance

This repository keeps OpenCode governance self-contained so the same structure can be reused for other products without depending on machine-global configuration.

## Source of truth

- `AGENTS.md` defines the repo-local operating contract and artifact taxonomy.
- `opencode.json` loads repo-local rules and owns repo-local MCP configuration.
- `.opencode/rules/` stores durable invariants.
- `.opencode/skills/` stores reusable methodology.
- `.opencode/agents/` stores scoped agent workflows. The primary workflow is `change-orchestrator`.

## Taxonomy

- Rules: always-true constraints.
- Commands: explicit user-invoked actions only.
- Skills: reusable methods for recurring work.
- Agents: scoped delegation only when containment clearly helps.
- MCP: repo-local external tools and observation.
- Hooks-equivalent: CI and optional git hooks.
- Memory: not part of this repo's governance model.

## Primary workflow

- `change-orchestrator` remains the main UX surface.
- The user discusses the change conversationally.
- The agent proposes and refines a plan before implementation.
- Editing starts only after the user explicitly says `implement`.
- During planning, the agent may suggest governance improvements when repeated patterns justify a durable artifact.

## Portability rules

- Repo-local governance must work without host `~/.config/opencode`.
- Repo-local MCP configuration lives in `opencode.json`.
- Session backup and memory flows are not part of the governance model.
- Governance changes that affect startup or tooling must update docs, evaluations, and tests in the same change.
