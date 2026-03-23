# BG-038: Hosted API incident runbook for deploy failures

Priority: P1
Status: Done
Theme: Foundation
Spec: spec/platform.md > CI/CD > CI/CD documentation

## Why now

Recent staging deploy failures (`verify-hosted-api-health` with Worker 1101/500) show that responders need a deterministic triage flow to diagnose hosted runtime issues quickly and consistently.

## What changes

Add a concrete hosted API incident runbook to CI/CD documentation with exact commands and checks for health verification failures in staging/production deploy workflows.

## Acceptance criteria

- CI/CD docs include a hosted API incident runbook for staging/production deploy failures.
- Runbook includes log collection, worker secret/var checks, and manual preflight verification steps.
- Platform spec and integration tests are updated to keep the runbook requirement durable.

## Out of scope

- Implementing external alerting or pager integrations.
- Changing deployment architecture.

## Dependencies

- BG-037

## Notes

This item is documentation and governance hardening to speed mean-time-to-diagnosis for hosted incidents.

---

## Implementation Plan

1. Add a hosted API incident runbook section to `architecture/ci-cd.md` with actionable troubleshooting steps.
2. Update `spec/platform.md` CI/CD documentation behaviors to require the runbook.
3. Extend integration tests to enforce runbook presence in docs.
4. Run CI-equivalent validation commands and record outcomes.

## Task List

- [x] Add hosted API incident runbook section in CI/CD docs.
- [x] Update platform spec behavior for CI/CD documentation.
- [x] Update integration tests to assert runbook content.
- [x] Run `pnpm validate:lockfile`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`.

## Implementation Notes

- Started from user request for a practical hosted incident runbook after staging health verification failures.
- Added a concrete runbook in `architecture/ci-cd.md` with step-by-step diagnostics (context capture, `wrangler tail`, secret/var checks, manual OPTIONS preflight, GraphQL health probe, escalation checklist).
- Added platform spec behavior requiring hosted API incident runbook coverage and integration assertions to keep docs durable.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass (includes known non-fatal local workerd noise logs during run)
