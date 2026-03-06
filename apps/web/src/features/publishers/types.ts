export type CourseDraft = {
  id?: string
  title: string
  description: string
  language: string
  modules: ModuleDraft[]
}

export type ModuleDraft = {
  id?: string
  title: string
  order: number
  lessons: LessonDraft[]
}

export type LessonDraft = {
  id?: string
  title: string
  order: number
  contents: ContentDraft[]
  exercises: ExerciseDraft[]
}

export type ContentDraft = {
  id?: string
  type: 'TEXT' | 'IMAGE'
  text?: string
  html?: string
  imageUrl?: string
  imageAlt?: string
  lexicalJson?: string
}

export type ExerciseDraft = {
  id?: string
  type: 'FILL_IN_THE_BLANK'
  title: string
  instructions?: string
  steps: ExerciseStepDraft[]
}

export type ExerciseStepDraft = {
  id?: string
  order: number
  prompt: string
  threadId: string
  threadTitle?: string
  template?: string
  blanks: ExerciseBlankDraft[]
  segments?: ExerciseStepSegmentDraft[]
}

export type ExerciseStepSegmentDraft = {
  type: 'TEXT' | 'BLANK'
  text?: string
  blankId?: string
}

export type ExerciseBlankDraft = {
  id?: string
  variant: 'TYPING' | 'OPTIONS'
  correct: string
  options?: string
}
