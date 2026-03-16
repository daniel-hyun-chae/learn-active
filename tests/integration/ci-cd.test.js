const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('pull request validation workflow wiring', () => {
  const workflow = read('.github/workflows/ci-validation.yml')
  const rootPackage = read('package.json')
  const lockfileScript = read('scripts/validate-pnpm-lockfile-major.mjs')
  const productGuidelines = read('.opencode/rules/product-guidelines.md')
  const orchestrator = read('.opencode/agents/change-orchestrator.md')
  const backlogReadme = read('backlog/README.md')

  assert.ok(workflow.includes('name: CI Validation'))
  assert.ok(workflow.includes('pull_request:'))
  assert.ok(workflow.includes('pnpm lint'))
  assert.ok(workflow.includes('pnpm build'))
  assert.ok(workflow.includes('pnpm test:unit'))
  assert.ok(workflow.includes('pnpm test:integration'))
  assert.ok(workflow.includes('pnpm test:e2e'))
  assert.ok(workflow.includes('pnpm --filter @app/learners-mobile lint'))
  assert.ok(workflow.includes('Validate lockfile and pnpm major alignment'))
  assert.ok(workflow.includes('pnpm validate:lockfile'))
  assert.ok(workflow.includes('Validate committed env template file'))
  assert.ok(
    workflow.includes('pnpm exec playwright install --with-deps chromium'),
  )
  assert.ok(rootPackage.includes('"validate:lockfile"'))
  assert.ok(lockfileScript.includes('Expected pnpm major from packageManager'))
  assert.ok(lockfileScript.includes('Detected lockfile major'))
  assert.ok(lockfileScript.includes('pnpm major and lockfile major mismatch'))

  assert.ok(productGuidelines.includes('CI-equivalent local validation suite'))
  assert.ok(productGuidelines.includes('pnpm validate:lockfile'))
  assert.ok(productGuidelines.includes('pnpm lint'))
  assert.ok(productGuidelines.includes('pnpm build'))
  assert.ok(orchestrator.includes('Testing and validation'))
  assert.ok(orchestrator.includes('pnpm validate:lockfile'))
  assert.ok(orchestrator.includes('pnpm lint'))
  assert.ok(orchestrator.includes('pnpm build'))
  assert.ok(backlogReadme.includes('`pnpm validate:lockfile` -> <result>'))
  assert.ok(backlogReadme.includes('`pnpm lint` -> <result>'))
  assert.ok(backlogReadme.includes('`pnpm build` -> <result>'))
})

test('staging deployment workflow wiring', () => {
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
  assert.ok(workflow.includes('STRIPE_SECRET_KEY_STAGING'))
  assert.ok(workflow.includes('STRIPE_PUBLISHABLE_KEY_STAGING'))
  assert.ok(workflow.includes('STRIPE_WEBHOOK_SECRET_STAGING'))
  assert.ok(workflow.includes('pnpm validate:deploy-env -- --target staging'))
  assert.ok(workflow.includes('Sync Stripe Worker secrets to staging'))
  assert.ok(workflow.includes('wrangler secret put STRIPE_SECRET_KEY'))
  assert.ok(workflow.includes('wrangler secret put STRIPE_WEBHOOK_SECRET'))
  assert.ok(workflow.includes('pnpm --filter @app/api deploy:worker:staging'))
  assert.ok(!workflow.includes('-- --var "SUPABASE_URL:${SUPABASE_URL}"'))
  assert.ok(workflow.includes('Verify staging API health after deploy'))
  assert.ok(workflow.includes('verify-hosted-api-health.mjs'))
  assert.ok(workflow.includes('Verify built web GraphQL endpoint for staging'))
  assert.ok(workflow.includes('verify-web-build-endpoint.mjs'))
  assert.ok(workflow.includes('VITE_APP_ENV: staging'))
  assert.ok(workflow.includes('deploy:worker:staging'))
  assert.ok(workflow.includes('deploy:pages:staging'))
})

test('production deploy and rollback workflow wiring', () => {
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
  assert.ok(workflow.includes('STRIPE_SECRET_KEY_PROD'))
  assert.ok(workflow.includes('STRIPE_PUBLISHABLE_KEY_PROD'))
  assert.ok(workflow.includes('STRIPE_WEBHOOK_SECRET_PROD'))
  assert.ok(
    workflow.includes('pnpm validate:deploy-env -- --target production'),
  )
  assert.ok(workflow.includes('Sync Stripe Worker secrets to production'))
  assert.ok(workflow.includes('wrangler secret put STRIPE_SECRET_KEY'))
  assert.ok(workflow.includes('wrangler secret put STRIPE_WEBHOOK_SECRET'))
  assert.ok(workflow.includes('pnpm --filter @app/api deploy:worker:prod'))
  assert.ok(!workflow.includes('-- --var "SUPABASE_URL:${SUPABASE_URL}"'))
  assert.ok(workflow.includes('Verify production API health after deploy'))
  assert.ok(workflow.includes('verify-hosted-api-health.mjs'))
  assert.ok(
    workflow.includes('Verify built web GraphQL endpoint for production'),
  )
  assert.ok(workflow.includes('verify-web-build-endpoint.mjs'))
  assert.ok(workflow.includes('VITE_APP_ENV: production'))
  assert.ok(apiPackage.includes('deploy:worker:prod'))
  assert.ok(apiPackage.includes('--name course-api'))
  assert.ok(apiPackage.includes('deploy-api-worker.mjs'))
  assert.ok(apiPackage.includes('--env production'))
  assert.ok(webPackage.includes('deploy:pages:prod'))
  assert.ok(webPackage.includes('--project-name course-web'))
})

test('deployment env validation enforces hosted URL contract', () => {
  const script = path.join(root, 'scripts', 'validate-deploy-env.mjs')

  const validOutput = execFileSync(
    process.execPath,
    [script, '--target', 'staging'],
    {
      cwd: root,
      env: {
        ...process.env,
        SUPABASE_PROJECT_URL_STAGING: 'https://staging-project.supabase.co',
        SUPABASE_PUBLISHABLE_KEY_STAGING: 'staging-publishable-key',
        API_URL_STAGING: 'https://api-staging.example.com/graphql',
        WEB_URL_STAGING: 'https://staging.example.com',
        STRIPE_SECRET_KEY_STAGING: 'sk_test_123',
        STRIPE_PUBLISHABLE_KEY_STAGING: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET_STAGING: 'whsec_123',
      },
      encoding: 'utf8',
    },
  )
  assert.ok(validOutput.includes('staging environment contract is valid'))
  assert.ok(validOutput.includes('https://staging.example.com/auth'))

  assert.throws(
    () => {
      execFileSync(process.execPath, [script, '--target', 'staging'], {
        cwd: root,
        env: {
          ...process.env,
          SUPABASE_PROJECT_URL_STAGING: 'https://staging-project.supabase.co',
          SUPABASE_PUBLISHABLE_KEY_STAGING: 'staging-publishable-key',
          API_URL_STAGING: 'https://api-staging.example.com/graphql',
          WEB_URL_STAGING: 'http://localhost:4100',
          STRIPE_SECRET_KEY_STAGING: 'sk_test_123',
          STRIPE_PUBLISHABLE_KEY_STAGING: 'pk_test_123',
          STRIPE_WEBHOOK_SECRET_STAGING: 'whsec_123',
        },
        encoding: 'utf8',
      })
    },
    {
      message: /must use https|must not target localhost/,
    },
  )
})

test('built web endpoint verification script validates compiled artifacts', () => {
  const script = path.join(root, 'scripts', 'verify-web-build-endpoint.mjs')
  const tempRoot = fs.mkdtempSync(path.join(root, '.tmp-verify-web-endpoint-'))

  try {
    const okDir = path.join(tempRoot, 'ok')
    fs.mkdirSync(okDir, { recursive: true })
    fs.writeFileSync(
      path.join(okDir, 'index.js'),
      'const endpoint = "https://course-api-staging.example.workers.dev/graphql";',
      'utf8',
    )

    const okOutput = execFileSync(
      process.execPath,
      [
        script,
        '--dist',
        okDir,
        '--expected',
        'https://course-api-staging.example.workers.dev/graphql',
        '--env',
        'staging',
      ],
      {
        cwd: root,
        encoding: 'utf8',
      },
    )

    assert.ok(okOutput.includes('Expected GraphQL endpoint'))
    assert.ok(okOutput.includes('Endpoint found in artifact'))

    const badDir = path.join(tempRoot, 'bad')
    fs.mkdirSync(badDir, { recursive: true })
    fs.writeFileSync(
      path.join(badDir, 'index.js'),
      'const endpoint = "/graphql";',
      'utf8',
    )

    assert.throws(
      () => {
        execFileSync(
          process.execPath,
          [
            script,
            '--dist',
            badDir,
            '--expected',
            'https://course-api-staging.example.workers.dev/graphql',
            '--env',
            'staging',
          ],
          {
            cwd: root,
            encoding: 'utf8',
          },
        )
      },
      {
        message: /Expected endpoint was not found/,
      },
    )
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('hosted api health verification script validates deployed worker responses', () => {
  const script = path.join(root, 'scripts', 'verify-hosted-api-health.mjs')
  const tempRoot = fs.mkdtempSync(
    path.join(root, '.tmp-verify-hosted-api-health-'),
  )
  const mockFile = path.join(tempRoot, 'mock-loader.cjs')

  try {
    fs.writeFileSync(
      mockFile,
      `global.fetch = async () => new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*' } });\n`,
      'utf8',
    )

    const okOutput = execFileSync(
      process.execPath,
      [
        script,
        '--url',
        'https://course-api-staging.example.workers.dev/graphql',
        '--env',
        'staging',
      ],
      {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_OPTIONS: `--require ${mockFile}`,
        },
      },
    )

    assert.ok(okOutput.includes('staging preflight status 204'))
    assert.ok(okOutput.includes('Access-Control-Allow-Origin'))
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('cicd documentation and readme linking', () => {
  const docs = read('architecture/ci-cd.md')
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
  assert.ok(docs.includes('STRIPE_SECRET_KEY_STAGING'))
  assert.ok(docs.includes('STRIPE_PUBLISHABLE_KEY_STAGING'))
  assert.ok(docs.includes('STRIPE_WEBHOOK_SECRET_STAGING'))
  assert.ok(docs.includes('validate:deploy-env'))
  assert.ok(docs.includes('localhost'))
  assert.ok(docs.includes('WEB_URL_STAGING/auth'))
  assert.ok(readme.includes('architecture/ci-cd.md'))
})
