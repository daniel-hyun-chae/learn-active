import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..')
const webRoot = path.join(root, 'apps', 'web')
const routeTreePath = path.join(webRoot, 'src', 'routeTree.gen.ts')
const viteConfigPath = path.join(webRoot, 'vite.config.ts')
const routesDir = path.join(webRoot, 'src', 'routes')
const routesProxyDir = path.join(webRoot, 'routes')

if (!fs.existsSync(routeTreePath)) {
  console.error('[verify] routeTree.gen.ts missing in apps/web/src')
  process.exit(1)
}

if (!fs.existsSync(routesDir)) {
  console.error('[verify] routes directory missing in apps/web/src/routes')
  process.exit(1)
}

if (!fs.existsSync(routesProxyDir)) {
  fs.mkdirSync(routesProxyDir, { recursive: true })
}

console.log('[verify] Ensuring routes proxy files...')
const routeFiles = fs
  .readdirSync(routesDir)
  .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))

for (const file of routeFiles) {
  const sourcePath = path.join(routesDir, file)
  const targetPath = path.join(routesProxyDir, file)
  const exportPath = `../src/routes/${file.replace(/\.tsx?$/, '')}`
  const contents = `export * from '${exportPath}'\nexport { Route } from '${exportPath}'\n`
  if (
    !fs.existsSync(targetPath) ||
    fs.readFileSync(targetPath, 'utf8') !== contents
  ) {
    fs.writeFileSync(targetPath, contents, 'utf8')
  }
}

let routeTree = fs.readFileSync(routeTreePath, 'utf8')
const normalizedRouteTree = routeTree
  .replace(/from '\.\/routes\//g, "from '/routes/")
  .replace(/from \"\.\/routes\//g, 'from "/routes/')

if (normalizedRouteTree !== routeTree) {
  fs.writeFileSync(routeTreePath, normalizedRouteTree, 'utf8')
  routeTree = normalizedRouteTree
  console.log('[verify] Normalized routeTree imports to /routes alias')
}

const importLines = routeTree
  .split('\n')
  .filter((line) => line.startsWith('import ') && line.includes('routes/'))

const missing = []
for (const line of importLines) {
  const match = line.match(/from ['"](.+?)['"]/)
  if (!match) continue
  const specifier = match[1]
  const basePath = specifier.startsWith('/routes')
    ? path.resolve(routesProxyDir, specifier.replace('/routes/', ''))
    : path.resolve(path.dirname(routeTreePath), specifier)
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

if (!fs.existsSync(viteConfigPath)) {
  console.error('[verify] vite.config.ts missing in apps/web')
  process.exit(1)
}

const viteConfig = fs.readFileSync(viteConfigPath, 'utf8')
const hasAlias = viteConfig.includes('alias')
const hasAbsoluteRoutes =
  viteConfig.includes('/routes') || viteConfig.includes('\\/routes')
const hasRelativeRoutes =
  viteConfig.includes('./routes') || viteConfig.includes('.\\/routes')
const hasNormalizePlugin = viteConfig.includes('normalize-route-imports')

if (!hasAlias || !hasAbsoluteRoutes || !hasRelativeRoutes) {
  console.error('[verify] vite alias for /routes and ./routes is missing')
  process.exit(1)
}

if (!hasNormalizePlugin) {
  console.error('[verify] normalize-route-imports plugin is missing')
  process.exit(1)
}

console.log('[verify] vite /routes and ./routes aliases are configured')
console.log('[verify] normalize-route-imports plugin is configured')
