export type Course = {
  id: string
  versionId: string
  slug?: string
  title: string
  description: string
  priceCents?: number | null
  currency?: string
  isPaid?: boolean
  categoryIds?: string[]
  tags?: string[]
  languageCode?: string
  previewLessonId?: string | null
  resumePosition?: LearnerResumePosition | null
  modules: Module[]
}

export type LearnerResumePosition = {
  courseId: string
  lessonId: string
  block: 'summary' | 'contentPage' | 'exercise'
  contentPageId: string | null
  exerciseId: string | null
  visitedAt: string
}

export type ExerciseAttemptStatus = {
  exerciseId: string
  attempted: boolean
  isCorrect: boolean | null
  attemptedAt: string | null
}

export type LessonProgress = {
  lessonId: string
  completedExercises: number
  totalExercises: number
  percentComplete: number
  exerciseAttempts: ExerciseAttemptStatus[]
}

export type ModuleProgress = {
  moduleId: string
  completedExercises: number
  totalExercises: number
  percentComplete: number
  lessons: LessonProgress[]
}

export type CourseProgress = {
  courseId: string
  courseVersionId: string
  completedExercises: number
  totalExercises: number
  percentComplete: number
  modules: ModuleProgress[]
}

export type Module = {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

export type Lesson = {
  id: string
  title: string
  order: number
  contents: ContentBlock[]
  contentPages: LessonContentPage[]
  exercises: Exercise[]
}

export type LessonContentPage = {
  id: string
  title: string
  order: number
  contents: ContentBlock[]
}

export type ContentBlock = {
  id: string
  type: 'TEXT' | 'IMAGE'
  text?: string
  imageUrl?: string
  imageAlt?: string
}

export type FillInBlankExercise = {
  id: string
  type: 'FILL_IN_THE_BLANK'
  title: string
  instructions?: string
  fillInBlank: {
    steps: ExerciseStep[]
  }
}

export type MultipleChoiceExercise = {
  id: string
  type: 'MULTIPLE_CHOICE'
  title: string
  instructions?: string
  multipleChoice: {
    question: string
    allowsMultiple: boolean
    choices: MultipleChoiceChoice[]
  }
}

export type ReorderingExercise = {
  id: string
  type: 'REORDERING'
  title: string
  instructions?: string
  reordering: {
    prompt: string
    items: ReorderingItem[]
  }
}

export type Exercise =
  | FillInBlankExercise
  | MultipleChoiceExercise
  | ReorderingExercise

export type ExerciseStep = {
  id: string
  order: number
  prompt: string
  threadId: string
  threadTitle?: string
  segments: SentenceSegment[]
  blanks: ExerciseBlank[]
}

export type SentenceSegment = {
  type: 'TEXT' | 'BLANK'
  text?: string
  blankId?: string
}

export type ExerciseBlank = {
  id: string
  correct: string
  variant: 'TYPING' | 'OPTIONS'
  options?: string[]
}

export type MultipleChoiceChoice = {
  id: string
  order: number
  text: string
  isCorrect: boolean
}

export type ReorderingItem = {
  id: string
  order: number
  text: string
  isDistractor: boolean
}
