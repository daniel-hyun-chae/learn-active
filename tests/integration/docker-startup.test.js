const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('docker compose startup', () => {
  const compose = read('docker-compose.yml')

  assert.ok(compose.includes('api:'))
  assert.ok(compose.includes('web:'))
  assert.ok(!compose.includes('\n  postgres:\n'))
  assert.ok(compose.includes('4100:4100'))
  assert.ok(compose.includes('4000:4000'))
  assert.ok(compose.includes('DATABASE_URL'))
  assert.ok(compose.includes('host.docker.internal:54322'))
  assert.ok(compose.includes('depends_on'))
  assert.ok(compose.includes('healthcheck'))
})
