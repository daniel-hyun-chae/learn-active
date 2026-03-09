# Environment and Auth Redirect Governance

This rule standardizes environment behavior across local, staging, and production for all agentic sessions.

## Environment Contract

- `local` is for developer machines and Supabase local stack.
- `staging` is a hosted cloud environment for pre-production validation.
- `production` is hosted cloud and release gated.

Environment-specific values must come from environment-scoped secret storage, not committed files.

## Secret and Variable Naming

Staging uses `_STAGING` suffix and production uses `_PROD` suffix.

- `SUPABASE_PROJECT_URL_<SUFFIX>`
- `SUPABASE_PUBLISHABLE_KEY_<SUFFIX>`
- `API_URL_<SUFFIX>`
- `WEB_URL_<SUFFIX>`

Repository-level Cloudflare credentials remain shared:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

## URL Safety Rules

- `localhost`, `127.0.0.1`, and `::1` URLs are allowed only in `local`.
- `staging` and `production` must use hosted HTTPS URLs for API, web, and Supabase project URL.
- Deploy workflows must fail before deploy if non-local URL safety checks fail.

## Supabase Auth Redirect Rules

For hosted environments, Supabase Auth settings in each hosted Supabase project must match the corresponding web environment.

- Staging:
  - `site_url` must be `WEB_URL_STAGING/auth`.
  - Redirect allowlist must include the same staging `/auth` callback target.
- Production:
  - `site_url` must be `WEB_URL_PROD/auth`.
  - Redirect allowlist must include the same production `/auth` callback target.

`localhost` auth redirect targets are local-only and must not be configured in hosted staging or production projects.

## Source of Truth and Drift

- Database schema changes are migration-driven and committed in-repo.
- Hosted dashboard schema edits are emergency-only.
- Any emergency hosted SQL change must be captured immediately in a follow-up migration to remove drift.

## Deployment Order and Compatibility

- Staging deploy is automatic on `main`.
- Production deploy is manual-only.
- DB migrations and app deploy must preserve compatibility for at least one release window.
- Destructive schema changes must follow phased expand/migrate/contract rollout.
