# Backlog

Single source of truth for planned and completed work items.

## Folder Structure

```
backlog/
  README.md            # this file -- conventions, priority table, next ID
  proposed/            # items not yet implemented (Proposed, Ready, Parked)
  done/                # implemented items (Done)
  archived-cr/         # historical change requests from before this structure
```

Status drives folder location:

- `Proposed`, `Ready`, `In Progress` -> item lives in `proposed/`.
- `Done` -> item moves to `done/`.
- `Parked` -> item stays in `proposed/` (status field distinguishes it).

## Agents

- **backlog-planner**: creates new items, updates scope, reprioritizes. Output is always `Proposed`.
- **change-orchestrator**: implements items. Reads backlog item as input, updates the relevant `spec/` files with new behaviors, updates item with implementation details, moves to `done/` when complete.

## Conventions

- Items use `BG-NNN` IDs for stable reference.
- Each item lives in its own file: `BG-NNN-short-slug.md`.
- Next available ID: `BG-022`.
- Priority tiers:
  - `P0` -- Foundation or blocker. Must be done before other work builds on it.
  - `P1` -- Next capability. Important for proving the core learning loop.
  - `P2` -- Valuable after foundation. Enhances the platform once basics work.
  - `P3` -- Later. Deferred until demand or dependencies are clear.
- Status lifecycle:
  - `Proposed` -- backlog-planner created or updated it.
  - `Ready` -- human approved it for implementation.
  - `In Progress` -- change-orchestrator is implementing it.
  - `Done` -- implementation complete, tests passed, file moved to `done/`.
  - `Parked` -- deferred, stays in `proposed/`.
- Only humans change status to `Ready`. Agents never set `Ready`.
- Dependencies reference other `BG-NNN` IDs.

## Vocabulary

Use these terms consistently across all backlog items. See `architecture/domain-glossary.md` for full definitions.

| Use this                     | Not this                            | Meaning                                                    |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| learner                      | student, user, end user             | A person consuming courses and taking exercises            |
| publisher                    | author, creator, content admin      | A person creating and managing course content              |
| course                       | class, program, curriculum          | The top-level content container                            |
| exercise                     | quiz, question, assessment, problem | An interactive assessment within a lesson                  |
| lesson                       | chapter, unit, section (as content) | A learning unit within a module                            |
| module                       | part, section, chapter              | A top-level grouping within a course                       |
| enrollment                   | subscription, registration, access  | A learner's relationship to a course                       |
| attempt                      | submission, answer, response        | A learner's recorded try at an exercise                    |
| owner                        | workspace, account                  | The entity that owns courses (personal or organization)    |
| content page                 | screen, slide, view                 | A page within a lesson                                     |
| course version               | revision, edition, snapshot         | A content snapshot with draft/published/archived lifecycle |
| draft / published / archived | active, inactive, live, old         | Course version lifecycle states                            |

## Writing Guidance

- **"What changes" section**: describe what the learner, publisher, or system does differently after this is built. Write from the user's perspective, not the developer's. Focus on observable behavior, not files or code.
- **"Acceptance criteria" section**: list verifiable outcomes a human can check. Use present tense ("Learner sees...", "Publisher receives..."). Each criterion should be independently testable. Avoid implementation detail.
- When the change-orchestrator completes implementation, the acceptance criteria dissolve into spec behaviors in the relevant `spec/` file.

## Item Template (Planning)

```
# BG-NNN: Title

Priority: P0 | P1 | P2 | P3
Status: Proposed
Theme: Foundation | Learner Experience | Content Engine | Publisher Tools | Organization
Spec: spec/<file>.md > <section> [, spec/<file>.md > <section>]

## Why now

<One or two sentences on why this matters at this stage.>

## What changes

<Human-readable description of what the learner, publisher, or system does differently
after this is built. Written from the user's perspective. Focus on observable behavior.>

## Acceptance criteria

- <Verifiable outcome in present tense. Example: "Learner sees a progress bar on the course page.">

## Out of scope

- <What is explicitly excluded.>

## Dependencies

- <BG-NNN references or "None".>

## Notes

<Optional context, open questions, or references to existing code.>
```

## Implementation Sections (added by change-orchestrator)

When implementation starts, the change-orchestrator appends these sections to the item file and keeps them updated throughout implementation. This ensures that if a session is interrupted, a new session can read the file and continue where it left off.

```
---

## Implementation Plan

1. <Step-by-step plan for implementation.>

## Task List

- [ ] <Unchecked tasks derived from the plan.>
- [x] <Checked tasks as they are completed.>

## Implementation Notes

<Running log of decisions, blockers, and context discovered during implementation. Updated continuously so a new session can pick up without loss.>

## Tests

- `pnpm validate:lockfile` -> <result>
- `pnpm lint` -> <result>
- `pnpm build` -> <result>
- `pnpm test:unit` -> <result>
- `pnpm test:integration` -> <result>
- `pnpm test:e2e` -> <result>
```

## Current Items

### P0 -- Foundation

| ID     | Title                                    | Status |
| ------ | ---------------------------------------- | ------ |
| BG-001 | Wire repository to real Postgres         | Done   |
| BG-002 | Personal ownership hardening             | Done   |
| BG-003 | Publisher-learner query boundary cleanup | Done   |

### P1 -- Next Capabilities

| ID     | Title                                    | Status   |
| ------ | ---------------------------------------- | -------- |
| BG-004 | Learner attempt and progress persistence | Done     |
| BG-005 | Exercise type abstraction                | Done     |
| BG-006 | Multiple-choice exercise end-to-end      | Done     |
| BG-007 | Wrong-answer review queue                | Proposed |

### P2 -- After Foundation

| ID     | Title                          | Status   |
| ------ | ------------------------------ | -------- |
| BG-008 | Publisher validation UX        | Proposed |
| BG-009 | Offline attempt sync           | Proposed |
| BG-010 | Reordering exercise end-to-end | Proposed |

### P3 -- Later

| ID     | Title                           | Status   |
| ------ | ------------------------------- | -------- |
| BG-011 | Course binder and collections   | Proposed |
| BG-012 | Spaced practice and review mode | Proposed |
| BG-013 | AI draft exercise generation    | Proposed |
| BG-014 | Organization workspace v1       | Proposed |
| BG-015 | Organization roles and invites  | Proposed |

### Governance

| ID     | Title                                           | Status |
| ------ | ----------------------------------------------- | ------ |
| BG-016 | Unify backlog and change-request workflow       | Done   |
| BG-017 | AI-native repo support                          | Done   |
| BG-018 | Human-readable backlog with acceptance criteria | Done   |
| BG-019 | Spec-driven documentation and testing patterns  | Done   |
| BG-020 | Pnpm lockfile major parity enforcement          | Done   |
| BG-021 | CI-equivalent lint and build gate enforcement   | Done   |
