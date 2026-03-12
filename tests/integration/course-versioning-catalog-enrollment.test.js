const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('course versioning, catalog, and enrollment wiring @eval(EVAL-PUBLISHERS-COURSE-006,EVAL-LEARNERS-COURSE-006,EVAL-LEARNERS-COURSE-007)', () => {
  const migration = read(
    'supabase/migrations/0004_course_versioning_catalog_enrollment.sql',
  )
  const schema = read('apps/api/src/db/schema.ts')
  const resolver = read('apps/api/src/features/course/resolver.ts')
  const repository = read('apps/api/src/features/course/repository.ts')
  const routeCatalog = read('apps/web/src/routes/courses.tsx')
  const routeDetail = read('apps/web/src/routes/courses.$slug.tsx')
  const routeMyCourses = read('apps/web/src/routes/my-courses.tsx')
  const appShell = read('apps/web/src/shared/layout/AppShell.tsx')

  assert.ok(
    migration.includes('create table if not exists public.course_versions'),
  )
  assert.ok(
    migration.includes('create table if not exists public.course_publications'),
  )
  assert.ok(migration.includes('create table if not exists public.enrollments'))
  assert.ok(!migration.includes('course_version_id uuid not null'))
  assert.ok(migration.includes('system-migration@local.invalid'))
  assert.ok(migration.includes("'00000000-0000-0000-0000-000000000001'::uuid"))

  assert.ok(schema.includes('export const courseVersions = pgTable('))
  assert.ok(schema.includes('export const coursePublications = pgTable('))
  assert.ok(schema.includes('export const enrollments = pgTable('))
  assert.ok(schema.includes("slug: text('slug').notNull()"))

  assert.ok(resolver.includes('async publicCourses'))
  assert.ok(resolver.includes('async publicCourse('))
  assert.ok(resolver.includes('async myCourses'))
  assert.ok(resolver.includes('async enrollInCourse('))
  assert.ok(resolver.includes('async publishCourseDraft('))
  assert.ok(resolver.includes('async createDraftFromPublished('))
  assert.ok(resolver.includes('async restoreVersionAsDraft('))
  assert.ok(resolver.includes('async courseVersionHistory('))
  assert.ok(resolver.includes('async courseVersionDiff('))

  assert.ok(!repository.includes('courseVersionId'))
  assert.ok(repository.includes('publicationByCourse'))
  assert.ok(repository.includes('enrollInCourse'))
  assert.ok(repository.includes('publishCourseDraft'))
  assert.ok(repository.includes('createDraftFromPublished'))
  assert.ok(repository.includes('restoreVersionAsDraft'))

  assert.ok(routeCatalog.includes("createFileRoute('/courses')"))
  assert.ok(routeCatalog.includes('publicCourses'))
  assert.ok(routeDetail.includes("createFileRoute('/courses/$slug')"))
  assert.ok(routeMyCourses.includes("createFileRoute('/my-courses')"))
  assert.ok(routeMyCourses.includes('myCourses'))

  assert.ok(appShell.includes('to="/courses"'))
  assert.ok(appShell.includes('to="/my-courses"'))
})
