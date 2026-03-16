const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

const requiredEntries = [
  'apps/web/index.html',
  'apps/web/src/client.tsx',
  'apps/learners-mobile/index.js',
  'apps/api/src/index.ts',
  'apps/api/src/worker.ts',
]

test('app entry points present', () => {
  for (const entry of requiredEntries) {
    const fullPath = path.join(root, entry)
    assert.ok(fs.existsSync(fullPath), `${entry} should exist`)
  }
})
