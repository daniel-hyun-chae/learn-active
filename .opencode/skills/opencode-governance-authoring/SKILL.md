---
name: opencode-governance-authoring
description: Author or update repo-local OpenCode governance artifacts consistently, including rules, skills, agents, commands, MCP config, and supporting docs.
---

# OpenCode Governance Authoring

Use this skill when creating or editing repo-local OpenCode governance such as `AGENTS.md`, `opencode.json`, `.opencode/rules/`, `.opencode/skills/`, `.opencode/agents/`, or related architecture and decision docs.

## Taxonomy

- Put durable invariants in `rules`.
- Put explicit user-invoked actions in `commands`.
- Put reusable methods in `skills`.
- Put scoped delegation in `agents` only when containment clearly helps.
- Put external tool wiring in `opencode.json` under `mcp`.
- Treat CI and optional git hooks as hook-equivalent enforcement.
- Do not model memory as part of this repo's governance.

## Authoring Rules

- Keep the repo self-contained; do not depend on machine-global OpenCode rules, skills, agents, or MCP configuration.
- Keep `README.md` human-first; put deeper governance detail in `AGENTS.md`, `architecture/`, and `decision-log/`.
- Use `AGENTS.md` for repo-wide operating expectations and artifact conventions.
- Use `rules` only for always-true constraints. Move coaching, heuristics, and checklists into skills or agents.
- Add or update `decision-log/` when governance choices materially change repo operation or portability.
- Add or update `architecture/` when governance changes affect tooling architecture, startup behavior, or platform boundaries.
- Add or update `evaluations/` and matching tests when governance changes alter required behavior.

## Anti-Patterns

- Do not create user-facing commands for internal agent workflow steps.
- Do not create agents just to simulate parallelism or style preferences.
- Do not leave durable governance files disconnected from `opencode.json`.
- Do not mix repo-governed policy with ephemeral runtime state.
- Do not store durable policy in memory files.

## Review Checklist

- Verify each artifact matches the taxonomy.
- Verify repo-local MCP definitions are present when the repo depends on them.
- Verify rule loading in `opencode.json` covers every intended rule.
- Verify changed docs, evaluations, and tests reflect the new governance behavior.
