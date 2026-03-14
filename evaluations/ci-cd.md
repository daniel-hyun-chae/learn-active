## EVAL-PLATFORM-CICD-001: Pull request CI validation

Goal: Every pull request is validated with consistent monorepo checks before merge.
Criteria:

- A GitHub Actions workflow is triggered by `pull_request` for all PRs.
- The workflow installs dependencies and runs lint, build, unit, integration, and e2e checks.
- React Native (`apps/learners-mobile`) participates in CI checks only.

## EVAL-PLATFORM-CICD-002: Automatic staging deployment

Goal: Merges to `main` automatically deploy staging resources.
Criteria:

- A deploy workflow is triggered by pushes to `main`.
- API deploy targets Cloudflare Worker `course-api-staging`.
- Web deploy targets Cloudflare Pages project `course-web-staging`.
- Deploy jobs validate staging environment contract before deployment.
- Staging deployment requires `pnpm validate:deploy-env -- --target staging` to pass.
- Staging deployment requires Stripe staging secrets and syncs hosted Worker Stripe secrets before API deploy.
- The repo-managed API Worker Wrangler config enables Cloudflare observability so hosted staging failures can be inspected in dashboard logs and traces after deploy.
- Staging API deploy preserves existing hosted Worker vars across redeploys.
- Staging API deploy performs a post-deploy hosted API health verification and fails the workflow if the deployed Worker does not answer successfully with CORS headers.

## EVAL-PLATFORM-CICD-003: Manual production deployment and rollback

Goal: Production releases are manual and support redeploy/rollback by commit ref.
Criteria:

- Production deploy uses `workflow_dispatch` with required `commit_ref` input.
- `commit_ref` is validated as reachable from `main` before deployment.
- API deploy targets Cloudflare Worker `course-api`.
- Web deploy targets Cloudflare Pages project `course-web`.
- Production deployment requires `pnpm validate:deploy-env -- --target production` to pass.
- Production deployment requires Stripe production secrets and syncs hosted Worker Stripe secrets before API deploy.
- The repo-managed API Worker Wrangler config enables Cloudflare observability for hosted production debugging parity.
- Production API deploy preserves existing hosted Worker vars across redeploys.
- Production API deploy performs a post-deploy hosted API health verification and fails the workflow if the deployed Worker does not answer successfully with CORS headers.

## EVAL-PLATFORM-CICD-004: Monorepo-aware deploy behavior

Goal: Deployment jobs avoid unnecessary execution in monorepo workflows.
Criteria:

- Staging deploy includes change detection for API and web scopes.
- API and web deploy jobs are conditionally skipped when their relevant areas did not change.
- React Native-only changes do not trigger staging deployment jobs.

## EVAL-PLATFORM-CICD-005: Contributor-facing CI/CD documentation

Goal: New contributors can understand release flow, environments, required secrets, and rollback.
Criteria:

- Documentation describes workflow structure and deployment flow.
- Documentation defines staging/production environment model and resource mapping.
- Documentation lists required repository and environment secrets.
- Documentation explains Stripe local-vs-hosted configuration expectations.
- Documentation explains manual production trigger and previous-commit redeploy/rollback.
- README links to CI/CD documentation.

## EVAL-PLATFORM-CICD-006: Hosted environment URL and auth redirect safety

Goal: Hosted staging/production deployments reject local-only URL targets and keep auth redirect expectations explicit.
Criteria:

- Hosted deployment validation rejects `localhost`, `127.0.0.1`, and `::1` targets for API, web, and Supabase project URLs.
- Hosted deployment validation requires HTTPS URLs for API, web, and Supabase project URLs.
- CI/CD wiring executes environment-contract validation before staging and production deploy steps.
- Documentation defines expected hosted Supabase auth callback shape as `WEB_URL_<ENV>/auth` and reserves localhost redirects for local development only.

## EVAL-PLATFORM-CICD-007: Built web endpoint verification before Pages deploy

Goal: Deployment logs must expose the bundled web GraphQL endpoint and block deploy when the expected endpoint was not embedded in build artifacts.
Criteria:

- Staging web deploy runs built-artifact endpoint verification after build and before Pages deploy.
- Production web deploy runs built-artifact endpoint verification after build and before Pages deploy.
- Verification logs include expected endpoint and matched artifact path(s).
- Verification fails deployment when expected endpoint is not found in built assets.
