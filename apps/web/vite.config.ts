import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const routesDir = path.join(rootDir, 'src', 'routes')

export default defineConfig({
  root: rootDir,
  resolve: {
    alias: [
      { find: /^\.\/routes\/(.*)/, replacement: `${routesDir}/$1` },
      { find: /^\.\/routes$/, replacement: routesDir },
      { find: /^\/routes\/(.*)/, replacement: `${routesDir}/$1` },
      { find: /^\/routes$/, replacement: routesDir },
    ],
  },
  plugins: [
    tsconfigPaths(),
    tanstackStart({
      customViteReactPlugin: true,
      server: {
        entry: './server.ts',
      },
    }),
    viteReact(),
  ],
  server: {
    host: '0.0.0.0',
    port: 4100,
  },
})
