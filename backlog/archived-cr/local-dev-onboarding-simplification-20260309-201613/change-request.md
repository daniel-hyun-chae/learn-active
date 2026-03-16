# Summary

Simplify developer onboarding and command surface so local development is crystal clear for humans while preserving strong guardrails for agentic development. Make `pnpm db:up` then `pnpm dev` the obvious default for fresh devcontainer users, keep essential verification and test commands, reduce non-essential script exposure, and reorganize docs so architecture and decisions are easier to navigate over time.

# Implementation Plan

1. Create a reduced root script surface focused on human local development and guardrails.
2. Preserve internal startup behavior by keeping internal script files and adjusting internal call paths when public aliases are removed.
3. Rewrite README to prioritize quickstart and local/staging/production clarity with high-level guidance and links.
4. Move CI/CD runbook content into architecture docs and update references.
5. Add a decision-log entry documenting command-surface and documentation-structure decisions.
6. Update evaluation criteria and integration tests to match the simplified command/documentation contract.
7. Run unit, integration, and e2e tests and record results.

# Task List

- [x] Simplify root scripts in `package.json` while keeping required guardrails.
- [x] Update internal scripts to remove dependency on removed public script aliases.
- [x] Rewrite `README.md` with clear devcontainer-first onboarding and minimal human command set.
- [x] Consolidate CI/CD runbook under `architecture/` and update links.
- [x] Add a decision log entry for this simplification.
- [x] Update `evaluations/` criteria and integration tests for the new contract.
- [x] Run `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e`; record outcomes.

# Tests

- `pnpm test:unit` (first run): failed with assertion in `tests/unit/architecture-doc.test.js` expecting `architecture/overview.md` to include `evaluations/platform-initialization.md`.
- Fix applied: added `Platform initialization evaluation: evaluations/platform-initialization.md` reference to `architecture/overview.md`.
- `pnpm test:unit` (re-run): passed (2/2).
- `pnpm test:integration`: passed (23/23).
- `pnpm test:e2e`: passed (2/2).
