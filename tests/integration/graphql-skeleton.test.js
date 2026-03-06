const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('graphql api skeleton @eval(EVAL-PLATFORM-INIT-004)', () => {
  const apiIndex = read('apps/api/src/index.ts')
  const healthResolver = read('apps/api/src/features/health/resolver.ts')
  const quizResolver = read('apps/api/src/features/quiz/resolver.ts')
  const courseResolver = read('apps/api/src/features/course/resolver.ts')

  assert.ok(apiIndex.includes("graphqlEndpoint: '/graphql'"))
  assert.ok(healthResolver.includes('HealthResolver'))
  assert.ok(healthResolver.includes("return 'ok'"))
  assert.ok(quizResolver.includes('QuizFormat'))
  assert.ok(quizResolver.includes('quizFormats'))
  assert.ok(courseResolver.includes('CourseResolver'))
  assert.ok(courseResolver.includes('courses'))
})
