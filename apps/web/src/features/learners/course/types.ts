export type Course = {
  id: string
  title: string
  description: string
  modules: Module[]
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

export type Exercise = {
  id: string
  type: 'FILL_IN_THE_BLANK'
  title: string
  steps: ExerciseStep[]
}

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
