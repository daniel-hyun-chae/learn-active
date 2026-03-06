import type {
  ContentDraft,
  CourseDraft,
  ExerciseBlankDraft,
  ExerciseDraft,
  ExerciseStepDraft,
  LessonDraft,
  ModuleDraft,
} from './types'

export const BLANK_TOKEN = '[blank]'

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`
}

export function blankTemplateToSegments(
  template: string,
  blanks: ExerciseBlankDraft[],
) {
  const safeTemplate =
    typeof template === 'string' ? template : String(template ?? '')
  const parts = safeTemplate.split(BLANK_TOKEN)
  const segments: Array<{
    type: 'TEXT' | 'BLANK'
    text?: string
    blankId?: string
  }> = []

  parts.forEach((part, index) => {
    if (part) {
      segments.push({ type: 'TEXT', text: part })
    }
    if (index < parts.length - 1) {
      const blank = blanks[index]
      segments.push({ type: 'BLANK', blankId: blank?.id })
    }
  })

  return segments
}

export function normalizeBlankOptions(options?: string | string[]) {
  if (Array.isArray(options)) {
    return options.join(', ')
  }
  if (typeof options === 'string') {
    return options
  }
  if (options === undefined || options === null) {
    return ''
  }
  return String(options)
}

export function parseBlankOptions(options?: string | string[]) {
  const raw = normalizeBlankOptions(options)
  return raw
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean)
}

export function segmentsToBlankTemplate(
  segments?: Array<{ type: 'TEXT' | 'BLANK'; text?: string }>,
) {
  if (!segments?.length) return undefined
  return segments
    .map((segment) =>
      segment.type === 'TEXT' ? (segment.text ?? '') : BLANK_TOKEN,
    )
    .join('')
}

export function syncBlanks(
  template: string | undefined,
  existing: ExerciseBlankDraft[],
) {
  const normalizedTemplate = typeof template === 'string' ? template : undefined
  const safeTemplate =
    normalizedTemplate ??
    (existing.length ? Array(existing.length).fill(BLANK_TOKEN).join(' ') : '')
  const count =
    (safeTemplate.match(/\[blank\]/g) ?? []).length || existing.length
  const blanks: ExerciseBlankDraft[] = []
  for (let index = 0; index < count; index += 1) {
    const previous = existing[index]
    blanks.push({
      id: previous?.id ?? createId('blank'),
      variant: previous?.variant ?? 'OPTIONS',
      correct:
        typeof previous?.correct === 'string'
          ? previous.correct
          : String(previous?.correct ?? ''),
      options: normalizeBlankOptions(previous?.options),
    })
  }
  return blanks
}

export function emptyCourse(t: (key: string) => string): CourseDraft {
  return {
    title: '',
    description: '',
    language: 'German',
    modules: [
      {
        id: createId('module'),
        title: t('publishers.module.newTitle'),
        order: 1,
        lessons: [
          {
            id: createId('lesson'),
            title: t('publishers.lesson.newTitle'),
            order: 1,
            contents: [],
            exercises: [],
          },
        ],
      },
    ],
  }
}

export function normalizeDraft(course: CourseDraft): CourseDraft {
  return {
    ...course,
    modules: course.modules.map((module: ModuleDraft, moduleIndex: number) => ({
      ...module,
      id: module.id ?? createId('module'),
      order: module.order ?? moduleIndex + 1,
      lessons: module.lessons.map(
        (lesson: LessonDraft, lessonIndex: number) => ({
          ...lesson,
          id: lesson.id ?? createId('lesson'),
          order: lesson.order ?? lessonIndex + 1,
          contents: lesson.contents.map(
            (content: ContentDraft, contentIndex: number) => ({
              ...content,
              id: content.id ?? createId(`content-${contentIndex}`),
            }),
          ),
          exercises: lesson.exercises.map(
            (exercise: ExerciseDraft, exerciseIndex: number) => ({
              ...exercise,
              id: exercise.id ?? createId(`exercise-${exerciseIndex}`),
              steps: exercise.steps.map(
                (step: ExerciseStepDraft, stepIndex: number) => {
                  const templateFromSegments = segmentsToBlankTemplate(
                    step.segments,
                  )
                  const templateValue =
                    typeof step.template === 'string'
                      ? step.template
                      : undefined
                  const safeTemplate =
                    templateValue ?? templateFromSegments ?? ''
                  return {
                    ...step,
                    id: step.id ?? createId(`step-${stepIndex}`),
                    template: safeTemplate,
                    blanks: syncBlanks(safeTemplate, step.blanks),
                  }
                },
              ),
            }),
          ),
        }),
      ),
    })),
  }
}

export function reindexModules(modules: ModuleDraft[]) {
  return modules.map((module, index) => ({
    ...module,
    order: index + 1,
    lessons: reindexLessons(module.lessons),
  }))
}

export function reindexLessons(lessons: LessonDraft[]) {
  return lessons.map((lesson, index) => ({
    ...lesson,
    order: index + 1,
  }))
}
