export type PublisherValidationSeverity = 'error' | 'warning'

export type PublisherValidationIssueCode =
  | 'MODULE_HAS_NO_LESSONS'
  | 'LESSON_TITLE_EMPTY'
  | 'LESSON_HAS_NO_CONTENT_PAGES'
  | 'FILL_STEP_HAS_NO_BLANKS'
  | 'FILL_BLANK_CORRECT_EMPTY'
  | 'FILL_OPTIONS_TOO_FEW'
  | 'FILL_OPTIONS_MISSING_CORRECT'
  | 'MULTIPLE_CHOICE_HAS_NO_CHOICES'
  | 'MULTIPLE_CHOICE_NO_CORRECT_CHOICE'
  | 'REORDERING_HAS_NO_ITEMS'
  | 'REORDERING_NEEDS_TWO_SEQUENCE_ITEMS'
  | 'REORDERING_ITEM_TEXT_EMPTY'

type ValidationPath = {
  moduleId?: string
  moduleTitle?: string
  moduleOrder?: number
  lessonId?: string
  lessonTitle?: string
  lessonOrder?: number
  exerciseId?: string
  exerciseTitle?: string
  exerciseOrder?: number
  stepId?: string
  stepOrder?: number
  blankId?: string
  blankOrder?: number
}

export type PublisherValidationIssue = {
  severity: PublisherValidationSeverity
  code: PublisherValidationIssueCode
  path: ValidationPath
}

export type PublisherValidationResult = {
  issues: PublisherValidationIssue[]
  errors: PublisherValidationIssue[]
  warnings: PublisherValidationIssue[]
  hasErrors: boolean
}

type CourseLike = {
  modules?: Array<{
    id?: string
    title?: string
    order?: number
    lessons?: Array<{
      id?: string
      title?: string
      order?: number
      contentPages?: Array<unknown>
      exercises?: Array<{
        id?: string
        type?: string
        title?: string
        fillInBlank?: {
          steps?: Array<{
            id?: string
            order?: number
            blanks?: Array<{
              id?: string
              correct?: string
              variant?: string
              options?: unknown
            }>
          }>
        }
        multipleChoice?: {
          choices?: Array<{
            id?: string
            order?: number
            isCorrect?: boolean
          }>
        }
        reordering?: {
          items?: Array<{
            id?: string
            order?: number
            text?: string
            isDistractor?: boolean
          }>
        }
      }>
    }>
  }>
}

function trimText(value: string | undefined) {
  return (value ?? '').trim()
}

function toStringArray(options: unknown) {
  if (Array.isArray(options)) {
    return options
      .map((entry) => String(entry ?? '').trim())
      .filter((entry) => entry.length > 0)
  }
  if (typeof options === 'string') {
    return options
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  }
  return []
}

export function validatePublisherCourse(
  course: CourseLike,
): PublisherValidationResult {
  const issues: PublisherValidationIssue[] = []
  const modules = course.modules ?? []

  modules.forEach((module, moduleIndex) => {
    const modulePath: ValidationPath = {
      moduleId: module.id,
      moduleTitle: module.title,
      moduleOrder: module.order ?? moduleIndex + 1,
    }

    const lessons = module.lessons ?? []
    if (lessons.length === 0) {
      issues.push({
        severity: 'warning',
        code: 'MODULE_HAS_NO_LESSONS',
        path: modulePath,
      })
    }

    lessons.forEach((lesson, lessonIndex) => {
      const lessonPath: ValidationPath = {
        ...modulePath,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonOrder: lesson.order ?? lessonIndex + 1,
      }

      if (!trimText(lesson.title)) {
        issues.push({
          severity: 'warning',
          code: 'LESSON_TITLE_EMPTY',
          path: lessonPath,
        })
      }

      const contentPages = lesson.contentPages ?? []
      if (contentPages.length === 0) {
        issues.push({
          severity: 'warning',
          code: 'LESSON_HAS_NO_CONTENT_PAGES',
          path: lessonPath,
        })
      }

      const exercises = lesson.exercises ?? []
      exercises.forEach((exercise, exerciseIndex) => {
        const exercisePath: ValidationPath = {
          ...lessonPath,
          exerciseId: exercise.id,
          exerciseTitle: exercise.title,
          exerciseOrder: exerciseIndex + 1,
        }

        if (exercise.type === 'MULTIPLE_CHOICE') {
          const choices = exercise.multipleChoice?.choices ?? []
          if (choices.length === 0) {
            issues.push({
              severity: 'error',
              code: 'MULTIPLE_CHOICE_HAS_NO_CHOICES',
              path: exercisePath,
            })
          }
          const hasCorrectChoice = choices.some((choice) => choice.isCorrect)
          if (!hasCorrectChoice) {
            issues.push({
              severity: 'error',
              code: 'MULTIPLE_CHOICE_NO_CORRECT_CHOICE',
              path: exercisePath,
            })
          }
          return
        }

        if (exercise.type === 'REORDERING') {
          const items = exercise.reordering?.items ?? []
          if (items.length === 0) {
            issues.push({
              severity: 'error',
              code: 'REORDERING_HAS_NO_ITEMS',
              path: exercisePath,
            })
          }

          const sequenceItems = items.filter((item) => !item.isDistractor)
          if (sequenceItems.length < 2) {
            issues.push({
              severity: 'error',
              code: 'REORDERING_NEEDS_TWO_SEQUENCE_ITEMS',
              path: exercisePath,
            })
          }

          items.forEach((item) => {
            if (!trimText(item.text)) {
              issues.push({
                severity: 'error',
                code: 'REORDERING_ITEM_TEXT_EMPTY',
                path: exercisePath,
              })
            }
          })

          return
        }

        const steps = exercise.fillInBlank?.steps ?? []
        steps.forEach((step, stepIndex) => {
          const stepPath: ValidationPath = {
            ...exercisePath,
            stepId: step.id,
            stepOrder: step.order ?? stepIndex + 1,
          }
          const blanks = step.blanks ?? []

          if (blanks.length === 0) {
            issues.push({
              severity: 'error',
              code: 'FILL_STEP_HAS_NO_BLANKS',
              path: stepPath,
            })
          }

          blanks.forEach((blank, blankIndex) => {
            const blankPath: ValidationPath = {
              ...stepPath,
              blankId: blank.id,
              blankOrder: blankIndex + 1,
            }
            const normalizedCorrect = trimText(blank.correct)
            if (!normalizedCorrect) {
              issues.push({
                severity: 'error',
                code: 'FILL_BLANK_CORRECT_EMPTY',
                path: blankPath,
              })
            }

            if (blank.variant === 'OPTIONS') {
              const normalizedOptions = toStringArray(blank.options)
              if (normalizedOptions.length < 2) {
                issues.push({
                  severity: 'error',
                  code: 'FILL_OPTIONS_TOO_FEW',
                  path: blankPath,
                })
              }

              const normalizedCorrectLower = normalizedCorrect.toLowerCase()
              if (
                normalizedCorrectLower &&
                !normalizedOptions.some(
                  (option) => option.toLowerCase() === normalizedCorrectLower,
                )
              ) {
                issues.push({
                  severity: 'error',
                  code: 'FILL_OPTIONS_MISSING_CORRECT',
                  path: blankPath,
                })
              }
            }
          })
        })
      })
    })
  })

  return {
    issues,
    errors: issues.filter((issue) => issue.severity === 'error'),
    warnings: issues.filter((issue) => issue.severity === 'warning'),
    hasErrors: issues.some((issue) => issue.severity === 'error'),
  }
}

function label(value: string | undefined, fallback: string) {
  const normalized = trimText(value)
  return normalized.length > 0 ? normalized : fallback
}

function describeLocation(path: ValidationPath) {
  if (path.exerciseOrder) {
    return `Exercise ${path.exerciseOrder} "${label(path.exerciseTitle, 'Untitled exercise')}"`
  }
  if (path.lessonOrder) {
    return `Lesson ${path.lessonOrder} "${label(path.lessonTitle, 'Untitled lesson')}"`
  }
  if (path.moduleOrder) {
    return `Module ${path.moduleOrder} "${label(path.moduleTitle, 'Untitled module')}"`
  }
  return 'Course draft'
}

export function formatPublisherValidationIssue(
  issue: PublisherValidationIssue,
) {
  const location = describeLocation(issue.path)
  switch (issue.code) {
    case 'MODULE_HAS_NO_LESSONS':
      return `${location} has no lessons.`
    case 'LESSON_TITLE_EMPTY':
      return `${location} is missing a lesson title.`
    case 'LESSON_HAS_NO_CONTENT_PAGES':
      return `${location} has no content pages.`
    case 'FILL_STEP_HAS_NO_BLANKS':
      return `${location} has a fill-in-the-blank step without blanks.`
    case 'FILL_BLANK_CORRECT_EMPTY':
      return `${location} has a blank without a correct answer.`
    case 'FILL_OPTIONS_TOO_FEW':
      return `${location} has an options blank with fewer than two options.`
    case 'FILL_OPTIONS_MISSING_CORRECT':
      return `${location} has an options blank where choices do not include the correct answer.`
    case 'MULTIPLE_CHOICE_HAS_NO_CHOICES':
      return `${location} has no answer choices.`
    case 'MULTIPLE_CHOICE_NO_CORRECT_CHOICE':
      return `${location} has no correct choice selected.`
    case 'REORDERING_HAS_NO_ITEMS':
      return `${location} has no reordering items.`
    case 'REORDERING_NEEDS_TWO_SEQUENCE_ITEMS':
      return `${location} needs at least two non-distractor items in sequence.`
    case 'REORDERING_ITEM_TEXT_EMPTY':
      return `${location} has a reordering item without text.`
    default:
      return `${location} has a validation issue.`
  }
}
