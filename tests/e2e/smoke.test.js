const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

const requiredEntries = [
  'apps/web/src/client.tsx',
  'apps/web/src/server.ts',
  'apps/learners-mobile/index.js',
  'apps/api/src/index.ts',
]

test('app entry points present @eval(EVAL-PLATFORM-INIT-001)', () => {
  for (const entry of requiredEntries) {
    const fullPath = path.join(root, entry)
    assert.ok(fs.existsSync(fullPath), `${entry} should exist`)
  }
})
