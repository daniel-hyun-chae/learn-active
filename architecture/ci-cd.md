# CI/CD Workflow

This repository deploys with GitHub Actions using a staged release model:

- Pull requests: validation only (no deploy).
- `main`: automatic staging deploy.
- Production: manual deploy only.

Local development workflow is unchanged (`pnpm dev`, local Supabase flow, and local smoke checks remain the same).

## Workflow structure

Workflows live in `.github/workflows/`:

- `ci-validation.yml`

  - Trigger: `pull_request` (all PRs)
  - Purpose: install dependencies, run lint/build, run unit/integration/e2e tests
  - Includes React Native checks (`@app/learners-mobile` lint) but no mobile deploy

- `deploy-staging.yml`

  - Trigger: push to `main`
  - Purpose: deploy API Worker and web Pages to staging
  - Includes monorepo change detection so unchanged deploy targets are skipped

- `deploy-production.yml`
  - Trigger: `workflow_dispatch`
  - Required input: `commit_ref`
  - Purpose: deploy API Worker and web Pages to production from an explicit ref
  - Guardrail: `commit_ref` must resolve to a commit reachable from `origin/main`

## Deployment flow

1. Open PR -> `CI Validation` runs.
2. Merge to `main` -> `Deploy Staging` runs automatically.
3. When ready for release -> manually run `Deploy Production` and provide `commit_ref`.

### Monorepo change detection

`Deploy Staging` computes changed files between the previous and current `main` commits:

- API deploy runs when API-relevant files changed.
- Web deploy runs when web-relevant files changed.
- Shared/root workspace changes trigger both API and web deploys.
- React Native-only changes do not trigger deploy jobs.

## Environment model

Staging and production use separate Cloudflare resources.

Hosted environment safety baseline:

- `localhost`, `127.0.0.1`, and `::1` URLs are local-only and must not be used by staging or production secrets.
- Hosted environment URLs must use `https`.

### Cloudflare Workers

- Staging: `course-api-staging`
- Production: `course-api`

### Cloudflare Pages

- Staging: `course-web-staging`
- Production: `course-web`

Important:

- The resources above must exist before deployment.
- Do not enable Cloudflare Git auto deploy for these resources.
- Deployments are performed by CI only.

## Required secrets

Use least-privilege Cloudflare API tokens.

### Repository secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Environment secrets

Store these in GitHub Environments:

- Environment `staging`:

  - `SUPABASE_PROJECT_URL_STAGING`
  - `SUPABASE_PUBLISHABLE_KEY_STAGING`
  - `API_URL_STAGING`
  - `WEB_URL_STAGING`
  - `STRIPE_SECRET_KEY_STAGING`
  - `STRIPE_PUBLISHABLE_KEY_STAGING`
  - `STRIPE_WEBHOOK_SECRET_STAGING`

- Environment `production`:
  - `SUPABASE_PROJECT_URL_PROD`
  - `SUPABASE_PUBLISHABLE_KEY_PROD`
  - `API_URL_PROD`
  - `WEB_URL_PROD`
  - `STRIPE_SECRET_KEY_PROD`
  - `STRIPE_PUBLISHABLE_KEY_PROD`
  - `STRIPE_WEBHOOK_SECRET_PROD`

## Deployment environment contract validation

Both deploy workflows execute `pnpm validate:deploy-env` before deploy steps.

- Staging: `pnpm validate:deploy-env -- --target staging`
- Production: `pnpm validate:deploy-env -- --target production`

Validation checks:

- Required environment secrets are present.
- Supabase project URL, API URL, and web URL are absolute `https` URLs.
- Hosted URLs do not target localhost variants.
- Expected hosted auth callback target is printed as `WEB_URL_<ENV>/auth`.
- Stripe staging/production credentials are present before deploy.

If validation fails, deploy is blocked.

### Stripe in hosted environments

- Local development can use Stripe CLI webhook forwarding.
- Staging and production do not depend on a long-running Stripe CLI session.
- API deploy jobs sync `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` into the target Worker as Cloudflare secrets before deploy.
- API deploy jobs pass `STRIPE_PUBLISHABLE_KEY` as a Worker variable during deploy.
- Use Stripe test-mode credentials for staging unless and until a live-mode production rollout is intentionally configured.

## Built web endpoint verification

Both web deploy jobs verify the compiled web assets contain the expected GraphQL endpoint before deploying to Cloudflare Pages.

- Staging runs:
  - `node scripts/verify-web-build-endpoint.mjs --dist apps/web/dist --expected "$API_URL_STAGING" --env staging`
- Production runs:
  - `node scripts/verify-web-build-endpoint.mjs --dist apps/web/dist --expected "$API_URL_PROD" --env production`

Verification behavior:

- Prints the expected endpoint and candidate embedded URL values discovered in build artifacts.
- Prints the built file paths that contain the expected endpoint.
- Fails deployment if the expected endpoint is not found in the compiled assets.

This makes secret/config updates observable and helps diagnose stale or incorrect endpoint bundles before deploy.

## Supabase Auth hosted redirect configuration

Supabase hosted Auth settings must be configured per hosted environment in the Supabase dashboard.

- Staging:
  - `site_url`: `WEB_URL_STAGING/auth`
  - Redirect allowlist includes `WEB_URL_STAGING/auth`
- Production:
  - `site_url`: `WEB_URL_PROD/auth`
  - Redirect allowlist includes `WEB_URL_PROD/auth`

Localhost callback URLs are local development only and must not be configured as hosted staging or production redirect targets.

Where to obtain values:

- `SUPABASE_PROJECT_URL_*`: Supabase dashboard -> Project -> Settings -> API -> Project URL.
- `SUPABASE_PUBLISHABLE_KEY_*`: Supabase dashboard -> Project -> Settings -> API -> Publishable key.
- `API_URL_*`: Cloudflare Workers -> select `course-api-staging` / `course-api` -> copy public domain/route (use GraphQL endpoint URL expected by web runtime).
- `WEB_URL_*`: Cloudflare Pages -> select `course-web-staging` / `course-web` -> copy public Pages/custom domain URL.
- `STRIPE_SECRET_KEY_*`: Stripe dashboard -> Developers -> API keys -> Secret key (use test-mode keys for staging).
- `STRIPE_PUBLISHABLE_KEY_*`: Stripe dashboard -> Developers -> API keys -> Publishable key.
- `STRIPE_WEBHOOK_SECRET_*`: Stripe dashboard -> Webhooks -> select the hosted endpoint for the environment -> Signing secret.

## Triggering production deployment

1. Open GitHub Actions.
2. Select `Deploy Production`.
3. Click `Run workflow`.
4. Enter `commit_ref` (commit SHA or ref reachable from `main`).
5. Run workflow.

If the ref is not reachable from `main`, workflow validation fails and deployment is blocked.

## Rollback strategy

Rollback is the same mechanism as production deploy:

1. Identify a previously known-good commit SHA from `main` history.
2. Re-run `Deploy Production`.
3. Set `commit_ref` to that previous SHA.

This re-deploys that previous revision to production.

## Redeploy previous commit

Use the same rollback steps above. A redeploy of an earlier commit is supported by design through `commit_ref`.
