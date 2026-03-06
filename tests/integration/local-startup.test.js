const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('local startup scripts @eval(EVAL-PLATFORM-LOCAL-001,EVAL-PLATFORM-LOCAL-003,EVAL-PLATFORM-LOCAL-004,EVAL-PLATFORM-LOCAL-005)', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.ok(pkg.scripts['smoke:local'])
  assert.ok(pkg.scripts['verify:setup'])
  const verify = read('scripts/verify-startup.mjs')
  const smoke = read('scripts/smoke-local.mjs')
  const migrate = read('apps/api/src/db/migrate.ts')
  const routeTree = read('scripts/verify-route-tree.mjs')
  const preflight = read('scripts/ensure-pnpm.mjs')
  assert.ok(verify.includes('ensure-pnpm.mjs'))
  assert.ok(smoke.includes('ensure-pnpm.mjs'))
  assert.ok(preflight.includes('turbo'))
  assert.ok(preflight.includes('takeown'))
  assert.ok(preflight.includes('.ignored'))
  assert.ok(routeTree.includes('vite /routes and ./routes aliases'))
  assert.ok(routeTree.includes('Normalized routeTree imports'))
  assert.ok(routeTree.includes('normalize-route-imports'))
  assert.ok(routeTree.includes('routes directory missing'))
  assert.ok(routeTree.includes('Ensuring routes proxy files'))
  assert.ok(preflight.includes('vite'))
  assert.ok(preflight.includes('vite.js'))
  assert.ok(preflight.includes('pnpm exec'))
  assert.ok(preflight.includes('--prod=false'))
  assert.ok(preflight.includes('ensureWorkspaceInstall'))
  assert.ok(migrate.includes("import pg from 'pg'"))
  assert.ok(migrate.includes('const { Pool } = pg'))
  assert.ok(smoke.includes('apps/api/dist/index.js'))
  assert.ok(smoke.includes('apps/web/docker-start.mjs'))
  assert.ok(smoke.includes('api-health'))
  assert.ok(smoke.includes('stylesheet'))
})

test('dev stack script @eval(EVAL-PLATFORM-LOCAL-002)', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.ok(pkg.scripts['dev:stack'])
  const devStack = read('scripts/dev-stack.mjs')
  assert.ok(devStack.includes('@app/web'))
  assert.ok(devStack.includes('@app/api'))
  assert.ok(devStack.includes('stylesheet'))
})

test('devcontainer opencode auth mount @eval(EVAL-PLATFORM-DEVCONTAINER-001)', () => {
  const devcontainer = JSON.parse(read('.devcontainer/devcontainer.json'))
  const remoteUser = devcontainer.remoteUser
  const mounts = devcontainer.mounts || []
  assert.ok(remoteUser)
  const expectedAuthTarget = `/home/${remoteUser}/.local/share/opencode/auth.json`
  const authMount = mounts.find((mount) => mount.includes('opencode/auth.json'))
  assert.ok(authMount)
  assert.ok(authMount.includes(`target=${expectedAuthTarget}`))
})

test('devcontainer compose user alignment @eval(EVAL-PLATFORM-DEVCONTAINER-001)', () => {
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
