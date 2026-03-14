export type CourseDraft = {
  id?: string
  versionId?: string
  version?: number
  status?: 'draft' | 'published' | 'archived'
  title: string
  description: string
  priceCents?: number | null
  currency?: string
  stripePriceId?: string | null
  isPaid?: boolean
  changeNote?: string | null
  createdAt?: string
  createdBy?: string
  publishedAt?: string | null
  archivedAt?: string | null
  modules: ModuleDraft[]
}

export type CourseVersionHistoryEntry = {
  versionId: string
  version: number
  status: 'draft' | 'published' | 'archived'
  title: string
  changeNote?: string | null
  createdAt: string
  createdBy: string
  publishedAt?: string | null
  archivedAt?: string | null
}

export type CourseVersionDiff = {
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
  contentPages: LessonContentPageDraft[]
  exercises: ExerciseDraft[]
}

export type LessonContentPageDraft = {
  id?: string
  title: string
  order: number
  contents: ContentDraft[]
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
