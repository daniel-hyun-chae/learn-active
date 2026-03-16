const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('graphql api skeleton', () => {
  const apiIndex = read('apps/api/src/index.ts')
  const apiApp = read('apps/api/src/app.ts')
  const healthResolver = read('apps/api/src/features/health/resolver.ts')
  const quizResolver = read('apps/api/src/features/quiz/resolver.ts')
  const courseResolver = read('apps/api/src/features/course/resolver.ts')
  const authToken = read('apps/api/src/features/auth/token.ts')
  const authGuard = read('apps/api/src/features/auth/guard.ts')
  const authContext = read('apps/api/src/graphql/context.ts')

  assert.ok(apiIndex.includes('createApiApp('))
  assert.ok(apiApp.includes('graphqlEndpoint: services.env.graphqlEndpoint'))
  assert.ok(healthResolver.includes('HealthResolver'))
  assert.ok(healthResolver.includes("return 'ok'"))
  assert.ok(quizResolver.includes('QuizFormat'))
  assert.ok(quizResolver.includes('quizFormats'))
  assert.ok(courseResolver.includes('CourseResolver'))
  assert.ok(courseResolver.includes('courses'))
  assert.ok(courseResolver.includes('requireAuthenticatedUser('))
  assert.ok(authToken.includes('verifyAccessToken'))
  assert.ok(authToken.includes('getBearerToken'))
  assert.ok(authToken.includes("audience: 'authenticated'"))
  assert.ok(authGuard.includes('UNAUTHENTICATED'))
  assert.ok(authContext.includes('requestWithUser.user'))
  assert.ok(authContext.includes('authError'))
})
