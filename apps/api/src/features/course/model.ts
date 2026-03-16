import type { CourseInput } from './inputs.js'
import {
  BlankVariant,
  ExerciseType,
  SegmentType,
  type Course,
} from './types.js'

export type IdGenerator = () => string

export type CourseContent = {
  modules: Course['modules']
}

type NormalizedExercise =
  Course['modules'][number]['lessons'][number]['exercises'][number]
type FillStep = NonNullable<NormalizedExercise['fillInBlank']>['steps'][number]
type MultipleChoiceChoice = NonNullable<
  NormalizedExercise['multipleChoice']
>['choices'][number]

type FillStepLegacy = {
  id?: string
  order?: number
  prompt?: string
  threadId?: string
  threadTitle?: string
  segments?: Array<{
    type?: 'TEXT' | 'BLANK'
    text?: string
    blankId?: string
  }>
  blanks?: Array<{
    id?: string
    correct?: string
    variant?: 'TYPING' | 'OPTIONS'
    options?: string[]
  }>
}

function normalizeFillInBlankContent(
  raw:
    | {
        steps?: Array<{
          id?: string
          order?: number
          prompt?: string
          threadId?: string
          threadTitle?: string
          segments?: Array<{
            type?: 'TEXT' | 'BLANK'
            text?: string
            blankId?: string
          }>
          blanks?: Array<{
            id?: string
            correct?: string
            variant?: 'TYPING' | 'OPTIONS'
            options?: string[]
          }>
        }>
      }
    | null
    | undefined,
  generateId: IdGenerator,
): { steps: FillStep[] } {
  const steps: FillStep[] = (raw?.steps ?? []).map((stepInput, stepIndex) => ({
    id: ensureId(generateId, stepInput.id),
    order: stepInput.order ?? stepIndex + 1,
    prompt: stepInput.prompt ?? '',
    threadId: stepInput.threadId ?? `thread-${stepIndex + 1}`,
    threadTitle: stepInput.threadTitle,
    segments: (stepInput.segments ?? []).map(
      (segmentInput): FillStep['segments'][number] => ({
        type:
          segmentInput.type === 'BLANK' ? SegmentType.BLANK : SegmentType.TEXT,
        text: segmentInput.text,
        blankId: segmentInput.blankId,
      }),
    ),
    blanks: (stepInput.blanks ?? []).map(
      (blankInput): FillStep['blanks'][number] => ({
        id: ensureId(generateId, blankInput.id),
        correct:
          typeof blankInput.correct === 'string' ? blankInput.correct : '',
        variant:
          blankInput.variant === 'TYPING'
            ? BlankVariant.TYPING
            : BlankVariant.OPTIONS,
        options: blankInput.options,
      }),
    ),
  }))

  return { steps }
}

function normalizeMultipleChoiceContent(
  raw:
    | {
        question?: string
        allowsMultiple?: boolean
        choices?: Array<{
          id?: string
          order?: number
          text?: string
          isCorrect?: boolean
        }>
      }
    | null
    | undefined,
  generateId: IdGenerator,
): {
  question: string
  allowsMultiple: boolean
  choices: MultipleChoiceChoice[]
} {
  const choices = (raw?.choices ?? []).map((choice, index) => ({
    id: ensureId(generateId, choice.id),
    order: choice.order ?? index + 1,
    text: choice.text ?? '',
    isCorrect: Boolean(choice.isCorrect),
  }))

  return {
    question: raw?.question ?? '',
    allowsMultiple: Boolean(raw?.allowsMultiple),
    choices,
  }
}

function normalizeExerciseContent(
  exerciseInput: NonNullable<
    CourseInput['modules'][number]['lessons'][number]['exercises'][number]
  >,
  generateId: IdGenerator,
): NormalizedExercise {
  if (exerciseInput.type === 'MULTIPLE_CHOICE') {
    return {
      id: ensureId(generateId, exerciseInput.id),
      type: ExerciseType.MULTIPLE_CHOICE,
      title: exerciseInput.title,
      instructions: exerciseInput.instructions,
      multipleChoice: normalizeMultipleChoiceContent(
        exerciseInput.multipleChoice,
        generateId,
      ),
    }
  }

  const legacyFillRaw = (exerciseInput as { steps?: FillStepLegacy[] }).steps

  return {
    id: ensureId(generateId, exerciseInput.id),
    type: ExerciseType.FILL_IN_THE_BLANK,
    title: exerciseInput.title,
    instructions: exerciseInput.instructions,
    fillInBlank: normalizeFillInBlankContent(
      exerciseInput.fillInBlank ??
        (legacyFillRaw ? { steps: legacyFillRaw } : { steps: [] }),
      generateId,
    ),
  }
}

function normalizeExerciseForRead(exercise: unknown): NormalizedExercise {
  const source = (exercise ?? {}) as Record<string, unknown>
  const type =
    source.type === ExerciseType.MULTIPLE_CHOICE
      ? ExerciseType.MULTIPLE_CHOICE
      : ExerciseType.FILL_IN_THE_BLANK

  if (type === ExerciseType.MULTIPLE_CHOICE) {
    const multipleChoice =
      (source.multipleChoice as
        | {
            question?: string
            allowsMultiple?: boolean
            choices?: Array<{
              id?: string
              order?: number
              text?: string
              isCorrect?: boolean
            }>
          }
        | undefined) ?? {}

    return {
      id: String(source.id ?? ''),
      type,
      title: String(source.title ?? ''),
      instructions:
        typeof source.instructions === 'string'
          ? source.instructions
          : undefined,
      multipleChoice: {
        question: String(multipleChoice.question ?? ''),
        allowsMultiple: Boolean(multipleChoice.allowsMultiple),
        choices: (multipleChoice.choices ?? []).map((choice, index) => ({
          id: String(choice.id ?? `choice-${index + 1}`),
          order:
            typeof choice.order === 'number' && Number.isFinite(choice.order)
              ? choice.order
              : index + 1,
          text: String(choice.text ?? ''),
          isCorrect: Boolean(choice.isCorrect),
        })),
      },
    }
  }

  const fillInBlank =
    (source.fillInBlank as { steps?: FillStepLegacy[] } | undefined) ?? {}
  const legacySteps = (source.steps as FillStepLegacy[] | undefined) ?? []
  const stepsSource = fillInBlank.steps ?? legacySteps
  const idGenerator: IdGenerator = () =>
    `generated-${Math.random().toString(36).slice(2, 10)}`

  return {
    id: String(source.id ?? ''),
    type,
    title: String(source.title ?? ''),
    instructions:
      typeof source.instructions === 'string' ? source.instructions : undefined,
    fillInBlank: {
      steps: normalizeFillInBlankContent({ steps: stepsSource }, idGenerator)
        .steps,
    },
  }
}

function normalizeModulesForRead(modules: unknown): Course['modules'] {
  const sourceModules = Array.isArray(modules) ? modules : []

  return sourceModules.map((module) => {
    const moduleRecord = module as Record<string, unknown>
    const sourceLessons = Array.isArray(moduleRecord.lessons)
      ? moduleRecord.lessons
      : []

    return {
      id: String(moduleRecord.id ?? ''),
      title: String(moduleRecord.title ?? ''),
      order:
        typeof moduleRecord.order === 'number' &&
        Number.isFinite(moduleRecord.order)
          ? moduleRecord.order
          : 0,
      lessons: sourceLessons.map((lesson) => {
        const lessonRecord = lesson as Record<string, unknown>
        const sourceExercises = Array.isArray(lessonRecord.exercises)
          ? lessonRecord.exercises
          : []

        return {
          id: String(lessonRecord.id ?? ''),
          title: String(lessonRecord.title ?? ''),
          order:
            typeof lessonRecord.order === 'number' &&
            Number.isFinite(lessonRecord.order)
              ? lessonRecord.order
              : 0,
          contents: Array.isArray(lessonRecord.contents)
            ? (lessonRecord.contents as Course['modules'][number]['lessons'][number]['contents'])
            : [],
          contentPages: Array.isArray(lessonRecord.contentPages)
            ? (lessonRecord.contentPages as Course['modules'][number]['lessons'][number]['contentPages'])
            : [],
          exercises: sourceExercises.map(normalizeExerciseForRead),
        }
      }),
    }
  })
}

export const ACTIVE_ENROLLMENT_STATUSES = ['active', 'completed'] as const

export function isActivelyEnrolled(status: string) {
  return ACTIVE_ENROLLMENT_STATUSES.includes(
    status as (typeof ACTIVE_ENROLLMENT_STATUSES)[number],
  )
}

export type PublisherCourseRecord = {
  courseId: string
  slug: string
  ownerId: string
  priceCents: number | null
  currency: string
  stripePriceId: string | null
  versionId: string
  version: number
  status: 'draft' | 'published' | 'archived'
  title: string
  description: string
  content: CourseContent
  changeNote?: string | null
  createdAt: string
  createdBy: string
  publishedAt: string | null
  archivedAt?: string | null
}

export type PublicCourseRecord = {
  id: string
  slug: string
  title: string
  description: string
  priceCents: number | null
  currency: string
  stripePriceId: string | null
  isPaid: boolean
  ownerDisplayName?: string
}

export type EnrollmentRecord = {
  id: string
  courseId: string
  status: string
  enrolledAt: string
}

export type PaymentRecord = {
  id: string
  userId: string
  courseId: string
  stripeSessionId: string
  stripePaymentIntentId: string | null
  amountCents: number
  currency: string
  status: string
  createdAt: string
}

export type CourseVersionHistoryRecord = {
  versionId: string
  version: number
  status: 'draft' | 'published' | 'archived'
  title: string
  changeNote?: string | null
  createdAt: string
  createdBy: string
  publishedAt: string | null
  archivedAt: string | null
}

export type CourseVersionDiffRecord = {
  courseId: string
  fromVersionId: string
  toVersionId: string
  fromVersion: number
  toVersion: number
  titleChanged: boolean
  descriptionChanged: boolean
  addedFields: string[]
  removedFields: string[]
  changedFields: string[]
}

export type LearnerExerciseAttemptRecord = {
  id: string
  userId: string
  courseId: string
  courseVersionId: string
  lessonId: string
  exerciseId: string
  answers: Record<string, string>
  isCorrect: boolean
  attemptedAt: string
}

export type ExerciseAttemptStatusRecord = {
  exerciseId: string
  attempted: boolean
  isCorrect: boolean | null
  attemptedAt: string | null
}

export type LessonProgressRecord = {
  lessonId: string
  completedExercises: number
  totalExercises: number
  percentComplete: number
  exerciseAttempts: ExerciseAttemptStatusRecord[]
}

export type ModuleProgressRecord = {
  moduleId: string
  completedExercises: number
  totalExercises: number
  percentComplete: number
  lessons: LessonProgressRecord[]
}

export type CourseProgressRecord = {
  courseId: string
  courseVersionId: string
  completedExercises: number
  totalExercises: number
  percentComplete: number
  modules: ModuleProgressRecord[]
}

function ensureId(generateId: IdGenerator, value?: string): string {
  return value && value.length > 0 ? value : generateId()
}

export function normalizeCourseInput(
  input: CourseInput,
  generateId: IdGenerator,
): {
  id: string
  title: string
  description: string
  priceCents: number | null
  currency: string
  content: CourseContent
} {
  const modules = (input.modules ?? []).map((moduleInput, moduleIndex) => ({
    id: ensureId(generateId, moduleInput.id),
    title: moduleInput.title,
    order: moduleInput.order ?? moduleIndex + 1,
    lessons: (moduleInput.lessons ?? []).map((lessonInput, lessonIndex) => ({
      id: ensureId(generateId, lessonInput.id),
      title: lessonInput.title,
      order: lessonInput.order ?? lessonIndex + 1,
      contents: (lessonInput.contents ?? []).map((contentInput) => ({
        id: ensureId(generateId, contentInput.id),
        type: contentInput.type,
        text: contentInput.text,
        html: contentInput.html,
        imageUrl: contentInput.imageUrl,
        imageAlt: contentInput.imageAlt,
        lexicalJson: contentInput.lexicalJson,
      })),
      contentPages: (lessonInput.contentPages ?? []).map(
        (pageInput, pageIndex) => ({
          id: ensureId(generateId, pageInput.id),
          title: pageInput.title,
          order: pageInput.order ?? pageIndex + 1,
          contents: (pageInput.contents ?? []).map((contentInput) => ({
            id: ensureId(generateId, contentInput.id),
            type: contentInput.type,
            text: contentInput.text,
            html: contentInput.html,
            imageUrl: contentInput.imageUrl,
            imageAlt: contentInput.imageAlt,
            lexicalJson: contentInput.lexicalJson,
          })),
        }),
      ),
      exercises: (lessonInput.exercises ?? []).map((exerciseInput) => ({
        ...normalizeExerciseContent(exerciseInput, generateId),
      })),
    })),
  }))

  return {
    id: input.id ?? generateId(),
    title: input.title,
    description: input.description,
    priceCents:
      typeof input.priceCents === 'number' && Number.isFinite(input.priceCents)
        ? Math.max(0, Math.floor(input.priceCents))
        : null,
    currency: (input.currency ?? 'eur').toLowerCase(),
    content: { modules },
  }
}

export function mapPublisherCourseToCourse(
  record: PublisherCourseRecord,
): Course {
  return {
    id: record.courseId,
    versionId: record.versionId,
    version: record.version,
    status: record.status,
    title: record.title,
    description: record.description,
    priceCents: record.priceCents,
    currency: record.currency,
    stripePriceId: record.stripePriceId,
    isPaid: typeof record.priceCents === 'number' && record.priceCents > 0,
    changeNote: record.changeNote ?? null,
    createdAt: record.createdAt,
    createdBy: record.createdBy,
    publishedAt: record.publishedAt,
    archivedAt: record.archivedAt ?? null,
    modules: normalizeModulesForRead(record.content.modules),
  }
}
