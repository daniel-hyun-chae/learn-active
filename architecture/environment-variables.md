# Environment Variables and Secret Scope

This document is the source of truth for variables that are manually set by developers/operators.

## 1) Local developer variables (`.env` / `.env.local` from `.env.example`)

Use `.env.example` as the template. Keep real values only in local, untracked env files.

| Variable                                  | Purpose                                                                | Manual set?  | Notes                                                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                            | API/database connection string for local runtime                       | Optional     | Template includes local Supabase default (`54322`). Override only when needed.                                                                         |
| `SUPABASE_URL`                            | Supabase project URL for API auth verification and mobile URL fallback | Contextual   | Required for hosted API auth verification; local dev often derives equivalent behavior via tooling, but set explicitly when running non-default flows. |
| `SUPABASE_SERVICE_ROLE_KEY`               | Enables API Supabase-backed repository mode                            | Optional     | If absent, API falls back to in-memory repository in worker runtime.                                                                                   |
| `VITE_SUPABASE_URL`                       | Web Supabase URL runtime                                               | Contextual   | In local `pnpm dev`, auto-derived when possible; set manually for standalone web runs/builds.                                                          |
| `VITE_SUPABASE_PUBLISHABLE_KEY`           | Web Supabase publishable key runtime                                   | Contextual   | In local `pnpm dev`, auto-derived when possible; set manually for standalone web runs/builds.                                                          |
| `EXPO_PUBLIC_SUPABASE_URL`                | Mobile Supabase URL runtime                                            | Yes (mobile) | Mobile auth client uses this first, then falls back URL to `SUPABASE_URL`.                                                                             |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`    | Mobile Supabase publishable key runtime                                | Yes (mobile) | Required for mobile Supabase client initialization.                                                                                                    |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | Local Google OAuth provider wiring for Supabase                        | Optional     | Needed only when validating Google auth provider locally.                                                                                              |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`    | Local Google OAuth provider secret                                     | Optional     | Needed only when validating Google auth provider locally.                                                                                              |
| `VITE_GRAPHQL_ENDPOINT`                   | Web GraphQL endpoint                                                   | Optional     | Template defaults to local API endpoint.                                                                                                               |
| `GRAPHQL_ENDPOINT`                        | Shared/server GraphQL endpoint fallback                                | Optional     | Template defaults to local API endpoint.                                                                                                               |
| `EXPO_PUBLIC_GRAPHQL_ENDPOINT`            | Mobile GraphQL endpoint                                                | Optional     | Template defaults to local API endpoint.                                                                                                               |
| `APP_ENV`                                 | Stage selector (`local/staging/production`)                            | Optional     | Template default is `local`.                                                                                                                           |

## 2) GitHub repository secrets (manual set in repo secrets)

These are shared deploy credentials used by staging and production workflows:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 3) GitHub environment secrets (manual set per environment)

### Staging environment secrets

- `SUPABASE_PROJECT_URL_STAGING`
- `SUPABASE_PUBLISHABLE_KEY_STAGING`
- `API_URL_STAGING`
- `WEB_URL_STAGING`

### Production environment secrets

- `SUPABASE_PROJECT_URL_PROD`
- `SUPABASE_PUBLISHABLE_KEY_PROD`
- `API_URL_PROD`
- `WEB_URL_PROD`

Validation source of truth: `scripts/validate-deploy-env.mjs`.

## Cleanup summary (based on implementation references)

- Renamed runtime key names from legacy `ANON_KEY` wording to `PUBLISHABLE_KEY` contract in app/workflow/env template surfaces.
- Removed obsolete local legacy anonymous-key variable from env template.
- Removed API auth bypass contract and switched e2e flows to real auth with reusable storage state.
