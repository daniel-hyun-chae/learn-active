import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const envPath = path.join(root, '.env')
const composePath = path.join(root, 'docker-compose.yml')

function exists(file) {
  return fs.existsSync(path.join(root, file))
}

function ensure(condition, message) {
  if (!condition) {
    console.error(`[verify] ${message}`)
    process.exit(1)
  }
}

ensure(fs.existsSync(composePath), 'docker-compose.yml is missing')
ensure(fs.existsSync(envPath), '.env is missing (run pnpm setup)')

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const ensureScript = path.join(root, 'scripts', 'ensure-pnpm.mjs')
const routeTreeScript = path.join(root, 'scripts', 'verify-route-tree.mjs')

console.log('[verify] Running pnpm preflight...')
const preflight = spawnSync(process.execPath, [ensureScript], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (preflight.error) {
  console.error('[verify] pnpm preflight failed to start', preflight.error)
  process.exit(1)
}

if (preflight.status !== 0) {
  console.error(`[verify] pnpm preflight failed with ${preflight.status}`)
  process.exit(preflight.status ?? 1)
}

console.log('[verify] Verifying route tree imports...')
const routeCheck = spawnSync(process.execPath, [routeTreeScript], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (routeCheck.error) {
  console.error('[verify] route tree check failed to start', routeCheck.error)
  process.exit(1)
}

if (routeCheck.status !== 0) {
  console.error(`[verify] route tree check failed with ${routeCheck.status}`)
  process.exit(routeCheck.status ?? 1)
}

console.log('[verify] Running pnpm build...')
const build = spawnSync(pnpmCmd, ['build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (build.error) {
  console.error('[verify] pnpm build failed to start', build.error)
  process.exit(1)
}

if (build.status !== 0) {
  console.error(`[verify] pnpm build failed with exit code ${build.status}`)
  process.exit(build.status ?? 1)
}

const webOutput = exists('apps/web/.output') || exists('apps/web/dist')

ensure(webOutput, 'web build output not found')
ensure(exists('apps/api/dist'), 'api build output not found')

console.log('[verify] Startup verification passed')
