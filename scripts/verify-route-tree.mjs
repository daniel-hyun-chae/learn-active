import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..')
const webRoot = path.join(root, 'apps', 'web')
const routeTreePath = path.join(webRoot, 'src', 'routeTree.gen.ts')
const routesDir = path.join(webRoot, 'src', 'routes')

if (!fs.existsSync(routeTreePath)) {
  console.error('[verify] routeTree.gen.ts missing in apps/web/src')
  process.exit(1)
}

if (!fs.existsSync(routesDir)) {
  console.error('[verify] routes directory missing in apps/web/src/routes')
  process.exit(1)
}

const routeTree = fs.readFileSync(routeTreePath, 'utf8')
const importLines = routeTree
  .split('\n')
  .filter((line) => line.startsWith('import ') && line.includes('./routes/'))

const missing = []
for (const line of importLines) {
  const match = line.match(/from ['"](.+?)['"]/)
  if (!match) continue
  const specifier = match[1]
  const basePath = path.resolve(path.dirname(routeTreePath), specifier)
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
  ]
  if (!candidates.some((file) => fs.existsSync(file))) {
    missing.push(specifier)
  }
}

if (missing.length) {
  console.error('[verify] Missing route files:', missing.join(', '))
  process.exit(1)
}

console.log('[verify] routeTree.gen.ts imports are valid')
