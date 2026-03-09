const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('pull request validation workflow wiring @eval(EVAL-PLATFORM-CICD-001)', () => {
  const workflow = read('.github/workflows/ci-validation.yml')

  assert.ok(workflow.includes('name: CI Validation'))
  assert.ok(workflow.includes('pull_request:'))
  assert.ok(workflow.includes('pnpm lint'))
  assert.ok(workflow.includes('pnpm build'))
  assert.ok(workflow.includes('pnpm test:unit'))
  assert.ok(workflow.includes('pnpm test:integration'))
  assert.ok(workflow.includes('pnpm test:e2e'))
  assert.ok(workflow.includes('pnpm --filter @app/learners-mobile lint'))
  assert.ok(workflow.includes('Validate lockfile and pnpm major alignment'))
  assert.ok(
    workflow.includes('pnpm exec playwright install --with-deps chromium'),
  )
})

test('staging deployment workflow wiring @eval(EVAL-PLATFORM-CICD-002,EVAL-PLATFORM-CICD-004)', () => {
  const workflow = read('.github/workflows/deploy-staging.yml')

  assert.ok(workflow.includes('name: Deploy Staging'))
  assert.ok(workflow.includes('push:'))
  assert.ok(workflow.includes('branches:'))
  assert.ok(workflow.includes('- main'))
  assert.ok(workflow.includes('detect-changes'))
  assert.ok(workflow.includes('api_changed'))
  assert.ok(workflow.includes('web_changed'))
  assert.ok(workflow.includes('apps/learners-mobile/*'))
  assert.ok(
    workflow.includes("if: needs.detect-changes.outputs.api_changed == 'true'"),
  )
  assert.ok(
    workflow.includes("if: needs.detect-changes.outputs.web_changed == 'true'"),
  )
  assert.ok(workflow.includes('SUPABASE_PROJECT_URL_STAGING'))
  assert.ok(workflow.includes('SUPABASE_PUBLISHABLE_KEY_STAGING'))
  assert.ok(workflow.includes('API_URL_STAGING'))
  assert.ok(workflow.includes('WEB_URL_STAGING'))
  assert.ok(workflow.includes('deploy:worker:staging'))
  assert.ok(workflow.includes('deploy:pages:staging'))
})

test('production deploy and rollback workflow wiring @eval(EVAL-PLATFORM-CICD-003)', () => {
  const workflow = read('.github/workflows/deploy-production.yml')
  const apiPackage = read('apps/api/package.json')
  const webPackage = read('apps/web/package.json')

  assert.ok(workflow.includes('name: Deploy Production'))
  assert.ok(workflow.includes('workflow_dispatch:'))
  assert.ok(workflow.includes('commit_ref:'))
  assert.ok(workflow.includes('git merge-base --is-ancestor'))
  assert.ok(workflow.includes('SUPABASE_PROJECT_URL_PROD'))
  assert.ok(workflow.includes('SUPABASE_PUBLISHABLE_KEY_PROD'))
  assert.ok(workflow.includes('API_URL_PROD'))
  assert.ok(workflow.includes('WEB_URL_PROD'))
  assert.ok(apiPackage.includes('deploy:worker:prod'))
  assert.ok(apiPackage.includes('--name course-api'))
  assert.ok(webPackage.includes('deploy:pages:prod'))
  assert.ok(webPackage.includes('--project-name course-web'))
})

test('cicd documentation and readme linking @eval(EVAL-PLATFORM-CICD-005)', () => {
  const docs = read('docs/ci-cd.md')
  const readme = read('README.md')

  assert.ok(docs.includes('CI/CD Workflow'))
  assert.ok(docs.includes('Workflow structure'))
  assert.ok(docs.includes('Environment model'))
  assert.ok(docs.includes('Required secrets'))
  assert.ok(docs.includes('Rollback strategy'))
  assert.ok(docs.includes('commit_ref'))
  assert.ok(docs.includes('course-api-staging'))
  assert.ok(docs.includes('course-api'))
  assert.ok(docs.includes('course-web-staging'))
  assert.ok(docs.includes('course-web'))
  assert.ok(docs.includes('CLOUDFLARE_API_TOKEN'))
  assert.ok(docs.includes('CLOUDFLARE_ACCOUNT_ID'))
  assert.ok(readme.includes('docs/ci-cd.md'))
})
