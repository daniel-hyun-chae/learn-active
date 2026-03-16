import {
  boolean,
  index,
  jsonb,
  pgTable,
  integer,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export type CourseContent = {
  modules: Array<{
    id: string
    title: string
    order: number
    lessons: Array<{
      id: string
      title: string
      order: number
      contents: Array<{
        id: string
        type: string
        text?: string
        html?: string
        imageUrl?: string
        imageAlt?: string
        lexicalJson?: string
      }>
      contentPages: Array<{
        id: string
        title: string
        order: number
        contents: Array<{
          id: string
          type: string
          text?: string
          html?: string
          imageUrl?: string
          imageAlt?: string
          lexicalJson?: string
        }>
      }>
      exercises: Array<{
        id: string
        type: string
        title: string
        instructions?: string
        steps: Array<{
          id: string
          order: number
          prompt: string
          threadId: string
          threadTitle?: string
          segments: Array<{
            type: string
            text?: string
            blankId?: string
          }>
          blanks: Array<{
            id: string
            correct: string
            variant: string
            options?: string[]
          }>
        }>
      }>
    }>
  }>
}

export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey(),
  email: text('email'),
  displayName: text('display_name'),
})

export const owners = pgTable(
  'owners',
  {
    id: uuid('id').primaryKey(),
    type: text('type').notNull(),
    personalUserId: uuid('personal_user_id').references(() => profiles.userId),
    name: text('name'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    personalUserUnique: uniqueIndex('owners_personal_user_id_unique').on(
      table.personalUserId,
    ),
    typeIdx: index('owners_type_idx').on(table.type),
  }),
)

export const ownerMembers = pgTable(
  'owner_members',
  {
    id: uuid('id').primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => owners.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.userId),
    role: text('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    ownerUserUnique: uniqueIndex('owner_members_owner_user_idx').on(
      table.ownerId,
      table.userId,
    ),
    ownerIdx: index('owner_members_owner_id_idx').on(table.ownerId),
    userIdx: index('owner_members_user_id_idx').on(table.userId),
  }),
)

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => owners.id),
    slug: text('slug').notNull(),
    priceCents: integer('price_cents'),
    currency: text('currency').notNull().default('eur'),
    stripePriceId: text('stripe_price_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    ownerIdIdx: index('courses_owner_id_idx').on(table.ownerId),
    slugUnique: uniqueIndex('courses_slug_key').on(table.slug),
  }),
)

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.userId),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    stripeSessionId: text('stripe_session_id').notNull(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    stripeSessionUnique: uniqueIndex('payments_stripe_session_id_key').on(
      table.stripeSessionId,
    ),
    userIdx: index('payments_user_id_idx').on(table.userId),
    courseIdx: index('payments_course_id_idx').on(table.courseId),
  }),
)

export const courseVersions = pgTable(
  'course_versions',
  {
    id: uuid('id').primaryKey(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    version: integer('version').notNull(),
    status: text('status').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    content: jsonb('content').$type<CourseContent>().notNull(),
    changeNote: text('change_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => profiles.userId),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => ({
    courseIdIdx: index('course_versions_course_id_idx').on(table.courseId),
    courseStatusIdx: index('course_versions_course_status_idx').on(
      table.courseId,
      table.status,
    ),
    courseVersionUnique: uniqueIndex(
      'course_versions_course_id_version_key',
    ).on(table.courseId, table.version),
  }),
)

export const coursePublications = pgTable(
  'course_publications',
  {
    courseId: uuid('course_id')
      .primaryKey()
      .references(() => courses.id),
    publishedVersionId: uuid('published_version_id')
      .notNull()
      .references(() => courseVersions.id),
    publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    versionIdx: index('course_publications_version_idx').on(
      table.publishedVersionId,
    ),
  }),
)

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.userId),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow(),
    status: text('status').notNull(),
  },
  (table) => ({
    userCourseUnique: uniqueIndex('enrollments_user_id_course_id_key').on(
      table.userId,
      table.courseId,
    ),
    userIdx: index('enrollments_user_id_idx').on(table.userId),
    courseIdx: index('enrollments_course_id_idx').on(table.courseId),
  }),
)

export const learnerExerciseAttempts = pgTable(
  'learner_exercise_attempts',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.userId),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    courseVersionId: uuid('course_version_id')
      .notNull()
      .references(() => courseVersions.id),
    lessonId: text('lesson_id').notNull(),
    exerciseId: text('exercise_id').notNull(),
    answers: jsonb('answers').$type<Record<string, string>>().notNull(),
    isCorrect: boolean('is_correct').notNull(),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userCourseIdx: index('learner_exercise_attempts_user_course_idx').on(
      table.userId,
      table.courseId,
    ),
    userVersionIdx: index('learner_exercise_attempts_user_version_idx').on(
      table.userId,
      table.courseVersionId,
    ),
    uniqueAttempt: uniqueIndex('learner_exercise_attempts_unique').on(
      table.userId,
      table.courseId,
      table.courseVersionId,
      table.lessonId,
      table.exerciseId,
    ),
  }),
)

export const learnerExerciseAttemptHistory = pgTable(
  'learner_exercise_attempt_history',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.userId),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),
    courseVersionId: uuid('course_version_id')
      .notNull()
      .references(() => courseVersions.id),
    lessonId: text('lesson_id').notNull(),
    exerciseId: text('exercise_id').notNull(),
    answers: jsonb('answers').$type<Record<string, string>>().notNull(),
    isCorrect: boolean('is_correct').notNull(),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userCourseIdx: index('learner_attempt_history_user_course_idx').on(
      table.userId,
      table.courseId,
    ),
    userVersionIdx: index('learner_attempt_history_user_version_idx').on(
      table.userId,
      table.courseVersionId,
    ),
    exerciseIdx: index('learner_attempt_history_exercise_idx').on(
      table.userId,
      table.courseId,
      table.courseVersionId,
      table.lessonId,
      table.exerciseId,
      table.attemptedAt,
    ),
  }),
)
