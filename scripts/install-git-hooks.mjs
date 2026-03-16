import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const hookPath = path.join(root, '.githooks', 'pre-commit')

if (!fs.existsSync(hookPath)) {
  console.error('[install-git-hooks] Missing .githooks/pre-commit')
  process.exit(1)
}

try {
  fs.chmodSync(hookPath, 0o755)
} catch (error) {
  console.warn('[install-git-hooks] Unable to chmod hook script:', error)
}

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: root,
  stdio: 'inherit',
})

if (result.status !== 0) {
  console.error('[install-git-hooks] Failed to configure core.hooksPath')
  process.exit(result.status ?? 1)
}

console.log('[install-git-hooks] Installed git hooks from .githooks/')
