import type { CourseInput } from './inputs.js'
import type { Course } from './types.js'

export type CourseRecord = {
  id: string
  title: string
  description: string
  content: { modules: Course['modules'] }
}

export type IdGenerator = () => string

function normalizeStoredModules(modules: Course['modules']): Course['modules'] {
  return modules.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson) => ({
      ...lesson,
      contents: lesson.contents ?? [],
      contentPages: lesson.contentPages ?? [],
      exercises: lesson.exercises ?? [],
    })),
  }))
}

function ensureId(generateId: IdGenerator, value?: string) {
  return value ?? generateId()
}

export function mapCourseRecord(record: CourseRecord): Course {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    modules: normalizeStoredModules(record.content?.modules ?? []),
  }
}

export function normalizeCourseInput(
  input: CourseInput,
  generateId: IdGenerator,
): CourseRecord {
  const modules = input.modules.map((module, moduleIndex) => {
    const moduleId = ensureId(generateId, module.id)
    return {
      id: moduleId,
      title: module.title,
      order: module.order ?? moduleIndex + 1,
      lessons: module.lessons.map((lesson, lessonIndex) => {
        const lessonId = ensureId(generateId, lesson.id)
        return {
          id: lessonId,
          title: lesson.title,
          order: lesson.order ?? lessonIndex + 1,
          contents: lesson.contents.map((content, contentIndex) => ({
            id: ensureId(
              generateId,
              content.id ?? `content-${lessonId}-${contentIndex}`,
            ),
            type: content.type,
            text: content.text,
            imageUrl: content.imageUrl,
            imageAlt: content.imageAlt,
            lexicalJson: content.lexicalJson,
          })),
          contentPages: (lesson.contentPages ?? []).map((page, pageIndex) => {
            const pageId = ensureId(
              generateId,
              page.id ?? `content-page-${lessonId}-${pageIndex}`,
            )

            return {
              id: pageId,
              title: page.title,
              order: page.order ?? pageIndex + 1,
              contents: page.contents.map((content, contentIndex) => ({
                id: ensureId(
                  generateId,
                  content.id ?? `content-${pageId}-${contentIndex}`,
                ),
                type: content.type,
                text: content.text,
                imageUrl: content.imageUrl,
                imageAlt: content.imageAlt,
                lexicalJson: content.lexicalJson,
              })),
            }
          }),
          exercises: lesson.exercises.map((exercise, exerciseIndex) => ({
            id: ensureId(
              generateId,
              exercise.id ?? `exercise-${lessonId}-${exerciseIndex}`,
            ),
            type: exercise.type,
            title: exercise.title,
            instructions: exercise.instructions,
            steps: exercise.steps.map((step, stepIndex) => ({
              id: ensureId(
                generateId,
                step.id ?? `step-${lessonId}-${stepIndex}`,
              ),
              order: step.order ?? stepIndex + 1,
              prompt: step.prompt,
              threadId: step.threadId,
              threadTitle: step.threadTitle,
              segments: step.segments.map((segment) => ({
                type: segment.type,
                text: segment.text,
                blankId: segment.blankId,
              })),
              blanks: step.blanks.map((blank, blankIndex) => ({
                id: ensureId(
                  generateId,
                  blank.id ?? `blank-${lessonId}-${stepIndex}-${blankIndex}`,
                ),
                correct: blank.correct,
                variant: blank.variant,
                options: blank.options,
              })),
            })),
          })),
        }
      }),
    }
  })

  return {
    id: input.id ?? generateId(),
    title: input.title,
    description: input.description,
    content: { modules },
  }
}
