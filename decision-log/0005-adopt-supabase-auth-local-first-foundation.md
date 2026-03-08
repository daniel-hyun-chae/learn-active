# Adopt Supabase Auth local-first foundation for web/mobile/API

Date: 2026-03-08
Status: Accepted

## Context

The platform needed first-class authentication and identity foundations without introducing production secret dependencies during development. The solution had to support Google OAuth and magic-link login across web and mobile, while keeping API authorization minimal for now and preserving future extensibility for role-based authorization, organizations, and enterprise SSO.

## Decision

Adopt Supabase Auth as the identity provider for this phase and implement local-first auth foundations using:

- `@supabase/supabase-js` for web and learners-mobile client auth/session handling.
- `jose` in the API for standards-based bearer JWT verification via Supabase JWKS.
- Expo auth/linking utilities (`expo-auth-session`, `expo-linking`, `expo-web-browser`) for mobile OAuth/magic-link callback handling.

Implement an app-level identity sync trigger from `auth.users` to `public.profiles` so application code can rely on profile records independent of Supabase business logic.

## Consequences

- Web and mobile now share a clear auth entry flow (Google + magic link only) with localized UI states.
- API now has reusable identity guard logic and request user context for protected operations.
- Local development remains independent of production Supabase secrets.
- Existing e2e publisher flow requires explicit auth bypass env flags to preserve non-interactive automation.
- Full authorization (roles, organizations, ownership, RLS policy model) remains deferred to later phases.

## Alternatives Considered

- Add email/password auth in v1 (rejected due higher support/complexity burden).
- Use Supabase service-role token introspection for all API checks (rejected; standards-based JWT verification is simpler and avoids admin coupling).
- Implement provider-specific auth logic directly in many components (rejected; centralized auth providers/hooks are cleaner and more maintainable).

## Links

- `apps/web/src/features/auth/`
- `apps/learners-mobile/src/features/auth/`
- `apps/api/src/features/auth/`
- `supabase/config.toml`
- `supabase/migrations/0002_auth_profile_sync.sql`
- `evaluations/auth-local-first.md`
