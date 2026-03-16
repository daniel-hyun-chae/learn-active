import type {
  ContentDraft,
  CourseDraft,
  ExerciseBlankDraft,
  ExerciseDraft,
  MultipleChoiceChoiceDraft,
  ExerciseStepDraft,
  LessonDraft,
  LessonContentPageDraft,
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
    priceCents: null,
    currency: 'eur',
    stripePriceId: null,
    isPaid: false,
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
            contentPages: [],
            exercises: [],
          },
        ],
      },
    ],
  }
}

export function normalizeDraft(course: CourseDraft): CourseDraft {
  const normalizedPriceCents =
    typeof course.priceCents === 'number' && Number.isFinite(course.priceCents)
      ? Math.max(0, Math.floor(course.priceCents))
      : null
  const normalizedCurrency = (course.currency ?? 'eur').toLowerCase()

  return {
    ...course,
    priceCents: normalizedPriceCents,
    currency: normalizedCurrency,
    stripePriceId: course.stripePriceId ?? null,
    isPaid: normalizedPriceCents !== null && normalizedPriceCents > 0,
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
          contentPages: (lesson.contentPages ?? []).map(
            (page: LessonContentPageDraft, pageIndex: number) => ({
              ...page,
              id: page.id ?? createId(`content-page-${pageIndex}`),
              order: page.order ?? pageIndex + 1,
              contents: page.contents.map(
                (content: ContentDraft, contentIndex: number) => ({
                  ...content,
                  id:
                    content.id ?? createId(`content-page-item-${contentIndex}`),
                }),
              ),
            }),
          ),
          exercises: lesson.exercises.map(
            (exercise: ExerciseDraft, exerciseIndex: number) => ({
              ...exercise,
              id: exercise.id ?? createId(`exercise-${exerciseIndex}`),
              ...(exercise.type === 'MULTIPLE_CHOICE'
                ? {
                    multipleChoice: {
                      question: exercise.multipleChoice?.question ?? '',
                      allowsMultiple: Boolean(
                        exercise.multipleChoice?.allowsMultiple,
                      ),
                      choices: (exercise.multipleChoice?.choices ?? []).map(
                        (
                          choice: MultipleChoiceChoiceDraft,
                          choiceIndex: number,
                        ) => ({
                          ...choice,
                          id: choice.id ?? createId(`choice-${choiceIndex}`),
                          order: choice.order ?? choiceIndex + 1,
                          text: choice.text ?? '',
                          isCorrect: Boolean(choice.isCorrect),
                        }),
                      ),
                    },
                  }
                : {
                    fillInBlank: {
                      steps: (exercise.fillInBlank?.steps ?? []).map(
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
                    },
                  }),
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
    contentPages: reindexContentPages(lesson.contentPages ?? []),
  }))
}

export function reindexContentPages(contentPages: LessonContentPageDraft[]) {
  return contentPages.map((page, index) => ({
    ...page,
    order: index + 1,
  }))
}

export function reindexMultipleChoiceChoices(
  choices: MultipleChoiceChoiceDraft[],
) {
  return choices.map((choice, index) => ({
    ...choice,
    order: index + 1,
  }))
}

export type CourseInputPayload = {
  id?: string
  title: string
  description: string
  priceCents?: number | null
  currency?: string
  modules: Array<{
    id?: string
    title: string
    order: number
    lessons: Array<{
      id?: string
      title: string
      order: number
      contents: Array<{
        id?: string
        type: 'TEXT' | 'IMAGE'
        text?: string
        html?: string
        imageUrl?: string
        imageAlt?: string
        lexicalJson?: string
      }>
      contentPages: Array<{
        id?: string
        title: string
        order: number
        contents: Array<{
          id?: string
          type: 'TEXT' | 'IMAGE'
          text?: string
          html?: string
          imageUrl?: string
          imageAlt?: string
          lexicalJson?: string
        }>
      }>
      exercises: Array<{
        id?: string
        type: 'FILL_IN_THE_BLANK' | 'MULTIPLE_CHOICE'
        title: string
        instructions?: string
        fillInBlank?: {
          steps: Array<{
            id?: string
            order: number
            prompt: string
            threadId: string
            threadTitle?: string
            segments: Array<{
              type: 'TEXT' | 'BLANK'
              text?: string
              blankId?: string
            }>
            blanks: Array<{
              id?: string
              correct: string
              variant: 'TYPING' | 'OPTIONS'
              options?: string[]
            }>
          }>
        }
        multipleChoice?: {
          question: string
          allowsMultiple: boolean
          choices: Array<{
            id?: string
            order: number
            text: string
            isCorrect: boolean
          }>
        }
      }>
    }>
  }>
}

export function toCourseInput(course: CourseDraft): CourseInputPayload {
  const normalized = normalizeDraft(course)
  return {
    id: normalized.id,
    title: normalized.title,
    description: normalized.description,
    priceCents: normalized.priceCents ?? null,
    currency: normalized.currency ?? 'eur',
    modules: normalized.modules.map((module) => ({
      id: module.id,
      title: module.title,
      order: module.order,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        contents: lesson.contents.map((content) => ({
          id: content.id,
          type: content.type,
          text: content.text,
          html: content.html,
          imageUrl: content.imageUrl,
          imageAlt: content.imageAlt,
          lexicalJson: content.lexicalJson,
        })),
        contentPages: (lesson.contentPages ?? []).map((page) => ({
          id: page.id,
          title: page.title,
          order: page.order,
          contents: page.contents.map((content) => ({
            id: content.id,
            type: content.type,
            text: content.text,
            html: content.html,
            imageUrl: content.imageUrl,
            imageAlt: content.imageAlt,
            lexicalJson: content.lexicalJson,
          })),
        })),
        exercises: lesson.exercises.map((exercise) => ({
          id: exercise.id,
          type: exercise.type,
          title: exercise.title,
          instructions: exercise.instructions,
          ...(exercise.type === 'MULTIPLE_CHOICE'
            ? {
                multipleChoice: {
                  question: exercise.multipleChoice?.question ?? '',
                  allowsMultiple: Boolean(
                    exercise.multipleChoice?.allowsMultiple,
                  ),
                  choices: (exercise.multipleChoice?.choices ?? []).map(
                    (choice, index) => ({
                      id: choice.id,
                      order: choice.order ?? index + 1,
                      text: choice.text,
                      isCorrect: Boolean(choice.isCorrect),
                    }),
                  ),
                },
              }
            : {
                fillInBlank: {
                  steps: (exercise.fillInBlank?.steps ?? []).map((step) => {
                    const templateValue =
                      typeof step.template === 'string'
                        ? step.template
                        : undefined
                    const safeTemplate =
                      templateValue ??
                      segmentsToBlankTemplate(step.segments) ??
                      ''
                    const blanks = syncBlanks(safeTemplate, step.blanks)
                    return {
                      id: step.id,
                      order: step.order,
                      prompt: step.prompt,
                      threadId: step.threadId,
                      threadTitle: step.threadTitle,
                      segments: blankTemplateToSegments(safeTemplate, blanks),
                      blanks: blanks.map((blank) => ({
                        id: blank.id,
                        correct: blank.correct,
                        variant: blank.variant,
                        options:
                          blank.variant === 'OPTIONS'
                            ? parseBlankOptions(blank.options)
                            : undefined,
                      })),
                    }
                  }),
                },
              }),
        })),
      })),
    })),
  }
}
