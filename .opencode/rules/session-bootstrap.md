# Session Bootstrap

Every agent session must start by reading orientation files before taking action. This ensures agents have structural and domain context from the first tool call.

## Required Reads (in order)

1. `architecture/codebase-map.md` -- what lives where in the repo.
2. `architecture/domain-glossary.md` -- precise definitions of domain terms.
3. `architecture/overview.md` -- system architecture and data flow.
4. `AGENTS.md` -- agent taxonomy, workflow, and source of truth locations.
5. `backlog/README.md` -- current backlog state and conventions.
6. `spec/README.md` -- product spec index and naming conventions for tests.

## When to Re-read

- Before modifying a domain area you have not touched in this session, re-read the relevant section of the codebase map.
- Before introducing or renaming a domain concept, check the glossary first.
- If a session resumes from a backlog item, read the item file before the backlog README.

## Rationale

AI agents lose all context between sessions. These six files give any agent enough orientation to make correct structural and naming decisions without exploratory tool calls. Keep them accurate and this rule eliminates the most common class of agent errors: wrong file locations, incorrect terminology, and duplicated implementations.
