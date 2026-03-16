const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')
const docPath = path.join(root, 'architecture', 'overview.md')

test('architecture overview exists', () => {
  assert.ok(fs.existsSync(docPath))
  const content = fs.readFileSync(docPath, 'utf8')
  assert.ok(content.includes('System Context'))
  assert.ok(content.includes('References'))
  assert.ok(content.includes('spec/'))
  assert.ok(content.includes('decision-log'))
})
