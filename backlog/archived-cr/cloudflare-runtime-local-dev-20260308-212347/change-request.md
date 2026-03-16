# Summary

Refactor the platform for Cloudflare compatibility while preserving local-first development.
The API will run as a Cloudflare Worker with runtime-specific concerns isolated behind adapters, the web will target Cloudflare Pages static deployment (no SSR dependency in production), and local development for web, API, and mobile will remain fully functional.

Scope for this CR is limited to compatibility and local development readiness; auth implementation changes, CI/CD setup, and staging deploy execution are out of scope.

# Implementation Plan

1. Split API runtime boot from portable app logic and add a Cloudflare Worker entrypoint.
2. Introduce centralized typed runtime environment access and remove deploy-path ad hoc env reads.
3. Add runtime adapter boundaries (env/http/logger/crypto as needed) and implement DB adapter strategy for local and Worker runtimes with identical domain/service contracts.
4. Update web for Cloudflare Pages static deployment and environment-based API endpoint resolution.
5. Add per-app Cloudflare configuration and deterministic local build/dev/deploy scripts.
6. Update local workflow docs and evaluations for Cloudflare compatibility + local readiness, including React Native -> local Wrangler API validation.
7. Run required verification commands and tests; record results.

# Task List

- [x] Extract API app initialization from Node listen boot and add Worker fetch entrypoint.
- [x] Implement centralized typed env module for API/Web runtime access.
- [x] Add runtime adapter boundaries and wire context/auth through adapters.
- [x] Implement local + Worker DB adapters while preserving identical domain/service contracts.
- [x] Configure web static Cloudflare Pages target and remove production Node-server dependency.
- [x] Add separate `wrangler.jsonc` files and Cloudflare-focused scripts for API and web.
- [x] Validate local web + local Wrangler API + mobile integration path.
- [x] Update `evaluations/` criteria and related tests with required evaluation IDs.
- [x] Run `pnpm verify:setup`, `pnpm smoke:local`, `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e`.

# Tests

- `pnpm --filter @app/api build` -> PASS
- `pnpm --filter @app/web build` -> PASS
- `pnpm --filter @app/api exec wrangler dev --config wrangler.jsonc --port 4000 --var API_AUTH_BYPASS_FOR_E2E:true` -> PASS (local startup confirmed)
- `pnpm --filter @app/api build` -> PASS
- `pnpm --filter @app/web build` -> PASS
- `pnpm verify:setup` -> PASS
- `pnpm smoke:local` -> PASS
- `pnpm test:unit` -> PASS
- `pnpm test:integration` -> PASS
- `pnpm test:e2e` -> PASS
