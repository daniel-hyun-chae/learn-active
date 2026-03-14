const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('course list wiring @eval(EVAL-LEARNERS-COURSE-001)', () => {
  const learnerHome = read(
    'apps/web/src/features/learners/home/LearnerHome.tsx',
  )
  const mobileHome = read(
    'apps/learners-mobile/src/features/learners/home/LearnerHome.tsx',
  )
  const courseSeed = read('apps/api/src/features/course/seed.ts')

  assert.ok(courseSeed.includes('German Essentials: Greetings'))
  assert.ok(!courseSeed.includes('language:'))
  assert.ok(learnerHome.includes('course-card'))
  assert.ok(learnerHome.includes('course-link'))
  assert.ok(mobileHome.includes('learners.courses.start'))
})

test('lesson block navigation wiring @eval(EVAL-LEARNERS-COURSE-002,EVAL-LEARNERS-COURSE-005)', () => {
  const lessonView = read(
    'apps/web/src/features/learners/course/LessonView.tsx',
  )
  const lessonRoute = read(
    'apps/web/src/routes/courses.$courseId.lessons.$lessonId.tsx',
  )
  const mobileLessonView = read(
    'apps/learners-mobile/src/features/learners/course/LessonView.tsx',
  )

  assert.ok(lessonView.includes('lesson-content'))
  assert.ok(lessonView.includes("type: 'summary'"))
  assert.ok(lessonView.includes("type: 'contentPage'"))
  assert.ok(lessonView.includes("type: 'exercise'"))
  assert.ok(lessonView.includes("'lesson-summary'"))
  assert.ok(lessonView.includes('data-test="lesson-content-page"'))
  assert.ok(!lessonView.includes('lesson-start-exercise'))
  assert.ok(!lessonView.includes('learners.lesson.contentTab'))

  assert.ok(lessonRoute.includes('learning-structure-tree'))
  assert.ok(lessonRoute.includes('learning-structure-toggle'))
  assert.ok(lessonRoute.includes('learning-structure-content-page'))
  assert.ok(lessonRoute.includes('learning-structure-exercise'))
  assert.ok(lessonRoute.includes("search={{ block: 'summary' }}"))
  assert.ok(lessonRoute.includes("block: 'contentPage'"))
  assert.ok(lessonRoute.includes("block: 'exercise'"))
  assert.ok(lessonRoute.includes('learners.structure.title'))
  assert.ok(lessonRoute.includes('learners.structure.summary'))
  assert.ok(lessonRoute.includes('learners.structure.module'))
  assert.ok(lessonRoute.includes('learners.structure.contentPage'))
  assert.ok(lessonRoute.includes('learners.structure.exercise'))

  assert.ok(mobileLessonView.includes('learners.structure.summary'))
  assert.ok(mobileLessonView.includes('learners.structure.lesson'))
  assert.ok(mobileLessonView.includes("type: 'contentPage'"))
  assert.ok(mobileLessonView.includes("type: 'exercise'"))
  assert.ok(mobileLessonView.includes('learners.lesson.contentPageMissing'))
  assert.ok(!mobileLessonView.includes('learners.lesson.startExercise'))
})

test('fill in blank exercise wiring @eval(EVAL-LEARNERS-COURSE-003)', () => {
  const exercise = read(
    'apps/web/src/features/learners/course/exercises/FillInBlankExercise.tsx',
  )
  const mobileExercise = read(
    'apps/learners-mobile/src/features/learners/course/exercises/FillInBlankExercise.tsx',
  )
  const seed = read('apps/api/src/features/course/seed.ts')
  assert.ok(exercise.includes('exercise-blank'))
  assert.ok(exercise.includes('exercise-option'))
  assert.ok(mobileExercise.includes('learners.exercise.optionsLabel'))
  assert.ok(seed.includes('blank-german-3'))
  assert.ok(seed.includes('blank-german-4'))
})

test('dark mode infra @eval(EVAL-LEARNERS-COURSE-004)', () => {
  const webRoot = read('apps/web/src/routes/__root.tsx')
  assert.ok(webRoot.includes('data-theme'))
  assert.ok(webRoot.includes('color-scheme'))
})

test('paid checkout web wiring @eval(EVAL-LEARNERS-COURSE-008,EVAL-LEARNERS-COURSE-010)', () => {
  const catalogRoute = read('apps/web/src/routes/courses.tsx')
  const detailRoute = read('apps/web/src/routes/courses.$slug.tsx')
  const purchaseSuccessRoute = read('apps/web/src/routes/purchase.success.tsx')

  assert.ok(catalogRoute.includes('createCourseCheckoutSession'))
  assert.ok(catalogRoute.includes("channel: 'WEB'"))
  assert.ok(catalogRoute.includes("t('catalog.buy')"))
  assert.ok(catalogRoute.includes("t('catalog.free')"))

  assert.ok(detailRoute.includes('createCourseCheckoutSession'))
  assert.ok(detailRoute.includes("channel: 'WEB'"))
  assert.ok(detailRoute.includes('window.location.assign'))

  assert.ok(
    purchaseSuccessRoute.includes("createFileRoute('/purchase/success')"),
  )
  assert.ok(purchaseSuccessRoute.includes('courseEnrollmentStatus'))
  assert.ok(purchaseSuccessRoute.includes('getActiveWebSession'))
  assert.ok(purchaseSuccessRoute.includes('setGraphQLAccessTokenProvider'))
  assert.ok(purchaseSuccessRoute.includes("to: '/my-courses'"))
})

test('mobile purchase and deep-link wiring @eval(EVAL-LEARNERS-COURSE-008,EVAL-LEARNERS-COURSE-009,EVAL-LEARNERS-COURSE-010)', () => {
  const mobileApp = read(
    'apps/learners-mobile/src/features/learners/LearnerMobileApp.tsx',
  )
  const mobileHome = read(
    'apps/learners-mobile/src/features/learners/home/LearnerHome.tsx',
  )
  const mobileAuthProvider = read(
    'apps/learners-mobile/src/features/auth/MobileAuthProvider.tsx',
  )

  assert.ok(mobileApp.includes('publicCourses'))
  assert.ok(mobileApp.includes('createCourseCheckoutSession'))
  assert.ok(mobileApp.includes("channel: 'MOBILE'"))
  assert.ok(mobileApp.includes('purchase/success'))
  assert.ok(mobileApp.includes('courseEnrollmentStatus'))

  assert.ok(mobileHome.includes('catalog.price'))
  assert.ok(mobileHome.includes('mobile.learners.buy'))
  assert.ok(mobileHome.includes('mobile.learners.enrollFree'))

  assert.ok(mobileAuthProvider.includes('shouldProcessAuthRedirect'))
  assert.ok(mobileAuthProvider.includes('auth/callback'))
})
