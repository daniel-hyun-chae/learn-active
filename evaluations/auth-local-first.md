# Authentication Local-First Evaluations

## EVAL-AUTH-LOCAL-001: Auth entrypoints and localization readiness

Goal: Ensure web and mobile provide localized authentication entrypoints for local-first sign-in.
Criteria:

- The web app includes an `/auth` route with Google OAuth and magic-link entry actions.
- The learners mobile app includes an auth entry screen with Google OAuth and magic-link actions.
- Shared localization resources include all user-facing auth labels and state messages.

## EVAL-AUTH-LOCAL-002: Local-first Supabase auth configuration

Goal: Ensure auth can be implemented and exercised against local Supabase without production credentials.
Criteria:

- Supabase auth config defines local web redirect/callback URLs and mobile deep-link callback URLs.
- Supabase Google provider configuration is present using environment-variable placeholders only.
- Environment templates document Supabase URL/anon key variables for web and mobile runtimes.
- No committed repository values contain real production Supabase secrets.

## EVAL-AUTH-LOCAL-003: App-level identity synchronization

Goal: Ensure each authenticated Supabase user has an application-level profile row.
Criteria:

- A Supabase migration defines an auth-user to profile sync trigger/function.
- The migration maps `auth.users.id` to `public.profiles.user_id` and stores user email.
- Upsert behavior keeps profile email aligned for existing rows.

## EVAL-AUTH-LOCAL-004: Backend bearer verification and protected operations

Goal: Ensure protected API operations require authenticated identity from bearer tokens.
Criteria:

- Backend token verification exists for Supabase JWTs using issuer/JWKS derived from `SUPABASE_URL`.
- Protected course operations reject requests with missing, invalid, or expired tokens.
- Authenticated requests expose `request.user.id` in request context for downstream operations.
- Reusable auth guard logic is applied consistently to protected course operations.
