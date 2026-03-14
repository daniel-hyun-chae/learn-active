const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('course versioning, catalog, enrollment, and checkout wiring @eval(EVAL-PUBLISHERS-COURSE-006,EVAL-PUBLISHERS-COURSE-007,EVAL-LEARNERS-COURSE-006,EVAL-LEARNERS-COURSE-007,EVAL-LEARNERS-COURSE-008,EVAL-LEARNERS-COURSE-009,EVAL-LEARNERS-COURSE-010)', () => {
  const migration = read(
    'supabase/migrations/0004_course_versioning_catalog_enrollment.sql',
  )
  const stripeMigration = read(
    'supabase/migrations/0005_stripe_checkout_payments.sql',
  )
  const schema = read('apps/api/src/db/schema.ts')
  const resolver = read('apps/api/src/features/course/resolver.ts')
  const repository = read('apps/api/src/features/course/repository.ts')
  const apiApp = read('apps/api/src/app.ts')
  const stripeService = read('apps/api/src/runtime/stripe.ts')
  const routeCatalog = read('apps/web/src/routes/courses.tsx')
  const routeDetail = read('apps/web/src/routes/courses.$slug.tsx')
  const routeMyCourses = read('apps/web/src/routes/my-courses.tsx')
  const routePurchaseSuccess = read('apps/web/src/routes/purchase.success.tsx')
  const mobileAuthProvider = read(
    'apps/learners-mobile/src/features/auth/MobileAuthProvider.tsx',
  )
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

  assert.ok(
    stripeMigration.includes('alter table public.courses') &&
      stripeMigration.includes('add column if not exists price_cents'),
  )
  assert.ok(
    stripeMigration.includes('create table if not exists public.payments'),
  )
  assert.ok(stripeMigration.includes('unique(stripe_session_id)'))

  assert.ok(schema.includes('export const courseVersions = pgTable('))
  assert.ok(schema.includes('export const coursePublications = pgTable('))
  assert.ok(schema.includes('export const enrollments = pgTable('))
  assert.ok(schema.includes("slug: text('slug').notNull()"))
  assert.ok(schema.includes("priceCents: integer('price_cents')"))
  assert.ok(schema.includes('export const payments = pgTable('))
  assert.ok(schema.includes('stripeSessionId: text'))

  assert.ok(resolver.includes('async publicCourses'))
  assert.ok(resolver.includes('async publicCourse('))
  assert.ok(resolver.includes('async myCourses'))
  assert.ok(resolver.includes('async enrollInCourse('))
  assert.ok(resolver.includes('async publishCourseDraft('))
  assert.ok(resolver.includes('async createDraftFromPublished('))
  assert.ok(resolver.includes('async restoreVersionAsDraft('))
  assert.ok(resolver.includes('async courseVersionHistory('))
  assert.ok(resolver.includes('async courseVersionDiff('))
  assert.ok(resolver.includes('async createCourseCheckoutSession('))
  assert.ok(resolver.includes('async myPayments('))
  assert.ok(resolver.includes('async courseEnrollmentStatus('))

  assert.ok(!repository.includes('courseVersionId'))
  assert.ok(repository.includes('publicationByCourse'))
  assert.ok(repository.includes('enrollInCourse'))
  assert.ok(repository.includes('publishCourseDraft'))
  assert.ok(repository.includes('createDraftFromPublished'))
  assert.ok(repository.includes('restoreVersionAsDraft'))
  assert.ok(repository.includes('recordStripePayment'))
  assert.ok(repository.includes('ensureEnrollmentForPaidCourse'))

  assert.ok(apiApp.includes('handleStripeWebhook'))
  assert.ok(apiApp.includes('stripe-signature'))
  assert.ok(apiApp.includes('stripeWebhookEndpoint'))

  assert.ok(stripeService.includes('createCheckoutSession'))
  assert.ok(stripeService.includes('parseCheckoutCompletedEvent'))
  assert.ok(stripeService.includes('metadata[user_id]'))

  assert.ok(routeCatalog.includes("createFileRoute('/courses')"))
  assert.ok(routeCatalog.includes('publicCourses'))
  assert.ok(routeCatalog.includes('createCourseCheckoutSession'))
  assert.ok(routeDetail.includes("createFileRoute('/courses/$slug')"))
  assert.ok(routeDetail.includes('createCourseCheckoutSession'))
  assert.ok(routeMyCourses.includes("createFileRoute('/my-courses')"))
  assert.ok(routeMyCourses.includes('myCourses'))
  assert.ok(
    routePurchaseSuccess.includes("createFileRoute('/purchase/success')"),
  )
  assert.ok(routePurchaseSuccess.includes('courseEnrollmentStatus'))

  assert.ok(mobileAuthProvider.includes('shouldProcessAuthRedirect'))
  assert.ok(mobileAuthProvider.includes('auth/callback'))

  assert.ok(appShell.includes('to="/courses"'))
  assert.ok(appShell.includes('to="/my-courses"'))
})
