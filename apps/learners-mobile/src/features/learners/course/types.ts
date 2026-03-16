export type Course = {
  id: string
  slug?: string
  title: string
  description: string
  priceCents?: number | null
  currency?: string
  isPaid?: boolean
  modules: Module[]
}

export type CatalogCourse = {
  id: string
  slug: string
  title: string
  description: string
  priceCents?: number | null
  currency: string
  isPaid: boolean
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

export type Exercise = FillInBlankExercise | MultipleChoiceExercise

export type ExerciseStep = {
  id: string
  order: number
  prompt: string
  threadId: string
  threadTitle?: string
  segments: SentenceSegment[]
  blanks: ExerciseBlank[]
}

export type SentenceSegment =
  | { type: 'TEXT'; text?: string }
  | { type: 'BLANK'; blankId?: string }

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
