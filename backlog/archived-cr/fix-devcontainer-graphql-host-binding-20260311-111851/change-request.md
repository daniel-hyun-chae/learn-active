## Summary

Fix local devcontainer GraphQL connectivity so the host browser can reach the API endpoint used by the web app during authenticated publisher flows.

## Implementation Plan

1. Update dev stack API startup to bind the local Wrangler server to all interfaces in devcontainer.
2. Verify local app behavior by opening the publish flow in a browser automation check.
3. Run required test suites and record commands/results.

## Task List

- [x] Update Wrangler dev startup to bind externally.
- [x] Validate publish flow via Playwright interactions.
- [x] Run unit tests.
- [x] Run integration tests.
- [x] Run e2e tests.

## Tests

- Playwright MCP: navigated to `http://localhost:4100/publish` and confirmed redirect to auth when unauthenticated.
- Playwright MCP in-browser fetch check:
  - Command: browser-evaluated `fetch('http://localhost:4000/graphql', { method: 'POST', body: '{ __typename }' })`
  - Result: `200 OK`, body includes `{"data":{"__typename":"Query"}}`
- Shell reachability check:
  - Command: `curl -sS -o /dev/null -w "%{http_code}" "http://localhost:4000/graphql"`
  - Result: `200`
- Unit tests:
  - Command: `pnpm test:unit`
  - Result: pass (2/2)
- Integration tests:
  - Command: `pnpm test:integration`
  - Result: pass (23/23)
- E2E tests:
  - Command: `pnpm test:e2e`
  - Result: pass (2 publisher e2e tests + smoke)
