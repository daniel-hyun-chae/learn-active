# Continuous Learning Rules

Purpose: capture durable, reusable preferences learned from the human during work.
The human will review this file and prune or adjust items that are too specific or irrelevant.

When to add a rule:

- The human explicitly asks for a preference to be remembered going forward.
- A preference repeats across tasks or reduces friction in future work.
- A workflow expectation becomes clear (e.g., how to verify, how to present results).

New rules to capture after this change:

- When adding or updating developer tooling (migrations/build/dev scripts), run the actual command end-to-end and align configs to the installed tool version before handing off.
- When introducing migrations to existing data, ensure baseline migrations are idempotent or provide a safe baseline step that preserves data.
- When installing CLI tools in devcontainers, install as the remote user and verify PATH/mounts so the tool runs without manual fixes.
- When editing devcontainer images, avoid assuming a `vscode` user unless the container user is explicitly set to `vscode`.
- Always run `pnpm verify:setup` and `pnpm smoke:local` before handoff; if issues are found, add or update app/infra tests to prevent regressions.
- For any reported reliability issue, add or update an app/infra test or evaluation so the failure is covered going forward.
- Default to using subagents for exploration and multi-step work to reduce context growth, and compact context early before usage reaches 80-90%.

When NOT to add a rule:

- One-off troubleshooting, transient errors, or temporary states.
- Sensitive data, secrets, or personal information.
- Highly specific implementation details unlikely to generalize.

How to write rules:

- Keep rules short and actionable.
- Make them general and durable, not tied to a single file or incident.
- Prefer "do" and "avoid" phrasing.

Maintenance:

- Re-evaluate after each task whether a new rule is needed.
- Update or remove rules that no longer reflect current expectations.
