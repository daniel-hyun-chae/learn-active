# Authentication

Identity, sign-in flows, session management, and backend token verification.

## Auth entrypoints

The web app provides an `/auth` route with Google OAuth and magic-link sign-in options. The mobile app provides an equivalent auth entry screen. All auth labels and state messages are localized through shared i18n resources.

### Behaviors

- Web app includes an `/auth` route with Google OAuth and magic-link entry actions.
- Mobile app includes an auth entry screen with Google OAuth and magic-link actions.
- Shared localization resources include all user-facing auth labels and state messages.

## Local-first Supabase auth configuration

Auth works against the local Supabase stack without production credentials. Environment templates document the required variables.

### Behaviors

- Supabase auth config defines local web redirect/callback URLs and mobile deep-link callback URLs.
- Supabase Google provider configuration uses environment-variable placeholders only.
- Environment templates document Supabase URL/publishable key variables for web and mobile runtimes.
- No committed repository values contain real production Supabase secrets.

## App-level identity synchronization

Every authenticated Supabase user automatically gets an application-level profile row. A database trigger maps `auth.users` to `public.profiles`.

### Behaviors

- A Supabase migration defines an auth-user to profile sync trigger/function.
- Migration maps `auth.users.id` to `public.profiles.user_id` and stores user email.
- Upsert behavior keeps profile email aligned for existing rows.

## Backend bearer verification

Protected API operations require authenticated identity from bearer tokens. The API verifies Supabase JWTs and exposes user identity in request context.

### Behaviors

- Backend token verification exists for Supabase JWTs using issuer/JWKS derived from SUPABASE_URL.
- Protected course operations reject requests with missing, invalid, or expired tokens.
- Authenticated requests expose `request.user.id` in request context.
- Reusable auth guard logic is applied consistently to protected course operations.

## Local magic-link usability

Local development provides a usable magic-link flow that delivers email to local Mailpit.

### Behaviors

- Local startup provides runtime Supabase auth configuration for the web auth route.
- The `/auth` magic-link send action is enabled when local auth configuration is present.
- Submitting a magic-link email in local runtime shows a successful send state in the UI.
- A corresponding magic-link email is observable in local Mailpit during e2e verification.
