# BG-039: Remove runtime self-healing from hosted bootstrap

Priority: P1
Status: Done
Theme: Foundation
Spec: spec/platform.md > CI/CD > Staging deployment, spec/platform.md > CI/CD > Production deployment

## Why now

Runtime self-healing that writes missing system-owner records during hosted API startup is undesirable in production behavior. Hosted deploy/runtime should fail explicitly when prerequisites are missing rather than mutating data at request time.

## What changes

Remove runtime owner auto-creation from hosted bootstrap code and rely on explicit validation/runbook diagnostics. Keep transient health-check retry behavior, but do not perform hidden runtime writes in hosted environments.

## Acceptance criteria

- Worker and node seed bootstrap paths no longer auto-create system owner rows.
- Runtime error behavior remains explicit when system-owner prerequisite is missing.
- Integration tests no longer assert runtime auto-healing behavior.
- CI-equivalent validation suite passes.

## Out of scope

- Replacing seed bootstrap model entirely.
- Adding new hosted migration execution workflow.

## Dependencies

- BG-037
- BG-038

## Notes

User requested avoiding surprising production-side runtime mutations.

---

## Implementation Plan

1. Revert self-healing owner creation in node/worker repository bootstrap paths.
2. Update integration assertions to reflect explicit bootstrap contract.
3. Run full validation and tests.

## Task List

- [x] Remove owner auto-create logic from runtime bootstrap.
- [x] Update integration tests accordingly.
- [x] Run `pnpm validate:lockfile`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`.

## Implementation Notes

- Reverted runtime owner auto-create logic in both node and worker seed bootstrap paths; bootstrap now remains explicit and throws when the `system` owner prerequisite is missing.
- Kept hosted health verification retry/backoff behavior from BG-037; only runtime mutation behavior was removed per user request.
- Updated integration assertions to stop requiring runtime owner auto-create code paths.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass (includes known non-fatal local workerd noise logs during run)
