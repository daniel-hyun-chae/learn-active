const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('owner-scoped publisher wiring and learner separation @eval(EVAL-PUBLISHERS-COURSE-005)', () => {
  const publishRoute = read('apps/web/src/routes/publish.tsx')
  const publishCourseRoute = read('apps/web/src/routes/publish.$courseId.tsx')
  const learnRoute = read('apps/web/src/routes/learn.tsx')
  const lessonRoute = read(
    'apps/web/src/routes/courses.$courseId.lessons.$lessonId.tsx',
  )
  const courseResolver = read('apps/api/src/features/course/resolver.ts')
  const courseRepository = read('apps/api/src/features/course/repository.ts')
  const ownershipMigration = read(
    'supabase/migrations/0003_course_ownership_foundation.sql',
  )

  assert.ok(publishRoute.includes('publisherCourses {'))
  assert.ok(publishCourseRoute.includes('publisherCourse(id: $id)'))

  assert.ok(learnRoute.includes('learnerCourses {'))
  assert.ok(lessonRoute.includes('learnerCourse(id: $id)'))

  assert.ok(courseResolver.includes('async publisherCourses'))
  assert.ok(courseResolver.includes('async publisherCourse'))
  assert.ok(courseResolver.includes('async learnerCourses'))
  assert.ok(courseResolver.includes('async learnerCourse'))
  assert.ok(
    courseResolver.includes('Course is not editable by current publisher.'),
  )

  assert.ok(courseRepository.includes('provisionPersonalOwner'))
  assert.ok(courseRepository.includes('upsertPublisherCourse'))
  assert.ok(courseRepository.includes('seedPublisherSampleCourse'))
  assert.ok(courseRepository.includes('listLearnerCourses'))

  assert.ok(
    ownershipMigration.includes("type in ('user', 'organization', 'system')"),
  )
  assert.ok(ownershipMigration.includes('provision_personal_owner'))
  assert.ok(ownershipMigration.includes('owners_single_system_owner_unique'))
  assert.ok(ownershipMigration.includes('Personal owner invariant violation'))
})
