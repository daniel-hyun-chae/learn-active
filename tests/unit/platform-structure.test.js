const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

const requiredPaths = [
  'apps/web',
  'apps/learners-mobile',
  'apps/api',
  'shared/shared-ui',
  'shared/shared-tokens',
  'shared/shared-i18n',
  'shared/shared-utils',
  'shared/shared-config',
  'shared/shared-graphql',
  'apps/web/src/features/learners',
  'apps/web/src/features/publishers',
  'apps/learners-mobile/src/features/learners',
]

test('monorepo structure', () => {
  for (const entry of requiredPaths) {
    const fullPath = path.join(root, entry)
    assert.ok(fs.existsSync(fullPath), `${entry} should exist`)
  }
})
