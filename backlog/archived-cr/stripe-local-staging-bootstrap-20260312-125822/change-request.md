## Summary

Make Stripe work reliably for paid-course authoring in local development and staging. Local development should auto-wire Stripe CLI webhook forwarding so paid course saves do not fail just because the current `whsec` value was not copied into `.env`, and the devcontainer should include Stripe CLI plus automatic OpenCode session backup/restore on startup. Staging should use Stripe test-mode credentials and an explicit webhook secret, with docs and validation updated to make the required configuration clear.

## Implementation Plan

1. Inspect current dev/setup/runtime scripts and Stripe service wiring to find the correct bootstrap points.
2. Implement a local-only Stripe CLI auto-wiring flow for webhook secret discovery while preserving strict env-based configuration for non-local stages.
3. Update environment validation and documentation for staging Stripe test-mode configuration.
4. Add or update evaluation coverage for local Stripe bootstrap and staged env requirements.
5. Add Stripe CLI to the devcontainer image/setup and document the out-of-box local workflow.
6. Add automatic OpenCode session backup/restore on devcontainer start so rebuilt containers repopulate `/session` from workspace backups.
7. Run verify, smoke, unit, integration, and e2e tests and record the outcomes.

## Task List

- [x] Inspect current Stripe setup/dev scripts and identify implementation points.
- [x] Implement local Stripe CLI auto-wiring and staging env support updates.
- [x] Update docs and evaluation criteria for Stripe local/staging behavior.
- [x] Add Stripe CLI to the devcontainer image/setup and update docs/tests.
- [x] Add automatic OpenCode session backup/restore on devcontainer start.
- [x] Fix local checkout, paid-course enrollment, and e2e reliability issues.
- [x] Run verify/setup, smoke, unit, integration, and e2e tests; record results.
- [x] Summarize required GitHub secrets for staging.

## Tests

- Initial validation pass before devcontainer update:
  - `pnpm verify:setup` -> PASS
  - `pnpm smoke:local` -> FAIL on first attempt because port `4000` was already in use.
  - `DYNAMIC_SMOKE_PORTS=1 pnpm smoke:local` -> PASS using fallback ports (`api=4001`, `web=4101`).
  - `pnpm test:unit` -> PASS
  - `pnpm test:integration` -> PASS
  - `pnpm test:e2e` -> PASS

- Validation pass after adding Stripe CLI to the devcontainer:
  - `pnpm verify:setup` -> PASS
  - `DYNAMIC_SMOKE_PORTS=1 pnpm smoke:local` -> PASS
  - `pnpm test:unit` -> PASS
  - `pnpm test:integration` -> PASS
  - `pnpm test:e2e` -> PASS

- Validation pass after adding automatic OpenCode session backup/restore:
  - `pnpm verify:setup` -> PASS
  - `DYNAMIC_SMOKE_PORTS=1 pnpm smoke:local` -> PASS
  - `pnpm test:unit` -> PASS
  - `pnpm test:integration` -> PASS
  - `pnpm test:e2e` -> PASS

- Validation pass after fixing local Stripe Worker binding propagation:
  - `pnpm verify:setup` -> PASS
  - `DYNAMIC_SMOKE_PORTS=1 pnpm smoke:local` -> PASS
  - `pnpm test:unit` -> PASS
  - `pnpm test:integration` -> PASS
  - `pnpm test:e2e` -> FAIL in `tests/e2e/publisher-flows.test.js` before hook (`publisher auth fixture stores reusable magic-link session`)

- Validation pass after fixing local checkout + paid enrollment flow:
  - `pnpm verify:setup` -> PASS
  - `DYNAMIC_SMOKE_PORTS=1 pnpm smoke:local` -> PASS
  - `pnpm test:unit` -> PASS
  - `pnpm test:integration` -> PASS
  - `pnpm test:e2e` -> PASS

- Validation pass after fixing purchase-success auth polling:
  - `pnpm verify:setup` -> PASS
  - `DYNAMIC_SMOKE_PORTS=1 pnpm smoke:local` -> PASS
  - `pnpm test:unit` -> PASS
  - `pnpm test:integration` -> PASS
  - `pnpm test:e2e` -> PASS

- Validation pass after adding local dev cleanup command:
  - `pnpm verify:setup` -> PASS
  - `DYNAMIC_SMOKE_PORTS=1 pnpm smoke:local` -> PASS
  - `pnpm test:unit` -> PASS
  - `pnpm test:integration` -> PASS
  - `pnpm test:e2e` -> PASS

- Validation pass after broadening Stripe webhook fulfillment handling:
  - `pnpm verify:setup` -> PASS
  - `DYNAMIC_SMOKE_PORTS=1 pnpm smoke:local` -> PASS
  - `pnpm test:unit` -> PASS
  - `pnpm test:integration` -> PASS
  - `pnpm test:e2e` -> PASS

Notes:

- `pnpm verify:setup` completed the repo startup verification and build successfully.
- The initial smoke failure was environmental (port conflict), not an application regression.
- Integration and e2e suites passed after the Stripe/local/staging changes.
- Devcontainer setup now installs Stripe CLI in the image and verifies `stripe --version` during `postCreateCommand`.
- Devcontainer startup now runs `node scripts/devcontainer-sync-opencode-sessions.mjs` to export visible sessions into `.opencode/session-backups/` and auto-import them when the local OpenCode session list is empty.
- Local API startup now passes Stripe values into `wrangler dev` as explicit Worker bindings, fixing paid-course saves that still saw `Stripe is not configured in this environment.` despite `.env` values being present.
- Checkout creation now uses the browser request origin (`Origin`/`Referer`) instead of the API origin, and Stripe checkout errors are surfaced to clients instead of a generic `Unexpected error.`.
- Paid EUR courses now enforce Stripe's minimum charge (`>= 50` cents) before Stripe API calls.
- Worker-mode webhook handling now intercepts `/api/webhooks/stripe` directly in `worker.ts`, which fixed local paid enrollment completion under `wrangler dev`.
- A paid publish + checkout + signed webhook enrollment e2e flow now exists in `tests/e2e/publisher-flows.test.js`.
- `pnpm test:e2e` now runs publisher e2e through `scripts/run-publisher-e2e.mjs`, which treats a fully passing TAP run as success and avoids the lingering Node test-runner hang from the long-lived local stack harness.
- The web purchase-success route now refreshes the active web session and sets the GraphQL access-token provider before polling `courseEnrollmentStatus`, which fixes the misleading `Unable to start checkout right now.` message after a successful Stripe payment.
- Local development now includes `pnpm dev:cleanup`, backed by `scripts/cleanup-dev-stack.mjs`, to terminate orphaned `wrangler dev`, `vite preview`, and dev-stack Node processes when ports stay occupied after an interrupted local run.
- Stripe webhook fulfillment now accepts both `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and e2e coverage verifies that enrollment flips to active in both the immediate and async-success webhook cases.
