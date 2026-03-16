const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('publisher workflow wiring', () => {
  const publishRoute = read('apps/web/src/routes/publish.tsx')
  const publishCourseRoute = read('apps/web/src/routes/publish.$courseId.tsx')
  const publisherHome = read(
    'apps/web/src/features/publishers/PublisherHome.tsx',
  )
  const publisherUtils = read(
    'apps/web/src/features/publishers/publisher-utils.ts',
  )
  const editor = read(
    'apps/web/src/features/publishers/components/RichTextEditor.tsx',
  )

  assert.ok(publishRoute.includes("createFileRoute('/publish')"))
  assert.ok(publishRoute.includes('query PublisherCoursesLanding'))
  assert.ok(publishRoute.includes("to: '/publish/$courseId'"))
  assert.ok(publishRoute.includes('publisher-landing'))
  assert.ok(publishRoute.includes('publisher-create-course'))
  assert.ok(publishRoute.includes('publisher-enter-course'))

  assert.ok(
    publishCourseRoute.includes("createFileRoute('/publish/$courseId')"),
  )
  assert.ok(publishCourseRoute.includes('PublisherHome'))
  assert.ok(publishCourseRoute.includes('publisher-course-missing'))
  assert.ok(publishCourseRoute.includes('priceCents'))
  assert.ok(publishCourseRoute.includes('stripePriceId'))

  assert.ok(!publisherHome.includes('publishers.course.language'))
  assert.ok(!publisherHome.includes('publisher-course-language'))
  assert.ok(publisherHome.includes('publishers.course.priceEur'))
  assert.ok(publisherHome.includes('publishers.course.priceHint'))
  assert.ok(publisherHome.includes('publisher-course-price-cents'))
  assert.ok(publisherHome.includes('priceCents'))
  assert.ok(publisherHome.includes('stripePriceId'))
  assert.ok(publisherHome.includes('publishers.modules.add'))
  assert.ok(publisherHome.includes('publishers.lessons.add'))
  assert.ok(publisherHome.includes('publishers.exercise.template'))
  assert.ok(publisherHome.includes('publishers.columns.structure'))
  assert.ok(publisherHome.includes('publishers.columns.designer'))
  assert.ok(publisherHome.includes('publishers.columns.preview'))
  assert.ok(!publisherHome.includes('publisher-parallel-toggle'))
  assert.ok(publisherHome.includes('publisher-layout-parallel'))
  assert.ok(publisherHome.includes('publisher-column-structure-toggle'))
  assert.ok(publisherHome.includes('publisher-column-designer-toggle'))
  assert.ok(publisherHome.includes('publisher-column-preview-toggle'))
  assert.ok(publisherHome.includes('publishers.structure.title'))
  assert.ok(publisherHome.includes('publisher-content-page-node'))
  assert.ok(publisherHome.includes('publisher-content-page-select'))
  assert.ok(publisherHome.includes('publisher-lesson-add-content-page'))
  assert.ok(publisherHome.includes('publisher-exercise-move-up'))
  assert.ok(publisherHome.includes('publisher-exercise-move-down'))
  assert.ok(publisherHome.includes('moveLesson('))
  assert.ok(publisherHome.includes('moveExercise('))
  assert.ok(publisherHome.includes('publisher-exercise-type'))
  assert.ok(publisherHome.includes('publisher-multiple-choice-question'))
  assert.ok(
    publisherHome.includes('publisher-multiple-choice-add-choice') &&
      publisherHome.includes('publisher-multiple-choice-choice-text'),
  )

  assert.ok(publisherUtils.includes('[blank]'))
  assert.ok(publisherUtils.includes('contentPages'))
  assert.ok(publisherUtils.includes('priceCents'))
  assert.ok(publisherUtils.includes('currency'))
  assert.ok(!publisherUtils.includes('language'))
  assert.ok(publisherUtils.includes('reindexMultipleChoiceChoices'))
  assert.ok(publisherUtils.includes('fillInBlank'))
  assert.ok(publisherUtils.includes('multipleChoice'))

  assert.ok(publisherHome.includes('seedSampleCourse'))
  assert.ok(publisherHome.includes('upsertCourse'))
  assert.ok(editor.includes('LexicalComposer'))
})
