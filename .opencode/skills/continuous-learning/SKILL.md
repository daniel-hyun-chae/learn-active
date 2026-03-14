---
name: continuous-learning
description: Detect repeated user guidance or workflow friction and suggest durable repo-local governance improvements when patterns are strong enough to reuse.
---

# Continuous Learning

Use this skill while planning or wrapping up work when repeated requests, recurring friction, or repeated tool usage may justify a governance update.

## When To Suggest A Governance Update

- The user repeats the same instruction across tasks.
- A workflow expectation becomes stable enough to reuse.
- A recurring constraint should become a rule instead of repeated prompt text.
- A repeated method should become a skill.
- A repeated approval boundary may justify a command.
- A repeated external dependency may justify repo-local MCP configuration.
- A repeated narrow review responsibility may justify a dedicated agent.

## What To Suggest

- Recommend the smallest durable artifact that fits the pattern.
- Prefer rules for invariants, skills for methodology, commands for explicit user actions, and agents only for clear containment benefits.
- Keep suggestions brief, concrete, and optional.

## What Not To Suggest

- One-off troubleshooting steps.
- Temporary incidents or transient workaround instructions.
- Highly specific implementation details.
- Extra agents or commands without clear recurring value.

## Follow-Through

- If the user approves, update the relevant governance files in the same change.
- Keep the repository self-contained and avoid pushing learned preferences into global OpenCode config.
