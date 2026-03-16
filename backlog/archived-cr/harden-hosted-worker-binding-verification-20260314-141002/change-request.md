## Summary

Keep hosted runtime fail-fast behavior, identify why staging now fails despite unchanged GitHub secrets, and harden deploy workflows so missing or dropped Worker bindings fail transparently during deployment instead of surfacing only as runtime outages.

## Implementation Plan

1. Root-cause the current staging regression by comparing runtime requirements against the staging deploy flow.
2. Add deploy-time guards so hosted API deploys explicitly pass required Worker bindings and fail when they are absent.
3. Add post-deploy verification that the hosted API responds successfully after deployment.
4. Update evaluations, tests, and documentation to capture the new hosted binding verification behavior.
5. Run validation suites and record the findings.

## Task List

- [x] Root-cause the current staging regression from app/runtime and deploy logic.
- [x] Add deploy-time and post-deploy hosted Worker binding verification.
- [x] Update evaluations, tests, and documentation.
- [x] Run validation suites.
- [x] Record outcomes and follow-up notes.

## Tests

- `pnpm test:unit` -> PASS
- `pnpm test:integration` -> PASS
- `SUPABASE_URL="https://example.supabase.co" STRIPE_PUBLISHABLE_KEY="pk_test_123" pnpm --filter @app/api deploy:worker:staging` -> Verified Wrangler now receives `--var SUPABASE_URL:... --var STRIPE_PUBLISHABLE_KEY:... --keep-vars` directly (stopped only by missing Cloudflare token in local shell)

## Root Cause Notes

- The app runtime now intentionally fails fast in hosted environments when `SUPABASE_URL` is absent, via `loadWorkerRuntimeEnv()` in `apps/api/src/runtime/env.ts`.
- The GitHub secret naming convention is still correct; the staging failure is not caused by `_STAGING` secret naming drift.
- The deploy workflows were invoking `pnpm --filter @app/api deploy:worker:* -- --var ...`, but pnpm forwarded those extras as literal `"--" "--var" ...` arguments into the nested script rather than as actual Wrangler flags.
- That means the deploy step looked like it was passing `SUPABASE_URL` and `STRIPE_PUBLISHABLE_KEY`, but Wrangler was not receiving them as intended.
- Combined with missing post-deploy API verification, the first visible failure showed up only after staging traffic hit the Worker and hosted runtime failed fast on missing `SUPABASE_URL`.

## Notes

- Hosted runtime fail-fast behavior was preserved.
- API deploy now uses `scripts/deploy-api-worker.mjs`, which passes required hosted Worker vars directly to Wrangler and also preserves existing vars with `--keep-vars`.
- Staging and production deploy workflows now run `scripts/verify-hosted-api-health.mjs` immediately after API deploy and fail if the deployed Worker returns a non-2xx preflight response or omits CORS headers.
- This makes the current class of failure transparent in CI instead of only surfacing later as a browser CORS symptom backed by a Worker runtime exception.
- The failed staging verification you observed is consistent with the old broken deploy path: the Worker version was deployed without Wrangler receiving the intended hosted vars. Redeploying with the new scripted deploy path should repair staging, and the health-check step will confirm it immediately.
