# Keep OpenCode governance self-contained

Date: 2026-03-12
Status: Accepted

## Context

The repository had meaningful engineering governance, but the OpenCode layer depended on machine-global configuration and local session backup conventions. Repo-local rules were only partially loaded, MCP definitions lived in global config, and the repo modeled memory as part of its workflow even though memory was not intended to be part of the portable governance template.

## Decision

Keep OpenCode governance self-contained in the repository.

- Add a repo-local `AGENTS.md` that defines taxonomy, workflow expectations, and portability rules.
- Make `opencode.json` the repo-local source of truth for rule loading and MCP definitions.
- Load rules from `.opencode/rules/*.md` so durable governance files are not silently disconnected.
- Replace the old continuous-learning rule with repo-local skills for governance authoring and continuous learning.
- Keep `change-orchestrator` as the main conversational workflow and extend it to suggest governance improvements when repeated patterns justify them.
- Remove memory and session-backup concepts from the governance model and devcontainer workflow.

## Consequences

- Repo behavior becomes more portable across contributors and future product repositories.
- Devcontainer startup no longer depends on host `~/.config/opencode` or workspace session backup flows.
- Governance taxonomy becomes clearer: rules for invariants, skills for methodology, agents for workflow containment only when needed.
- The devcontainer now needs local support for repo-owned MCP launchers such as `uvx` for `code-index`.

## Alternatives Considered

- Keep relying on machine-global OpenCode config and mounted host settings.
- Keep continuous learning as an always-on rule instead of a reusable skill.
- Expose more user-facing commands instead of keeping workflow stages inside the primary agent.

## Links

- `AGENTS.md`
- `opencode.json`
- `architecture/opencode-governance.md`
- `evaluations/portable-startup.md`
