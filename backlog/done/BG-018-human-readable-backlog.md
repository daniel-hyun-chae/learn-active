# BG-018: Human-readable backlog with acceptance criteria

Priority: P0
Status: Done
Theme: Foundation

## Why now

Backlog items written in developer-centric "Scope" format are hard to verify and tend to drift into implementation prescriptions. Switching to user-perspective "What changes" and testable "Acceptance criteria" makes items readable by non-developers, aligns them with evaluation criteria, and reduces ambiguity during implementation.

## What changes

Every backlog item uses a revised template with two new sections replacing "Scope": "What changes" (written from the user's perspective, describing observable behavior) and "Acceptance criteria" (verifiable present-tense outcomes). The backlog README includes a vocabulary table that locks domain terms to their glossary definitions, writing guidance for both sections, and a description of how the change-orchestrator refines acceptance criteria into evaluation entries during implementation. All existing proposed items are rewritten to match the new template.

## Acceptance criteria

- Backlog README contains a vocabulary table mapping preferred terms to their glossary definitions.
- Backlog README contains writing guidance for "What changes" and "Acceptance criteria" sections.
- Backlog item template uses "What changes" and "Acceptance criteria" instead of "Scope".
- The backlog-planner agent instructions include guidance for writing user-perspective descriptions and testable acceptance criteria.
- The change-orchestrator agent instructions include a step to refine acceptance criteria into evaluations entries with EVAL-IDs and backlog source traceability.
- The evaluations README describes the Source convention for backlog traceability.
- All proposed backlog items (BG-004, BG-007 through BG-015) use the new template format.
- No proposed item contains a "Scope" section.

## Out of scope

- Rewriting completed (Done) backlog items to the new template.
- Changing the evaluation criteria format beyond adding Source traceability.

## Dependencies

- BG-016 (backlog workflow must be established first).
- BG-017 (domain glossary must exist for vocabulary table).

## Notes

This is a governance-only change. No application code is modified. The vocabulary table sources its definitions from `architecture/domain-glossary.md`.

---

## Implementation Plan

1. Update `backlog/README.md` with new template, vocabulary table, and writing guidance.
2. Update `.opencode/agents/backlog-planner.md` with AC writing guidance and vocabulary reference.
3. Update `.opencode/agents/change-orchestrator.md` with AC-to-evaluations refinement step.
4. Update `evaluations/README.md` with Source convention and backlog traceability section.
5. Rewrite all 10 proposed backlog items (BG-004, BG-007 through BG-015) to new template.

## Task List

- [x] Update `backlog/README.md` -- new template with "What changes" + "Acceptance criteria", vocabulary table, writing guidance
- [x] Update `.opencode/agents/backlog-planner.md` -- AC writing guidance, vocabulary, user-perspective instructions
- [x] Update `.opencode/agents/change-orchestrator.md` -- added AC-to-evaluations refinement step
- [x] Update `evaluations/README.md` -- added Source convention and Backlog Traceability section
- [x] Rewrite BG-004 (learner attempt and progress persistence)
- [x] Rewrite BG-007 (wrong-answer review queue)
- [x] Rewrite BG-008 (publisher validation UX)
- [x] Rewrite BG-009 (offline attempt sync)
- [x] Rewrite BG-010 (reordering exercise end-to-end)
- [x] Rewrite BG-011 (course binder and collections)
- [x] Rewrite BG-012 (spaced practice and review mode)
- [x] Rewrite BG-013 (AI draft exercise generation)
- [x] Rewrite BG-014 (organization workspace v1)
- [x] Rewrite BG-015 (organization roles and invites)
- [x] Create BG-018 done file and update backlog README status

## Implementation Notes

- All 10 proposed items were rewritten from the old "Scope" format to the new "What changes" + "Acceptance criteria" format.
- Each rewrite preserves the original Why now, Out of scope, Dependencies, and Notes sections, updating them only for vocabulary consistency.
- The "What changes" sections describe user-observable behavior from the learner or publisher perspective.
- Acceptance criteria use present tense and are independently verifiable.
- No implementation details (table names, API endpoints, file paths) appear in the user-facing sections.

## Tests

- `pnpm test:unit` -> 4/4 passed
- `pnpm test:integration` -> 34/34 passed
- `pnpm test:e2e` -> 6/6 passed (smoke 1 + publisher e2e 5)
