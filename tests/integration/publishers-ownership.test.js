const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('owner-scoped publisher wiring and learner separation', () => {
  const publishRoute = read('apps/web/src/routes/publish.tsx')
  const publishCourseRoute = read('apps/web/src/routes/publish.$courseId.tsx')
  const learnRoute = read('apps/web/src/routes/learn.tsx')
  const lessonRoute = read(
    'apps/web/src/routes/courses.$courseId.lessons.$lessonId.tsx',
  )
  const courseResolver = read('apps/api/src/features/course/resolver.ts')
  const courseRepository = read('apps/api/src/features/course/repository.ts')
  const courseRepositoryDb = read(
    'apps/api/src/features/course/repository-db.ts',
  )
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
  assert.ok(!courseResolver.includes('async courses('))
  assert.ok(!courseResolver.includes('async course('))
  assert.ok(
    courseResolver.includes('Course is not editable by current publisher.'),
  )

  assert.ok(courseRepository.includes('provisionPersonalOwner'))
  assert.ok(courseRepository.includes('upsertPublisherCourse'))
  assert.ok(courseRepository.includes('seedPublisherSampleCourse'))
  assert.ok(courseRepository.includes('listLearnerCourses'))
  assert.ok(courseRepository.includes('createNodePostgresCourseRepository'))
  assert.ok(courseRepository.includes('createWorkerSupabaseCourseRepository'))

  assert.ok(courseRepositoryDb.includes('public.provision_personal_owner'))
  assert.ok(
    courseRepositoryDb.includes("client.rpc('provision_personal_owner'"),
  )
  assert.ok(courseRepositoryDb.includes('where c.owner_id = ${ownerId}::uuid'))
  assert.ok(courseRepositoryDb.includes(".eq('owner_id', ownerId)"))
  assert.ok(courseRepositoryDb.includes('SYSTEM_PROFILE_USER_ID'))
  assert.ok(courseRepositoryDb.includes("where type = 'system'"))

  assert.ok(
    ownershipMigration.includes("type in ('user', 'organization', 'system')"),
  )
  assert.ok(ownershipMigration.includes('provision_personal_owner'))
  assert.ok(
    ownershipMigration.includes('owner_members (owner_id, user_id, role)'),
  )
  assert.ok(
    ownershipMigration.includes("values (v_owner_id, p_user_id, 'owner')"),
  )
  assert.ok(
    ownershipMigration.includes('owners_personal_membership_guard') &&
      ownershipMigration.includes('owner_members_personal_membership_guard'),
  )
  assert.ok(ownershipMigration.includes('owners_single_system_owner_unique'))
  assert.ok(ownershipMigration.includes('Personal owner invariant violation'))
})
