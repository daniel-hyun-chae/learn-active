## Summary

Enable Cloudflare Worker observability in repo-managed API deployment config so staging redeploys persist logs and traces in the dashboard for debugging runtime failures.

## Implementation Plan

1. Update the API Worker Wrangler config to enable observability.
2. Extend CI/CD evaluation coverage to require repo-managed Worker observability for hosted debugging.
3. Add or update tests that verify the API Wrangler config carries observability settings.
4. Run the relevant local validation and test commands.

## Task List

- [x] Enable observability in the API Worker Wrangler config.
- [x] Update evaluation criteria and tests for repo-managed observability.
- [x] Run local validation and relevant tests.
- [x] Record outcomes and redeploy follow-up notes.

## Tests

- `pnpm test:integration` -> PASS
- `pnpm test:unit` -> PASS
- `pnpm test:integration` -> PASS
- `pnpm test:e2e` -> PASS

## Notes

- `apps/api/wrangler.jsonc` now enables `observability.enabled = true`, so the next staging API deploy will carry repo-managed Cloudflare Worker logs/traces support.
- The staging deploy workflow already deploys the API with `wrangler.jsonc`, so no workflow changes were required beyond updating the config file.
- You must redeploy staging before dashboard observability data appears for new requests.
- Follow-up: the initial observability edit left trailing commas in `apps/api/wrangler.jsonc`, which Wrangler 3 rejected during local/e2e startup. The config was corrected to valid JSONC so `wrangler dev` and CI E2E can start again.
