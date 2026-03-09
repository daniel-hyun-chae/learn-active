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

- Environment `production`:
  - `SUPABASE_PROJECT_URL_PROD`
  - `SUPABASE_PUBLISHABLE_KEY_PROD`
  - `API_URL_PROD`
  - `WEB_URL_PROD`

Where to obtain values:

- `SUPABASE_PROJECT_URL_*`: Supabase dashboard -> Project -> Settings -> API -> Project URL.
- `SUPABASE_PUBLISHABLE_KEY_*`: Supabase dashboard -> Project -> Settings -> API -> Publishable key.
- `API_URL_*`: Cloudflare Workers -> select `course-api-staging` / `course-api` -> copy public domain/route (use GraphQL endpoint URL expected by web runtime).
- `WEB_URL_*`: Cloudflare Pages -> select `course-web-staging` / `course-web` -> copy public Pages/custom domain URL.

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
