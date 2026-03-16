import type {
  CourseProgressRecord,
  CourseVersionDiffRecord,
  CourseVersionHistoryRecord,
  LearnerExerciseAttemptRecord,
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
  content: { modules: PublisherCourseRecord['content']['modules'] }
}

export type CourseRepository = {
  provisionPersonalOwner: (args: {
    userId: string
    email: string | null
  }) => Promise<{ ownerId: string }>
  listPublicCourses: () => Promise<PublicCourseRecord[]>
  getPublicCourseById: (id: string) => Promise<PublicCourseRecord | null>
  getPublicCourseBySlug: (slug: string) => Promise<PublicCourseRecord | null>
  getEnrollmentForUserCourse: (args: {
    userId: string
    courseId: string
  }) => Promise<EnrollmentRecord | null>
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
