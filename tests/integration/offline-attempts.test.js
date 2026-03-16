const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('offline quiz attempt scaffolding', () => {
  const webStore = read('apps/web/src/shared/offline/quizAttemptStore.ts')
  const mobileStore = read(
    'apps/learners-mobile/src/shared/offline/quizAttemptStore.ts',
  )
  const sharedStore = read(
    'shared/shared-utils/src/offline/quizAttemptStore.ts',
  )
  const sharedTypes = read('shared/shared-graphql/src/types.ts')

  assert.ok(webStore.includes('createQuizAttemptStore'))
  assert.ok(webStore.includes('createWebStorage'))
  assert.ok(mobileStore.includes('createQuizAttemptStore'))
  assert.ok(mobileStore.includes('asyncStorageAdapter'))
  assert.ok(sharedStore.includes('QuizAttemptDraft'))
  assert.ok(sharedTypes.includes('startedAt'))
})
