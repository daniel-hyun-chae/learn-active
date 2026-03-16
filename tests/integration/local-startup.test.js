const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('local startup scripts', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.ok(pkg.scripts.dev)
  assert.ok(pkg.scripts['dev:cleanup'])
  assert.ok(pkg.scripts['smoke:local'])
  assert.ok(pkg.scripts['verify:setup'])
  const verify = read('scripts/verify-startup.mjs')
  const smoke = read('scripts/smoke-local.mjs')
  const browserCheck = read('scripts/browser-check.mjs')
  const webRoot = read('apps/web/src/routes/__root.tsx')
  const supabaseConfig = read('supabase/config.toml')
  const baselineMigration = read('supabase/migrations/0001_initial_schema.sql')
  const dbConnection = read('apps/api/src/db/connection.ts')
  const routeTree = read('scripts/verify-route-tree.mjs')
  const preflight = read('scripts/ensure-pnpm.mjs')
  assert.ok(verify.includes('ensure-pnpm.mjs'))
  assert.ok(smoke.includes('ensure-pnpm.mjs'))
  assert.ok(preflight.includes('turbo'))
  assert.ok(preflight.includes('takeown'))
  assert.ok(preflight.includes('.ignored'))
  assert.ok(routeTree.includes('routeTree.gen.ts missing'))
  assert.ok(routeTree.includes('routes directory missing'))
  assert.ok(routeTree.includes('Missing route files'))
  assert.ok(routeTree.includes('routeTree.gen.ts imports are valid'))
  assert.ok(preflight.includes('vite'))
  assert.ok(preflight.includes('vite.js'))
  assert.ok(preflight.includes('pnpm exec'))
  assert.ok(preflight.includes('--prod=false'))
  assert.ok(preflight.includes('ensureWorkspaceInstall'))
  assert.ok(supabaseConfig.includes('[db.migrations]'))
  assert.ok(baselineMigration.includes('create extension if not exists'))
  assert.ok(
    baselineMigration.includes('create table if not exists public.courses'),
  )
  assert.ok(
    baselineMigration.includes('create table if not exists public.profiles'),
  )
  assert.ok(baselineMigration.includes('create index if not exists'))
  assert.ok(baselineMigration.includes('create type public.profile_status'))
  assert.ok(smoke.includes("'wrangler'"))
  assert.ok(smoke.includes("'dev'"))
  assert.ok(smoke.includes('wrangler.jsonc'))
  assert.ok(smoke.includes('@app/web'))
  assert.ok(smoke.includes('preview'))
  assert.ok(smoke.includes('app root container'))
  assert.ok(smoke.includes('stylesheet'))
  assert.ok(smoke.includes('modulepreload'))
  assert.ok(smoke.includes('runBrowserChecks'))
  assert.ok(smoke.includes('assertMobileApiHealth'))
  assert.ok(smoke.includes('EXPO_PUBLIC_GRAPHQL_ENDPOINT'))
  assert.ok(browserCheck.includes('hydration'))
  assert.ok(browserCheck.includes('router-not-found'))
  assert.ok(browserCheck.includes('auth-entry-page'))
  assert.ok(webRoot.includes('notFoundComponent'))
  assert.ok(webRoot.includes('router-not-found'))
  assert.ok(
    dbConnection.includes(
      'Database unavailable, falling back to in-memory seed data',
    ),
  )
  assert.ok(!dbConnection.includes('CREATE TABLE IF NOT EXISTS'))
  assert.ok(!dbConnection.includes('ALTER TABLE courses'))
  assert.ok(dbConnection.includes('return null'))
})

test('dev command orchestrates setup and stack', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.ok(pkg.scripts.dev)
  const dev = read('scripts/dev.mjs')
  const devStack = read('scripts/dev-stack.mjs')
  assert.ok(dev.includes('setup-local.mjs'))
  assert.ok(dev.includes('dev-stack.mjs'))
  const cleanup = read('scripts/cleanup-dev-stack.mjs')
  assert.ok(dev.includes('Running fail-hard local setup'))
  assert.ok(dev.includes('Starting development stack'))
  assert.ok(cleanup.includes('wrangler dev'))
  assert.ok(cleanup.includes('vite preview'))
  assert.ok(cleanup.includes('node scripts/dev-stack.mjs'))
  assert.ok(cleanup.includes('lsof'))
  assert.ok(cleanup.includes('fuser'))
  assert.ok(cleanup.includes('4000'))
  assert.ok(cleanup.includes('4100'))
  assert.ok(devStack.includes("'wrangler'"))
  assert.ok(devStack.includes("'dev'"))
  assert.ok(devStack.includes('wrangler.jsonc'))
  const apiWrangler = read('apps/api/wrangler.jsonc')
  assert.ok(apiWrangler.includes('"observability"'))
  assert.ok(apiWrangler.includes('"enabled": true'))
  assert.ok(devStack.includes('STRIPE_SECRET_KEY:'))
  assert.ok(devStack.includes('STRIPE_PUBLISHABLE_KEY:'))
  assert.ok(devStack.includes('STRIPE_WEBHOOK_SECRET:'))
  assert.ok(devStack.includes('webAppDir'))
  assert.ok(devStack.includes('stylesheet'))
  assert.ok(!devStack.includes('db:migrate'))

  const viteConfig = read('apps/web/vite.config.ts')
  assert.ok(!viteConfig.includes('tanstackStart'))
  assert.ok(viteConfig.includes('viteReact()'))
  assert.ok(!viteConfig.includes('normalize-route-imports'))
  assert.ok(!viteConfig.includes('routes-alias'))
})

test('devcontainer db helper workflow', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.ok(pkg.scripts.dev)
  assert.ok(pkg.scripts['db:up'])
  assert.ok(pkg.scripts['db:status'])
  assert.ok(pkg.scripts['db:logs'])

  const dev = read('scripts/dev.mjs')
  const dbScript = read('scripts/dev-db.mjs')
  const setupLocal = read('scripts/setup-local.mjs')
  const devcontainer = JSON.parse(read('.devcontainer/devcontainer.json'))
  const dockerfile = read('.devcontainer/Dockerfile')
  const compose = read('docker-compose.devcontainer.yml')
  const readme = read('README.md')
  assert.ok(dev.includes('setup-local.mjs'))
  assert.ok(dbScript.includes('supabase/config.toml'))
  assert.ok(dbScript.includes('supabase@latest'))
  assert.ok(dbScript.includes("'db', 'push', '--local'"))
  assert.ok(!dbScript.includes('docker-compose.devcontainer.yml'))
  assert.ok(dbScript.includes('Refusing to reset without --yes'))
  assert.ok(setupLocal.includes('Waiting for database readiness'))
  assert.ok(setupLocal.includes('Applying Supabase migrations (fail hard)'))
  assert.ok(setupLocal.includes('switching host to host.docker.internal'))
  assert.ok(
    compose.includes(
      'DATABASE_URL: postgresql://postgres:postgres@host.docker.internal:54322/postgres',
    ),
  )
  assert.ok(!compose.includes('\n  postgres:\n'))
  assert.ok(compose.includes("shm_size: '1gb'"))
  assert.ok(devcontainer.remoteEnv.CI)
  assert.ok(devcontainer.remoteEnv.PLAYWRIGHT_BROWSERS_PATH)
  assert.ok(readme.includes('pnpm dev:cleanup'))
  assert.ok(
    devcontainer.postCreateCommand.includes('playwright install chromium'),
  )
  assert.ok(
    (devcontainer.mounts || []).some((mount) =>
      mount.includes('target=/home/node/.cache/ms-playwright'),
    ),
  )
  assert.ok(dockerfile.includes('install-deps chromium'))
})

test('devcontainer opencode auth mount', () => {
  const devcontainer = JSON.parse(read('.devcontainer/devcontainer.json'))
  const remoteUser = devcontainer.remoteUser
  const mounts = devcontainer.mounts || []
  assert.ok(remoteUser)
  const expectedAuthTarget = `/home/${remoteUser}/.local/share/opencode/auth.json`
  const authMount = mounts.find((mount) => mount.includes('opencode/auth.json'))
  assert.ok(authMount)
  assert.ok(authMount.includes(`target=${expectedAuthTarget}`))
})

test('worker cache key tracks Stripe bindings', () => {
  const worker = read('apps/api/src/worker.ts')
  assert.ok(
    worker.includes(
      "const stripeSecretKey = bindings.STRIPE_SECRET_KEY ? '1' : '0'",
    ),
  )
  assert.ok(
    worker.includes(
      "const stripePublishableKey = bindings.STRIPE_PUBLISHABLE_KEY ?? ''",
    ),
  )
  assert.ok(
    worker.includes(
      "const stripeWebhookSecret = bindings.STRIPE_WEBHOOK_SECRET ? '1' : '0'",
    ),
  )
})

test('devcontainer compose user alignment', () => {
  const devcontainer = JSON.parse(read('.devcontainer/devcontainer.json'))
  const remoteUser = devcontainer.remoteUser
  const compose = read('docker-compose.devcontainer.yml')
  assert.ok(remoteUser)
  const userLine = compose
    .split('\n')
    .find((line) => line.trim().startsWith('user:'))
  assert.ok(userLine)
  assert.strictEqual(userLine.trim(), `user: ${remoteUser}`)
})
