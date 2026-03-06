const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

test('publisher workflow wiring @eval(EVAL-PUBLISHERS-COURSE-001)', () => {
  const publishRoute = read('apps/web/src/routes/publish.tsx')
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
  assert.ok(publishRoute.includes('PublisherHome'))
  assert.ok(publishRoute.includes('query PublisherCourses'))
  assert.ok(publisherHome.includes('publishers.course.select'))
  assert.ok(publisherHome.includes('publishers.modules.add'))
  assert.ok(publisherHome.includes('publishers.lessons.add'))
  assert.ok(publisherHome.includes('publishers.exercise.template'))
  assert.ok(publisherHome.includes('publishers.mode.preview'))
  assert.ok(publisherHome.includes('publishers.structure.title'))
  assert.ok(publisherUtils.includes('[blank]'))
  assert.ok(publisherHome.includes('seedSampleCourse'))
  assert.ok(publisherHome.includes('upsertCourse'))
  assert.ok(editor.includes('LexicalComposer'))
})
