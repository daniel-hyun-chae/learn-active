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

  assert.ok(courseSeed.includes('Deutsch B1: Alltag und Beruf im Gesprach'))
  assert.ok(courseSeed.includes('languageCode'))
  assert.ok(courseSeed.includes('categoryIds'))
  assert.ok(courseSeed.includes('previewLessonId'))
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
  assert.ok(lessonRoute.includes("buildSearch({ block: 'summary' })"))
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
  assert.ok(seed.includes('blank-b1-termin-fib-2'))
  assert.ok(seed.includes('blank-b1-meinung-fib-1'))
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
  assert.ok(seed.includes('choice-b1-termin-mc-1'))
  assert.ok(seed.includes('allowsMultiple: true'))

  assert.ok(publisherHome.includes('publisher-exercise-type'))
  assert.ok(publisherHome.includes('publisher-multiple-choice-allows-multiple'))
  assert.ok(publisherHome.includes('publisher-multiple-choice-choice-move-up'))
})

test('reordering exercise wiring', () => {
  const webLessonView = read(
    'apps/web/src/features/learners/course/LessonView.tsx',
  )
  const webReorderingExercise = read(
    'apps/web/src/features/learners/course/exercises/ReorderingExercise.tsx',
  )
  const mobileLessonView = read(
    'apps/learners-mobile/src/features/learners/course/LessonView.tsx',
  )
  const mobileReorderingExercise = read(
    'apps/learners-mobile/src/features/learners/course/exercises/ReorderingExercise.tsx',
  )
  const seed = read('apps/api/src/features/course/seed.ts')
  const publisherHome = read(
    'apps/web/src/features/publishers/PublisherHome.tsx',
  )

  assert.ok(webLessonView.includes("selectedExercise.type === 'REORDERING'"))
  assert.ok(webReorderingExercise.includes('reordering-exercise'))
  assert.ok(webReorderingExercise.includes('reordering-list'))
  assert.ok(webReorderingExercise.includes("event.key === 'ArrowUp'"))
  assert.ok(webReorderingExercise.includes("event.key === 'ArrowDown'"))
  assert.ok(webReorderingExercise.includes('reordering-feedback'))

  assert.ok(mobileLessonView.includes("selectedExercise.type === 'REORDERING'"))
  assert.ok(
    mobileReorderingExercise.includes('learners.exercise.reordering.submit'),
  )
  assert.ok(mobileReorderingExercise.includes('publishers.actions.moveUp'))

  assert.ok(seed.includes('ExerciseType.REORDERING'))
  assert.ok(seed.includes('reordering:'))
  assert.ok(seed.includes('reordering-item-b1-termin-1'))

  assert.ok(publisherHome.includes('publisher-reordering-prompt'))
  assert.ok(publisherHome.includes('publisher-reordering-add-item'))
  assert.ok(publisherHome.includes('publisher-reordering-item-distractor'))
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
  const historyMigration = read(
    'supabase/migrations/0007_learner_attempt_history.sql',
  )
  const runtimeServices = read('apps/api/src/runtime/services.ts')
  const repositoryDb = read('apps/api/src/features/course/repository-db.ts')

  assert.ok(lessonRoute.includes('learnerCourseProgress(courseId: $id)'))
  assert.ok(lessonRoute.includes('learnerCourse(id: $id) {'))
  assert.ok(lessonRoute.includes('versionId'))
  assert.ok(lessonRoute.includes('upsertLearnerExerciseAttempt'))
  assert.ok(lessonRoute.includes('learners.progress.lessonSummary'))
  assert.ok(lessonRoute.includes('learners.progress.modulePercent'))
  assert.ok(lessonRoute.includes('learners.progress.exerciseStatusAttempted'))
  assert.ok(lessonRoute.includes('upsertLearnerResumePosition'))
  assert.ok(lessonRoute.includes('LearnerResumePositionInput'))

  assert.ok(fillInBlankExercise.includes('onSubmitAttempt'))
  assert.ok(fillInBlankExercise.includes('fill-in-blank-feedback'))
  assert.ok(fillInBlankExercise.includes('learners.exercise.feedbackCorrect'))
  assert.ok(fillInBlankExercise.includes('learners.exercise.submitError'))
  assert.ok(multipleChoiceExercise.includes('onSubmitAttempt'))
  assert.ok(multipleChoiceExercise.includes('multiple-choice-submit-error'))
  assert.ok(multipleChoiceExercise.includes('learners.exercise.submitting'))
  assert.ok(multipleChoiceExercise.includes('submitted && !submissionError'))

  assert.ok(learnRoute.includes('learnerCourseProgress(courseId: $courseId)'))
  assert.ok(learnRoute.includes('publicCourses'))
  assert.ok(learnRoute.includes('resumePosition'))
  assert.ok(learnerHome.includes('course-card-progress'))
  assert.ok(learnerHome.includes('continue-learning-card'))
  assert.ok(learnerHome.includes('learners.resume.primaryLabel'))
  assert.ok(learnerHome.includes('catalog-fallback-grid'))
  assert.ok(learnerHome.includes('learners.resume.noEnrollments'))

  assert.ok(courseResolver.includes('learnerCourseProgress'))
  assert.ok(courseResolver.includes('upsertLearnerExerciseAttempt'))
  assert.ok(courseResolver.includes('upsertLearnerResumePosition'))
  assert.ok(courseResolver.includes('Course is not available to this learner.'))
  assert.ok(courseResolver.includes('learnerExerciseAttemptHistory'))
  assert.ok(courseRepositoryContract.includes('upsertLearnerExerciseAttempt'))
  assert.ok(courseRepositoryContract.includes('getLearnerCourseProgress'))
  assert.ok(courseRepositoryContract.includes('ensureSystemSeedCourse'))
  assert.ok(
    courseRepositoryContract.includes('listLearnerExerciseAttemptHistory'),
  )

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

  assert.ok(
    historyMigration.includes(
      'create table if not exists public.learner_exercise_attempt_history',
    ),
  )

  assert.ok(
    runtimeServices.includes('await courseRepository.ensureSystemSeedCourse()'),
  )
  assert.ok(repositoryDb.includes("and e.status in ('active', 'completed')"))
  assert.ok(repositoryDb.includes("from('learner_exercise_attempt_history')"))
  assert.ok(repositoryDb.includes('last_visited_lesson_id'))
  assert.ok(repositoryDb.includes('last_visited_block'))
  assert.ok(repositoryDb.includes('upsertLearnerResumePosition'))
})

test('learner resume and continue-home wiring', () => {
  const migration = read('supabase/migrations/0008_learner_resume_position.sql')
  const schema = read('apps/api/src/db/schema.ts')
  const resolver = read('apps/api/src/features/course/resolver.ts')
  const repositoryContract = read(
    'apps/api/src/features/course/repository-contract.ts',
  )
  const repository = read('apps/api/src/features/course/repository.ts')
  const repositoryDb = read('apps/api/src/features/course/repository-db.ts')
  const webLearnRoute = read('apps/web/src/routes/learn.tsx')
  const webLessonRoute = read(
    'apps/web/src/routes/courses.$courseId.lessons.$lessonId.tsx',
  )
  const webLearnerHome = read(
    'apps/web/src/features/learners/home/LearnerHome.tsx',
  )
  const mobileApp = read(
    'apps/learners-mobile/src/features/learners/LearnerMobileApp.tsx',
  )
  const mobileHome = read(
    'apps/learners-mobile/src/features/learners/home/LearnerHome.tsx',
  )
  const mobileLessonView = read(
    'apps/learners-mobile/src/features/learners/course/LessonView.tsx',
  )
  const resources = read('shared/shared-i18n/src/resources.ts')

  assert.ok(migration.includes('last_visited_lesson_id'))
  assert.ok(migration.includes('last_visited_block'))
  assert.ok(migration.includes('enrollments_last_visited_block_check'))

  assert.ok(
    schema.includes("lastVisitedLessonId: text('last_visited_lesson_id')"),
  )
  assert.ok(schema.includes("lastVisitedBlock: text('last_visited_block')"))
  assert.ok(schema.includes('enrollments_user_last_visited_idx'))

  assert.ok(resolver.includes('upsertLearnerResumePosition'))
  assert.ok(resolver.includes('LearnerResumePositionInput'))
  assert.ok(repositoryContract.includes('upsertLearnerResumePosition'))
  assert.ok(repository.includes('lastVisitedBlock'))
  assert.ok(repository.includes('upsertLearnerResumePosition'))
  assert.ok(repositoryDb.includes('coalesce(e.last_visited_at, e.enrolled_at)'))

  assert.ok(webLearnRoute.includes('catalogCourses'))
  assert.ok(webLearnRoute.includes('resumePosition'))
  assert.ok(webLessonRoute.includes('UpsertLearnerResumePosition'))
  assert.ok(webLearnerHome.includes('continue-learning-card'))
  assert.ok(webLearnerHome.includes('continue-learning-link'))
  assert.ok(webLearnerHome.includes('catalog-fallback-grid'))

  assert.ok(mobileApp.includes('resumePosition'))
  assert.ok(mobileApp.includes('UpsertLearnerResumePosition'))
  assert.ok(mobileHome.includes('learners.resume.primaryLabel'))
  assert.ok(mobileHome.includes('learners.resume.lastAccessed'))
  assert.ok(mobileLessonView.includes('initialSelection'))
  assert.ok(mobileLessonView.includes('onSelectionChange'))

  assert.ok(resources.includes('learners.resume.primaryLabel'))
  assert.ok(resources.includes('learners.resume.cta'))
  assert.ok(resources.includes('learners.resume.lastAccessed'))
})

test('seed course includes all learner elements multiple times', () => {
  const seed = read('apps/api/src/features/course/seed.ts')
  const exerciseTypesSource = read('apps/api/src/features/course/types.ts')
  const exerciseTypeEnumBlock =
    exerciseTypesSource.split('export enum ExerciseType {')[1]?.split('}')[0] ??
    ''
  const exerciseTypeNames = Array.from(
    exerciseTypeEnumBlock.matchAll(/\b([A-Z_]+)\s*=/g),
    (match) => match[1],
  )

  assert.ok(seed.includes('ContentType.TEXT'))
  assert.ok(seed.includes('ContentType.IMAGE'))
  assert.ok(seed.includes('contentPages: ['))
  assert.ok(seed.includes('ExerciseType.FILL_IN_THE_BLANK'))
  assert.ok(seed.includes('ExerciseType.MULTIPLE_CHOICE'))
  assert.ok(seed.includes('ExerciseType.REORDERING'))
  assert.ok(seed.includes('allowsMultiple: false'))
  assert.ok(seed.includes('allowsMultiple: true'))
  assert.ok(seed.includes('module-b1-kommunikation'))
  assert.ok(seed.includes('module-b1-argumentation'))

  assert.ok(exerciseTypeNames.length > 0)
  for (const exerciseTypeName of exerciseTypeNames) {
    assert.ok(
      seed.includes(`ExerciseType.${exerciseTypeName}`),
      `seed course should include exercise type ${exerciseTypeName}`,
    )
  }
})

test('review mode and attempt history wiring', () => {
  const lessonRoute = read(
    'apps/web/src/routes/courses.$courseId.lessons.$lessonId.tsx',
  )
  const resources = read('shared/shared-i18n/src/resources.ts')
  const styles = read('apps/web/src/styles.css')

  assert.ok(lessonRoute.includes("review === 'mistakes'"))
  assert.ok(lessonRoute.includes('review-mode-toggle'))
  assert.ok(lessonRoute.includes('review-pending-count'))
  assert.ok(lessonRoute.includes("'learning-structure-row wrong'"))
  assert.ok(lessonRoute.includes('learnerExerciseAttemptHistory'))
  assert.ok(lessonRoute.includes('learning-structure-exercise-history'))
  assert.ok(lessonRoute.includes('attempt-history-panel'))

  assert.ok(resources.includes('learners.review.enable'))
  assert.ok(resources.includes('learners.review.pendingCount'))
  assert.ok(resources.includes('learners.review.historyTitle'))

  assert.ok(styles.includes('.learning-structure-row.wrong'))
  assert.ok(styles.includes('.attempt-history-panel'))
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

test('marketplace discovery wiring', () => {
  const routeCatalog = read('apps/web/src/routes/courses.tsx')
  const routeDetail = read('apps/web/src/routes/courses.$slug.tsx')
  const publisherHome = read(
    'apps/web/src/features/publishers/PublisherHome.tsx',
  )
  const mobileHome = read(
    'apps/learners-mobile/src/features/learners/home/LearnerHome.tsx',
  )
  const mobileApp = read(
    'apps/learners-mobile/src/features/learners/LearnerMobileApp.tsx',
  )
  const resolver = read('apps/api/src/features/course/resolver.ts')
  const repositoryContract = read(
    'apps/api/src/features/course/repository-contract.ts',
  )
  const migration = read(
    'supabase/migrations/0009_marketplace_catalog_metadata.sql',
  )
  const resources = read('shared/shared-i18n/src/resources.ts')

  assert.ok(routeCatalog.includes("createFileRoute('/courses')"))
  assert.ok(routeCatalog.includes('validateSearch'))
  assert.ok(routeCatalog.includes('catalog.searchPlaceholder'))
  assert.ok(routeCatalog.includes('catalog.filter.anyCategory'))
  assert.ok(routeCatalog.includes('catalog.featured.title'))
  assert.ok(routeCatalog.includes('catalog.enrollmentCount'))

  assert.ok(routeDetail.includes('catalog.detail.structureTitle'))
  assert.ok(routeDetail.includes('catalog.detail.previewLessonBadge'))
  assert.ok(routeDetail.includes('publicPreviewCourse'))
  assert.ok(routeDetail.includes('previewNotPersisted'))

  assert.ok(publisherHome.includes('publisher-course-language-code'))
  assert.ok(publisherHome.includes('publisher-course-categories'))
  assert.ok(publisherHome.includes('publisher-course-tags'))
  assert.ok(publisherHome.includes('publisher-course-preview-lesson'))

  assert.ok(mobileApp.includes('categoryIds'))
  assert.ok(mobileApp.includes('languageCode'))
  assert.ok(mobileApp.includes('previewLessonId'))
  assert.ok(mobileApp.includes('popularityScore'))

  assert.ok(mobileHome.includes('catalog.searchPlaceholder'))
  assert.ok(mobileHome.includes('catalog.filter.freeOnly'))
  assert.ok(mobileHome.includes('catalog.featured.title'))
  assert.ok(mobileHome.includes('catalog.enrollmentCount'))

  assert.ok(resolver.includes('publicPreviewCourse'))
  assert.ok(resolver.includes('publicPreviewLesson'))
  assert.ok(repositoryContract.includes('getPublicPreviewLessonBySlug'))
  assert.ok(repositoryContract.includes('PublicCatalogQuery'))

  assert.ok(migration.includes('add column if not exists category_ids text[]'))
  assert.ok(migration.includes('add column if not exists tags text[]'))
  assert.ok(migration.includes('add column if not exists language_code text'))
  assert.ok(
    migration.includes('add column if not exists preview_lesson_id text'),
  )

  assert.ok(resources.includes('catalog.searchPlaceholder'))
  assert.ok(resources.includes('catalog.filter.anyLanguage'))
  assert.ok(resources.includes('catalog.detail.openPreview'))
  assert.ok(resources.includes('publishers.course.languageCode'))
  assert.ok(resources.includes('publishers.course.previewLessonId'))
})
