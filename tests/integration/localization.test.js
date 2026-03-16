const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('localization readiness', () => {
  const webRoot = read('apps/web/src/routes/__root.tsx')
  const mobileApp = read('apps/learners-mobile/src/App.tsx')
  const resources = read('shared/shared-i18n/src/resources.ts')

  assert.ok(webRoot.includes('@app/shared-i18n'))
  assert.ok(mobileApp.includes('@app/shared-i18n'))

  assert.ok(resources.includes('learners.home.title'))
  assert.ok(resources.includes('publishers.home.title'))
  assert.ok(resources.includes('mobile.learners.title'))
  assert.ok(resources.includes('auth.title'))
  assert.ok(resources.includes('auth.google'))
  assert.ok(resources.includes('auth.magicLink.send'))
  assert.ok(resources.includes('auth.logout'))
  assert.ok(resources.includes('auth.signedInAs'))
  assert.ok(resources.includes('router.notFound.title'))
  assert.ok(resources.includes('router.notFound.body'))
  assert.ok(resources.includes('router.notFound.cta'))
})
