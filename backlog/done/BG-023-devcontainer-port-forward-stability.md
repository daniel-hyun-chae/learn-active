# BG-023: Devcontainer port-forward stability for local Supabase auth

Priority: P0
Status: Done
Theme: Foundation
Spec: spec/platform.md > Devcontainer

## Why now

Local auth and Mailpit flows are intermittently unusable in devcontainer because forwarded Supabase ports can appear on random host ports. This blocks login troubleshooting and slows staging/auth setup work.

## What changes

Devcontainer and local Supabase defaults move to non-reserved local ports so auth and Mailpit remain reachable on stable host ports, including Windows hosts with reserved `54xxx` port ranges. Documentation and integration coverage make the forwarding contract explicit and prevent regression.

## Acceptance criteria

- Devcontainer config explicitly forwards web/api ports and Supabase local ports used by browser auth and Mailpit.
- Devcontainer config requires local-port parity for forwarded Supabase auth and Mailpit ports.
- Local Supabase default ports avoid Windows excluded `54xxx` ranges for API/auth, database, studio, and Mailpit.
- Integration tests fail if devcontainer forwarding contract is removed or changed.
- Platform spec documents the forwarded-port stability behavior.
- README includes troubleshooting guidance for auth failures caused by incorrect forwarded ports.

## Out of scope

- Staging/production auth provider setup.

## Dependencies

- None.

## Notes

This is a local devcontainer reliability fix. It does not change product runtime behavior in hosted environments.

---

## Implementation Plan

1. Update `.devcontainer/devcontainer.json` to enforce stable local forwarding for Supabase auth and Mailpit ports.
2. Add integration assertions for forwarded ports and `portsAttributes` local-port parity.
3. Move local Supabase default ports from `54xxx` to non-reserved `15xxx` range and update local tooling references.
4. Update platform spec and README troubleshooting guidance.
5. Run full CI-equivalent validation/test suite.

## Task List

- [x] Update devcontainer forwarded port attributes for stable local mapping.
- [x] Add integration test coverage for Supabase/Mailpit forwarding contract.
- [x] Move local Supabase default ports from `54xxx` to `15xxx` and update references.
- [x] Update platform spec and README troubleshooting guidance.
- [x] Run validation and test suite; record outcomes.

## Implementation Notes

- 2026-03-16: Created ad-hoc backlog item from implementation session after user-reported local auth failures caused by devcontainer forwarded ports using random host ports.
- 2026-03-16: Added `portsAttributes` with `requireLocalPort: true` for 4000/4100/15421/15424 in `.devcontainer/devcontainer.json`.
- 2026-03-16: Extended `tests/integration/docker-dev-compose.test.js` to enforce Supabase/Mailpit forwarded ports and local-port parity requirements.
- 2026-03-16: Updated local Supabase default ports to `15421/15422/15423/15424` in `supabase/config.toml`, local scripts, compose defaults, docs, and tests to avoid Windows-reserved `54xxx` ranges.
- 2026-03-16: Added `VITE_SUPABASE_FORWARD_PORT` browser override support in web runtime normalization and set default in `scripts/dev-stack.mjs` for stable devcontainer browser auth connectivity.
- 2026-03-16: Added `VITE_GRAPHQL_FORWARD_PORT` browser override support in web runtime normalization and `scripts/dev-stack.mjs` to prevent GraphQL fetch failures when API is forwarded to non-default local ports.
- 2026-03-16: Updated `spec/platform.md`, `architecture/environment-variables.md`, and `README.md` to document non-reserved local ports and forwarding behavior.
- 2026-03-16: Regenerated `pnpm-lock.yaml` with `corepack pnpm@9.12.2` so lockfile major parity now matches repository-declared pnpm major.
- 2026-03-16: Validation summary: `corepack pnpm validate:lockfile`, `pnpm lint`, `pnpm build`, `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e` all passed.
- 2026-03-16: User confirmed Windows host excluded port ranges include `54278-54377`, which blocks stable binding for `54321-54324`; implementation expanded to move local defaults to `15xxx` ports.

## Tests

- `corepack pnpm validate:lockfile` -> pass
- `pnpm lint` -> pass
- `pnpm build` -> pass
- `pnpm test:unit` -> pass
- `pnpm test:integration` -> pass
- `pnpm test:e2e` -> pass
