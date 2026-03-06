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
  assert.ok(learnerHome.includes('course-card'))
  assert.ok(learnerHome.includes('course-link'))
  assert.ok(mobileHome.includes('learners.courses.start'))
})

test('lesson flow wiring @eval(EVAL-LEARNERS-COURSE-002)', () => {
  const lessonView = read(
    'apps/web/src/features/learners/course/LessonView.tsx',
  )
  const mobileLessonView = read(
    'apps/learners-mobile/src/features/learners/course/LessonView.tsx',
  )
  assert.ok(lessonView.includes('lesson-content'))
  assert.ok(lessonView.includes('lesson-start-exercise'))
  assert.ok(mobileLessonView.includes('learners.lesson.startExercise'))
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
