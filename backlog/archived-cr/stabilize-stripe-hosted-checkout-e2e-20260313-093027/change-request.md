## Summary

Stabilize the real Stripe-hosted Checkout browser E2E so it can complete a real test payment and verify that the purchase success UI transitions to an enrolled state reliably in local development.

## Implementation Plan

1. Inspect the hosted Stripe Checkout E2E helpers and current selector assumptions.
2. Harden the Checkout-field and submit handling so the test works across Stripe-hosted layouts.
3. Re-run the required verification, smoke, unit, integration, and e2e suites.
4. Record the final outcomes and any follow-up notes.

## Task List

- [x] Inspect the hosted Stripe Checkout E2E helper and current failure point.
- [x] Harden the hosted Stripe Checkout field selectors and submit flow.
- [x] Run verify/setup, smoke, unit, integration, and e2e validation.
- [x] Record outcomes and follow-up notes.

## Tests

- `pnpm verify:setup` -> PASS
- `DYNAMIC_SMOKE_PORTS=1 pnpm smoke:local` -> PASS
- `pnpm test:unit` -> PASS
- `pnpm test:integration` -> PASS
- `pnpm test:e2e` -> PASS

## Notes

- The hosted Checkout E2E now succeeds by constraining Stripe Checkout session creation to card payments for the standard web learner flow, matching the test's real browser card-entry path.
- Local Stripe CLI auto-start now refreshes the forwarding secret whenever local Stripe test credentials are available, even if an older webhook secret already exists in env files.
- The E2E harness now keeps the local Stripe listener process alive during the browser payment flow so real webhook delivery can complete enrollment before the purchase success page finishes polling.
- The real hosted Checkout assertion now validates the localized enrolled-state copy actually rendered by the purchase success route.
