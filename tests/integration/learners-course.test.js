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
