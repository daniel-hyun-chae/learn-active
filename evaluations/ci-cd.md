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
- Deploy jobs validate required staging secrets before deployment.

## EVAL-PLATFORM-CICD-003: Manual production deployment and rollback

Goal: Production releases are manual and support redeploy/rollback by commit ref.
Criteria:

- Production deploy uses `workflow_dispatch` with required `commit_ref` input.
- `commit_ref` is validated as reachable from `main` before deployment.
- API deploy targets Cloudflare Worker `course-api`.
- Web deploy targets Cloudflare Pages project `course-web`.

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
- Documentation explains manual production trigger and previous-commit redeploy/rollback.
- README links to CI/CD documentation.
