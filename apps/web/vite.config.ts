import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const routesDir = path.join(rootDir, 'routes')

function resolveRouteAlias(source, prefix) {
  const target = source === prefix ? '' : source.replace(`${prefix}/`, '')
  const candidate = path.join(routesDir, target)
  const candidates = [candidate, `${candidate}.ts`, `${candidate}.tsx`]
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      return file
    }
  }
  return candidate
}

function routesAliasPlugin() {
  return {
    name: 'routes-alias',
    enforce: 'pre',
    resolveId(source) {
      if (source === './routes' || source.startsWith('./routes/')) {
        return resolveRouteAlias(source, './routes')
      }
      if (source === '/routes' || source.startsWith('/routes/')) {
        return resolveRouteAlias(source, '/routes')
      }
      return null
    },
  }
}

function normalizeRouteTreeFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const code = fs.readFileSync(filePath, 'utf8')
  if (!code.includes('./routes/')) return
  const normalized = code
    .replace(/from '\.\/routes\//g, "from '/routes/")
    .replace(/from \"\.\/routes\//g, 'from "/routes/')
  if (normalized === code) return
  fs.writeFileSync(filePath, normalized, 'utf8')
}

function normalizeRouteImportsPlugin() {
  return {
    name: 'normalize-route-imports',
    enforce: 'post',
    transform(code) {
      if (!code.includes('./routes/')) return null
      const normalized = code
        .replace(/from '\.\/routes\//g, "from '/routes/")
        .replace(/from \"\.\/routes\//g, 'from "/routes/')
      if (normalized === code) return null
      return { code: normalized, map: null }
    },
  }
}

export default defineConfig({
  root: rootDir,
  resolve: {
    alias: [
      { find: /^\/routes\/(.*)/, replacement: `${routesDir}/$1` },
      { find: /^\/routes$/, replacement: routesDir },
      { find: /^\.\/routes\/(.*)/, replacement: `${routesDir}/$1` },
      { find: /^\.\/routes$/, replacement: routesDir },
    ],
  },
  plugins: [
    tsconfigPaths(),
    routesAliasPlugin(),
    tanstackStart(),
    normalizeRouteImportsPlugin(),
    viteReact(),
  ],
  server: {
    host: '0.0.0.0',
    port: 4100,
  },
})
