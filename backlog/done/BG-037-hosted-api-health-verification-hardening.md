# BG-037: Hosted API health verification hardening

Priority: P1
Status: Done
Theme: Foundation
Spec: spec/platform.md > CI/CD > Staging deployment, spec/platform.md > CI/CD > Production deployment

## Why now

Main-branch staging deploy failed on hosted API health verification with Cloudflare Worker 1101 (`Worker threw exception`) returning preflight status 500. This blocks automatic staging rollout and obscures the runtime root cause.

## What changes

Harden hosted startup and deploy verification so post-deploy health checks do not fail due recoverable runtime bootstrap gaps. Worker startup should self-heal missing seed-owner prerequisites, and health verification should retry transient post-deploy failures before failing the workflow.

## Acceptance criteria

- Worker runtime seed bootstrap does not throw when system owner row is absent; it recreates required system owner state.
- Hosted API health verification script retries transient non-2xx responses with bounded backoff before final failure.
- Deployment diagnostics remain actionable (status, attempt count, response snippet).
- Integration coverage verifies the new startup hardening and health-check retry wiring.

## Out of scope

- Reworking deploy architecture or introducing external monitoring services.
- Changing staged/production environment secret model.

## Dependencies

- BG-022

## Notes

Incident signature: `verify-hosted-api-health` preflight status 500 with Cloudflare 1101 HTML page (`Worker threw exception`) on staging API URL.

---

## Implementation Plan

1. Make worker and node seed bootstrap paths self-heal missing system owner rows before selecting owner.
2. Add retry/backoff support to `scripts/verify-hosted-api-health.mjs` with clearer per-attempt diagnostics.
3. Extend integration tests to cover the retry behavior contract and bootstrap-hardening wiring.
4. Run CI-equivalent validation and tests.

## Task List

- [x] Harden seed bootstrap to upsert/create system owner when missing.
- [x] Add hosted API health script retry/backoff behavior with bounded attempts.
- [x] Update integration tests for bootstrap and retry behavior.
- [x] Run `pnpm validate:lockfile`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`.

## Implementation Notes

- Started from production incident report and existing BG-022 deploy-secret hardening context.
- Hardened seed bootstrap in both node and worker repository implementations to self-heal missing system owner by inserting `owners(type='system', name='__bootstrap_system_owner__')` before final owner selection.
- Added retry/backoff support in `scripts/verify-hosted-api-health.mjs` with configurable `--max-attempts` and `--retry-delay-ms`, per-attempt diagnostics, and response snippet logging for non-2xx responses.
- Added integration coverage for retry behavior plus startup bootstrap hardening wiring assertions.
- Updated `spec/platform.md` CI/CD deployment behavior to include hosted API health retry expectations and seed bootstrap self-healing requirement.

## Tests

- `pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass (includes known non-fatal local workerd noise logs during run)
