# Summary

Introduce Supabase authentication in a local-first setup across web and learners-mobile, with backend bearer-token verification and profile synchronization. This phase enables Google OAuth and magic link login only, protects all current app routes and course API operations, and establishes a minimal authenticated user context without implementing full authorization or role models.

# Implementation Plan

1. Update local Supabase auth configuration for local redirects and provider structure (Google + magic link path support).
2. Update environment templates and runtime conventions for Supabase URL/key variables (including VITE aliases for web).
3. Add frontend/mobile/backend dependencies needed for Supabase auth and token verification.
4. Add a Supabase migration to auto-create profile rows from `auth.users` via trigger/function.
5. Add shared auth infrastructure in web (client, provider, hook, session bootstrap, guarded routing).
6. Add `/auth` entry page in web with Google + magic link initiation and state handling.
7. Add mobile auth bootstrap and auth entry flow (Google + magic link) with session restoration.
8. Add backend bearer-token verification and reusable protection helpers.
9. Enforce protected access on course operations in API.
10. Update evaluations and automated tests for identity/auth foundations and protected behavior.
11. Update documentation (auth overview, local setup, env variables, testing, and limitations).
12. Run `test:unit`, `test:integration`, and `test:e2e`; capture commands and outcomes.

# Task List

- [x] Update Supabase local auth config for redirects and provider settings.
- [x] Update auth environment variable templates and client runtime mapping.
- [x] Add Supabase/JWT dependencies for web, mobile, and API.
- [x] Add profile auto-sync migration (`auth.users` -> `public.profiles`).
- [x] Implement web auth provider/hook/session bootstrap and route guards.
- [x] Implement web `/auth` page with Google and magic link login actions.
- [x] Implement mobile auth flow and session bootstrap (Google + magic link).
- [x] Implement backend bearer-token verification and reusable auth helpers.
- [x] Protect all course GraphQL operations with authentication.
- [x] Add/update evaluations and tests for auth flows and protection behavior.
- [x] Update documentation for local-first Supabase auth operation.
- [x] Run `test:unit`, `test:integration`, and `test:e2e` and record results.

# Tests

- `pnpm test:unit` -> PASS (2 passed, 0 failed)
- `pnpm test:integration` -> FAIL initially (1 failing assertion in `tests/integration/graphql-skeleton.test.js`), then PASS after fix (17 passed, 0 failed)
- `pnpm test:e2e` -> FAIL initially (publisher flow timeout after auth protection), then PASS after test env bypass fix (2 passed, 0 failed)
