const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('docker env configuration @eval(EVAL-PLATFORM-DOCKER-002)', () => {
  const envExample = read('.env.example')
  const readme = read('README.md')
  const config = read('shared/shared-config/src/index.ts')

  assert.ok(envExample.includes('DATABASE_URL='))
  assert.ok(envExample.includes('SUPABASE_URL='))
  assert.ok(envExample.includes('SUPABASE_SERVICE_ROLE_KEY='))
  assert.ok(envExample.includes('GRAPHQL_ENDPOINT='))
  assert.ok(envExample.includes('VITE_GRAPHQL_ENDPOINT='))
  assert.ok(envExample.includes('EXPO_PUBLIC_GRAPHQL_ENDPOINT='))
  assert.ok(readme.includes('pnpm db:up'))
  assert.ok(readme.includes('pnpm dev'))
  assert.ok(readme.includes('Supabase'))
  assert.ok(readme.includes('Dev container (recommended)'))
  assert.ok(readme.includes('pnpm verify:setup'))
  assert.ok(readme.includes('.env.example'))
  assert.ok(readme.includes('.env.local'))
  assert.ok(readme.includes('EXPO_PUBLIC_GRAPHQL_ENDPOINT'))
  assert.ok(config.includes('GRAPHQL_ENDPOINT'))
  assert.ok(config.includes('VITE_GRAPHQL_ENDPOINT'))
})
