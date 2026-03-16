# Summary

Investigate and fix local magic-link login behavior so users can submit the magic-link form and receive the email in Mailpit during local development. Add an e2e test that validates the flow and iterate until passing.

# Implementation Plan

1. Inspect current web auth UI and local auth configuration to identify why the magic-link action is not usable or not delivering locally.
2. Implement code/config updates so the send-magic-link action is available and triggers Supabase local email flow in dev.
3. Add or extend evaluation criteria for magic-link local behavior and add an e2e test that verifies submit behavior and Mailpit delivery.
4. Run unit, integration, and e2e tests; fix issues until green.

# Task List

- [x] Analyze current auth magic-link UI and local mail delivery path.
- [x] Implement fix for local magic-link submission/delivery behavior.
- [x] Add/update evaluation criteria for local magic-link behavior.
- [x] Add e2e test for magic-link flow including Mailpit verification.
- [x] Run `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e`; record results.

# Tests

- `pnpm test:unit`: passed (2/2).
- `pnpm test:integration`: passed (23/23).
- `pnpm test:e2e`: passed (3/3), including `local magic-link sends email to Mailpit @eval(EVAL-AUTH-LOCAL-005)`.
- During implementation, early e2e attempts timed out due startup/teardown race conditions. Added bounded startup waits and stronger process-group teardown in the new e2e test; final suite run completed successfully.
