const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function readJson(file) {
  return JSON.parse(read(file))
}

test('devcontainer compose wiring', () => {
  const compose = read('docker-compose.devcontainer.yml')
  const devcontainer = readJson(path.join('.devcontainer', 'devcontainer.json'))

  assert.equal(devcontainer.service, 'dev')
  assert.equal(
    devcontainer.dockerComposeFile,
    '../docker-compose.devcontainer.yml',
  )
  assert.ok(devcontainer.forwardPorts.includes(4000))
  assert.ok(devcontainer.forwardPorts.includes(4100))
  assert.equal(typeof devcontainer.postStartCommand, 'string')
  assert.ok(devcontainer.postStartCommand.includes('pnpm install'))
  assert.ok(!devcontainer.postStartCommand.includes('db:migrate'))

  assert.ok(compose.includes('services:'))
  assert.ok(compose.includes('dev:'))
  assert.ok(!compose.includes('\n  postgres:\n'))

  assert.ok(compose.includes('4000:4000'))
  assert.ok(compose.includes('4100:4100'))

  assert.ok(compose.includes('CHOKIDAR_USEPOLLING'))
  assert.ok(compose.includes('WATCHPACK_POLLING'))
  assert.ok(compose.includes('DATABASE_URL'))
  assert.ok(compose.includes('host.docker.internal:54322'))

  assert.ok(compose.includes('volumes:'))
  assert.ok(compose.includes('dev_node_modules:'))
})
