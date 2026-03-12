import type { CourseInput } from './inputs.js'
import type { Course } from './types.js'

export type IdGenerator = () => string

export type CourseContent = {
  modules: Course['modules']
}

export type PublisherCourseRecord = {
  courseId: string
  slug: string
  ownerId: string
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
  ownerDisplayName?: string
}

export type EnrollmentRecord = {
  id: string
  courseId: string
  status: string
  enrolledAt: string
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

function ensureId(generateId: IdGenerator, value?: string): string {
  return value && value.length > 0 ? value : generateId()
}

export function normalizeCourseInput(
  input: CourseInput,
  generateId: IdGenerator,
): { id: string; title: string; description: string; content: CourseContent } {
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
        id: ensureId(generateId, exerciseInput.id),
        type: exerciseInput.type,
        title: exerciseInput.title,
        instructions: exerciseInput.instructions,
        steps: (exerciseInput.steps ?? []).map((stepInput, stepIndex) => ({
          id: ensureId(generateId, stepInput.id),
          order: stepInput.order ?? stepIndex + 1,
          prompt: stepInput.prompt,
          threadId: stepInput.threadId,
          threadTitle: stepInput.threadTitle,
          segments: (stepInput.segments ?? []).map((segmentInput) => ({
            type: segmentInput.type,
            text: segmentInput.text,
            blankId: segmentInput.blankId,
          })),
          blanks: (stepInput.blanks ?? []).map((blankInput) => ({
            id: ensureId(generateId, blankInput.id),
            correct: blankInput.correct,
            variant: blankInput.variant,
            options: blankInput.options,
          })),
        })),
      })),
    })),
  }))

  return {
    id: input.id ?? generateId(),
    title: input.title,
    description: input.description,
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
    changeNote: record.changeNote ?? null,
    createdAt: record.createdAt,
    createdBy: record.createdBy,
    publishedAt: record.publishedAt,
    archivedAt: record.archivedAt ?? null,
    modules: record.content.modules,
  }
}
