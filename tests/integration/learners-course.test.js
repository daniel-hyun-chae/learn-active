const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('course list wiring', () => {
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

test('lesson block navigation wiring', () => {
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

test('fill in blank exercise wiring', () => {
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
  assert.ok(seed.includes('fillInBlank'))
})

test('multiple choice exercise wiring', () => {
  const webLessonView = read(
    'apps/web/src/features/learners/course/LessonView.tsx',
  )
  const webMultipleChoice = read(
    'apps/web/src/features/learners/course/exercises/MultipleChoiceExercise.tsx',
  )
  const mobileLessonView = read(
    'apps/learners-mobile/src/features/learners/course/LessonView.tsx',
  )
  const mobileMultipleChoice = read(
    'apps/learners-mobile/src/features/learners/course/exercises/MultipleChoiceExercise.tsx',
  )
  const seed = read('apps/api/src/features/course/seed.ts')
  const publisherHome = read(
    'apps/web/src/features/publishers/PublisherHome.tsx',
  )

  assert.ok(
    webLessonView.includes("selectedExercise.type === 'MULTIPLE_CHOICE'"),
  )
  assert.ok(webMultipleChoice.includes('multiple-choice-exercise'))
  assert.ok(webMultipleChoice.includes('multiple-choice-option'))
  assert.ok(webMultipleChoice.includes('multiple-choice-feedback'))

  assert.ok(
    mobileLessonView.includes("selectedExercise.type === 'MULTIPLE_CHOICE'"),
  )
  assert.ok(mobileMultipleChoice.includes('multipleChoice.allowsMultiple'))
  assert.ok(
    mobileMultipleChoice.includes('learners.exercise.multipleChoice.submit'),
  )

  assert.ok(seed.includes('ExerciseType.MULTIPLE_CHOICE'))
  assert.ok(seed.includes('multipleChoice:'))
  assert.ok(seed.includes('choice-german-1'))

  assert.ok(publisherHome.includes('publisher-exercise-type'))
  assert.ok(publisherHome.includes('publisher-multiple-choice-allows-multiple'))
  assert.ok(publisherHome.includes('publisher-multiple-choice-choice-move-up'))
})

test('dark mode infra', () => {
  const webRoot = read('apps/web/src/routes/__root.tsx')
  assert.ok(webRoot.includes('data-theme'))
  assert.ok(webRoot.includes('color-scheme'))
})

test('learner attempt and progress persistence wiring', () => {
  const lessonRoute = read(
    'apps/web/src/routes/courses.$courseId.lessons.$lessonId.tsx',
  )
  const learnerHome = read(
    'apps/web/src/features/learners/home/LearnerHome.tsx',
  )
  const learnRoute = read('apps/web/src/routes/learn.tsx')
  const fillInBlankExercise = read(
    'apps/web/src/features/learners/course/exercises/FillInBlankExercise.tsx',
  )
  const multipleChoiceExercise = read(
    'apps/web/src/features/learners/course/exercises/MultipleChoiceExercise.tsx',
  )
  const courseResolver = read('apps/api/src/features/course/resolver.ts')
  const courseRepositoryContract = read(
    'apps/api/src/features/course/repository-contract.ts',
  )
  const migration = read(
    'supabase/migrations/0006_learner_attempt_progress.sql',
  )

  assert.ok(lessonRoute.includes('learnerCourseProgress(courseId: $id)'))
  assert.ok(lessonRoute.includes('upsertLearnerExerciseAttempt'))
  assert.ok(lessonRoute.includes('learners.progress.lessonSummary'))
  assert.ok(lessonRoute.includes('learners.progress.modulePercent'))
  assert.ok(lessonRoute.includes('learners.progress.exerciseStatusAttempted'))

  assert.ok(fillInBlankExercise.includes('onSubmitAttempt'))
  assert.ok(multipleChoiceExercise.includes('onSubmitAttempt'))

  assert.ok(learnRoute.includes('learnerCourseProgress(courseId: $courseId)'))
  assert.ok(learnerHome.includes('course-card-progress'))

  assert.ok(courseResolver.includes('learnerCourseProgress'))
  assert.ok(courseResolver.includes('upsertLearnerExerciseAttempt'))
  assert.ok(courseRepositoryContract.includes('upsertLearnerExerciseAttempt'))
  assert.ok(courseRepositoryContract.includes('getLearnerCourseProgress'))

  assert.ok(
    migration.includes(
      'create table if not exists public.learner_exercise_attempts',
    ),
  )
  assert.ok(
    migration.includes(
      'unique(user_id, course_id, course_version_id, lesson_id, exercise_id)',
    ),
  )
})

test('paid checkout web wiring', () => {
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

test('mobile purchase and deep-link wiring', () => {
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
