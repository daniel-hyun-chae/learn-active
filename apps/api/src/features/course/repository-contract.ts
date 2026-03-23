import type {
  CourseProgressRecord,
  CourseVersionDiffRecord,
  CourseVersionHistoryRecord,
  LearnerExerciseAttemptRecord,
  LearnerExerciseAttemptHistoryRecord,
  LearnerResumePositionRecord,
  EnrollmentRecord,
  PaymentRecord,
  PublicCourseRecord,
  PublisherCourseRecord,
} from './model.js'

export type CourseWriteRow = {
  id: string
  title: string
  description: string
  priceCents: number | null
  currency: string
  stripePriceId: string | null
  categoryIds: string[]
  tags: string[]
  languageCode: string
  previewLessonId: string | null
  content: { modules: PublisherCourseRecord['content']['modules'] }
}

export type PublicCatalogQuery = {
  search?: string
  categoryIds?: string[]
  priceFilter?: 'all' | 'free' | 'paid'
  languageCodes?: string[]
  sort?: 'popular' | 'title'
  limit?: number
}

export type PublicPreviewLessonRecord = {
  course: PublicCourseRecord
  lesson: PublisherCourseRecord['content']['modules'][number]['lessons'][number]
}

export type CourseRepository = {
  ensureSystemSeedCourse: () => Promise<void>
  provisionPersonalOwner: (args: {
    userId: string
    email: string | null
  }) => Promise<{ ownerId: string }>
  listPublicCourses: (
    query?: PublicCatalogQuery,
  ) => Promise<PublicCourseRecord[]>
  getPublicCourseById: (id: string) => Promise<PublicCourseRecord | null>
  getPublicCourseBySlug: (slug: string) => Promise<PublicCourseRecord | null>
  getPublicPreviewLessonBySlug: (
    slug: string,
  ) => Promise<PublicPreviewLessonRecord | null>
  getEnrollmentForUserCourse: (args: {
    userId: string
    courseId: string
  }) => Promise<EnrollmentRecord | null>
  upsertLearnerResumePosition: (args: {
    userId: string
    courseId: string
    lessonId: string
    block: 'summary' | 'contentPage' | 'exercise'
    contentPageId?: string | null
    exerciseId?: string | null
  }) => Promise<LearnerResumePositionRecord>
  enrollInCourse: (args: {
    userId: string
    courseId: string
  }) => Promise<EnrollmentRecord>
  listMyPayments: (args: { userId: string }) => Promise<PaymentRecord[]>
  recordStripePayment: (args: {
    userId: string
    courseId: string
    stripeSessionId: string
    stripePaymentIntentId: string | null
    amountCents: number
    currency: string
    status: string
  }) => Promise<PaymentRecord>
  ensureEnrollmentForPaidCourse: (args: {
    userId: string
    courseId: string
  }) => Promise<EnrollmentRecord>
  listMyCourses: (args: { userId: string }) => Promise<
    Array<{
      id: string
      slug: string
      title: string
      description: string
      version: number
      status: string
      enrolledAt: string
    }>
  >
  listLearnerCourses: (args: {
    userId: string
  }) => Promise<PublisherCourseRecord[]>
  getLearnerCourseById: (args: {
    userId: string
    id: string
  }) => Promise<PublisherCourseRecord | null>
  upsertLearnerExerciseAttempt: (args: {
    userId: string
    courseId: string
    courseVersionId: string
    lessonId: string
    exerciseId: string
    answers: Record<string, string>
    isCorrect: boolean
  }) => Promise<LearnerExerciseAttemptRecord>
  getLearnerCourseProgress: (args: {
    userId: string
    courseId: string
  }) => Promise<CourseProgressRecord | null>
  listLearnerExerciseAttemptHistory: (args: {
    userId: string
    courseId: string
    courseVersionId: string
    lessonId: string
    exerciseId: string
  }) => Promise<LearnerExerciseAttemptHistoryRecord[]>
  listPublisherCourses: (args: {
    userId: string
    email: string | null
  }) => Promise<PublisherCourseRecord[]>
  getPublisherCourseById: (args: {
    userId: string
    email: string | null
    id: string
  }) => Promise<PublisherCourseRecord | null>
  upsertPublisherCourse: (args: {
    userId: string
    email: string | null
    row: CourseWriteRow
  }) => Promise<PublisherCourseRecord>
  seedPublisherSampleCourse: (args: {
    userId: string
    email: string | null
    row: CourseWriteRow
  }) => Promise<PublisherCourseRecord>
  createDraftFromPublished: (args: {
    userId: string
    email: string | null
    courseId: string
  }) => Promise<PublisherCourseRecord>
  publishCourseDraft: (args: {
    userId: string
    email: string | null
    courseId: string
    changeNote?: string | null
  }) => Promise<PublisherCourseRecord>
  restoreVersionAsDraft: (args: {
    userId: string
    email: string | null
    courseId: string
    versionId: string
  }) => Promise<PublisherCourseRecord>
  listCourseVersionHistory: (args: {
    userId: string
    email: string | null
    courseId: string
  }) => Promise<CourseVersionHistoryRecord[]>
  diffCourseVersions: (args: {
    userId: string
    email: string | null
    courseId: string
    fromVersionId: string
    toVersionId: string
  }) => Promise<CourseVersionDiffRecord>
}
