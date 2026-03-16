import { randomUUID } from 'node:crypto'
import type { createNodeDb } from '../../db/connection.js'
import type {
  CourseProgressRecord,
  LearnerExerciseAttemptRecord,
  LearnerExerciseAttemptHistoryRecord,
  ModuleProgressRecord,
  LessonProgressRecord,
  ExerciseAttemptStatusRecord,
  EnrollmentRecord,
  PaymentRecord,
  PublicCourseRecord,
  PublisherCourseRecord,
} from './model.js'
import type { CourseRepository } from './repository-contract.js'
import {
  createNodePostgresCourseRepository,
  createWorkerSupabaseCourseRepositoryImpl,
} from './repository-db.js'
import { seedCourseRow } from './seed.js'

type NodeDb = NonNullable<Awaited<ReturnType<typeof createNodeDb>>>

type CourseIdentity = {
  id: string
  ownerId: string
  slug: string
  priceCents: number | null
  currency: string
  stripePriceId: string | null
}

type CourseVersion = {
  id: string
  courseId: string
  version: number
  status: 'draft' | 'published' | 'archived'
  title: string
  description: string
  content: { modules: PublisherCourseRecord['content']['modules'] }
  changeNote: string | null
  createdAt: string
  createdBy: string
  publishedAt: string | null
  archivedAt: string | null
}

type EnrollmentRow = EnrollmentRecord
type PaymentRow = PaymentRecord

export type { CourseRepository, CourseWriteRow } from './repository-contract.js'

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'course'
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function nowIso(): string {
  return new Date().toISOString()
}

type MemoryState = {
  personalOwnerByUser: Map<string, string>
  courses: Map<string, CourseIdentity>
  versions: Map<string, CourseVersion>
  publicationByCourse: Map<string, string>
  enrollments: Map<string, EnrollmentRow>
  paymentsBySession: Map<string, PaymentRow>
  learnerAttemptsByKey: Map<string, LearnerExerciseAttemptRecord>
  learnerAttemptHistory: LearnerExerciseAttemptHistoryRecord[]
}

function buildInitialState(): MemoryState {
  const state: MemoryState = {
    personalOwnerByUser: new Map(),
    courses: new Map(),
    versions: new Map(),
    publicationByCourse: new Map(),
    enrollments: new Map(),
    paymentsBySession: new Map(),
    learnerAttemptsByKey: new Map(),
    learnerAttemptHistory: [],
  }

  const courseId = seedCourseRow.id
  const versionId = `version-${courseId}-1`
  const seededAt = nowIso()

  state.courses.set(courseId, {
    id: courseId,
    ownerId: seedCourseRow.ownerId,
    slug: `${slugify(seedCourseRow.title)}-seed`,
    priceCents: null,
    currency: 'eur',
    stripePriceId: null,
  })
  state.versions.set(versionId, {
    id: versionId,
    courseId,
    version: 1,
    status: 'published',
    title: seedCourseRow.title,
    description: seedCourseRow.description,
    content: clone(seedCourseRow.content),
    changeNote: 'Initial migrated published version',
    createdAt: seededAt,
    createdBy: seedCourseRow.ownerId,
    publishedAt: seededAt,
    archivedAt: null,
  })
  state.publicationByCourse.set(courseId, versionId)

  return state
}

const sharedMemoryState = buildInitialState()

function flattenJson(
  value: unknown,
  prefix = '',
  out = new Map<string, string>(),
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenJson(item, `${prefix}[${index}]`, out)
    })
    return out
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0 && prefix) {
      out.set(prefix, '{}')
      return out
    }
    entries.forEach(([key, child]) => {
      const next = prefix ? `${prefix}.${key}` : key
      flattenJson(child, next, out)
    })
    return out
  }

  out.set(prefix || '$', JSON.stringify(value))
  return out
}

function toPercent(completed: number, total: number) {
  if (total <= 0) {
    return 0
  }
  return Math.round((completed / total) * 100)
}

function buildCourseProgressFromContent(args: {
  courseId: string
  courseVersionId: string
  content: PublisherCourseRecord['content']
  attempts: LearnerExerciseAttemptRecord[]
}): CourseProgressRecord {
  const attemptsByLessonExercise = new Map<
    string,
    LearnerExerciseAttemptRecord
  >()
  for (const attempt of args.attempts) {
    attemptsByLessonExercise.set(
      `${attempt.lessonId}:${attempt.exerciseId}`,
      attempt,
    )
  }

  const modules: ModuleProgressRecord[] = args.content.modules.map((module) => {
    const lessons: LessonProgressRecord[] = module.lessons.map((lesson) => {
      const exerciseAttempts: ExerciseAttemptStatusRecord[] =
        lesson.exercises.map((exercise) => {
          const attempt = attemptsByLessonExercise.get(
            `${lesson.id}:${exercise.id}`,
          )

          return {
            exerciseId: exercise.id,
            attempted: Boolean(attempt),
            isCorrect: attempt ? attempt.isCorrect : null,
            attemptedAt: attempt ? attempt.attemptedAt : null,
          }
        })

      const totalExercises = exerciseAttempts.length
      const completedExercises = exerciseAttempts.filter(
        (attempt) => attempt.attempted,
      ).length

      return {
        lessonId: lesson.id,
        completedExercises,
        totalExercises,
        percentComplete: toPercent(completedExercises, totalExercises),
        exerciseAttempts,
      }
    })

    const totalExercises = lessons.reduce(
      (sum, lesson) => sum + lesson.totalExercises,
      0,
    )
    const completedExercises = lessons.reduce(
      (sum, lesson) => sum + lesson.completedExercises,
      0,
    )

    return {
      moduleId: module.id,
      completedExercises,
      totalExercises,
      percentComplete: toPercent(completedExercises, totalExercises),
      lessons,
    }
  })

  const totalExercises = modules.reduce(
    (sum, module) => sum + module.totalExercises,
    0,
  )
  const completedExercises = modules.reduce(
    (sum, module) => sum + module.completedExercises,
    0,
  )

  return {
    courseId: args.courseId,
    courseVersionId: args.courseVersionId,
    completedExercises,
    totalExercises,
    percentComplete: toPercent(completedExercises, totalExercises),
    modules,
  }
}

function createRepositoryFromState(state: MemoryState): CourseRepository {
  async function provisionPersonalOwner({
    userId,
  }: {
    userId: string
    email: string | null
  }) {
    const existing = state.personalOwnerByUser.get(userId)
    if (existing) {
      return { ownerId: existing }
    }
    const ownerId = `owner-${userId}`
    state.personalOwnerByUser.set(userId, ownerId)
    return { ownerId }
  }

  function listVersionsForCourse(courseId: string): CourseVersion[] {
    return Array.from(state.versions.values())
      .filter((version) => version.courseId === courseId)
      .sort((a, b) => a.version - b.version)
  }

  function latestDraftForCourse(courseId: string): CourseVersion | null {
    const drafts = listVersionsForCourse(courseId).filter(
      (version) => version.status === 'draft',
    )
    return drafts.length > 0 ? drafts[drafts.length - 1] : null
  }

  function publishedForCourse(courseId: string): CourseVersion | null {
    const publicationId = state.publicationByCourse.get(courseId)
    if (!publicationId) {
      return null
    }
    const version = state.versions.get(publicationId)
    return version ? clone(version) : null
  }

  function mapPublisherRecord(
    course: CourseIdentity,
    version: CourseVersion,
  ): PublisherCourseRecord {
    return {
      courseId: course.id,
      slug: course.slug,
      ownerId: course.ownerId,
      priceCents: course.priceCents,
      currency: course.currency,
      stripePriceId: course.stripePriceId,
      versionId: version.id,
      version: version.version,
      status: version.status,
      title: version.title,
      description: version.description,
      content: clone(version.content),
      changeNote: version.changeNote,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
      publishedAt: version.publishedAt,
      archivedAt: version.archivedAt,
    }
  }

  async function ensureOwnedCourse(args: {
    userId: string
    email: string | null
    courseId: string
  }): Promise<CourseIdentity> {
    const { ownerId } = await provisionPersonalOwner(args)
    const course = state.courses.get(args.courseId)
    if (!course || course.ownerId !== ownerId) {
      throw new Error('Course is not editable by current publisher.')
    }
    return course
  }

  async function ensurePublisherCourse(args: {
    userId: string
    email: string | null
    id: string
  }): Promise<PublisherCourseRecord | null> {
    const course = await ensureOwnedCourse({
      userId: args.userId,
      email: args.email,
      courseId: args.id,
    }).catch(() => null)
    if (!course) {
      return null
    }

    const draft = latestDraftForCourse(course.id)
    if (draft) {
      return mapPublisherRecord(course, draft)
    }

    const published = publishedForCourse(course.id)
    return published ? mapPublisherRecord(course, published) : null
  }

  async function createDraftFromPublishedInternal(args: {
    userId: string
    email: string | null
    courseId: string
  }): Promise<PublisherCourseRecord> {
    const course = await ensureOwnedCourse(args)

    const existingDraft = latestDraftForCourse(course.id)
    if (existingDraft) {
      return mapPublisherRecord(course, existingDraft)
    }

    const published = publishedForCourse(course.id)
    if (!published) {
      throw new Error('No published version exists for this course.')
    }

    const nextVersion =
      Math.max(...listVersionsForCourse(course.id).map((v) => v.version), 0) + 1
    const draft: CourseVersion = {
      ...clone(published),
      id: randomUUID(),
      version: nextVersion,
      status: 'draft',
      changeNote: null,
      createdAt: nowIso(),
      createdBy: args.userId,
      publishedAt: null,
      archivedAt: null,
    }

    state.versions.set(draft.id, draft)
    return mapPublisherRecord(course, draft)
  }

  return {
    provisionPersonalOwner,

    async listPublicCourses() {
      const rows: PublicCourseRecord[] = []
      for (const course of state.courses.values()) {
        const published = publishedForCourse(course.id)
        if (!published) {
          continue
        }
        rows.push({
          id: course.id,
          slug: course.slug,
          title: published.title,
          description: published.description,
          priceCents: course.priceCents,
          currency: course.currency,
          stripePriceId: course.stripePriceId,
          isPaid:
            typeof course.priceCents === 'number' && course.priceCents > 0,
          ownerDisplayName: undefined,
        })
      }
      return rows.sort((a, b) => a.title.localeCompare(b.title))
    },

    async getPublicCourseById(id) {
      const course = state.courses.get(id)
      if (!course) {
        return null
      }
      const published = publishedForCourse(course.id)
      if (!published) {
        return null
      }
      return {
        id: course.id,
        slug: course.slug,
        title: published.title,
        description: published.description,
        priceCents: course.priceCents,
        currency: course.currency,
        stripePriceId: course.stripePriceId,
        isPaid: typeof course.priceCents === 'number' && course.priceCents > 0,
        ownerDisplayName: undefined,
      }
    },

    async getPublicCourseBySlug(slug) {
      const course = Array.from(state.courses.values()).find(
        (row) => row.slug === slug,
      )
      if (!course) {
        return null
      }
      const published = publishedForCourse(course.id)
      if (!published) {
        return null
      }
      return {
        id: course.id,
        slug: course.slug,
        title: published.title,
        description: published.description,
        priceCents: course.priceCents,
        currency: course.currency,
        stripePriceId: course.stripePriceId,
        isPaid: typeof course.priceCents === 'number' && course.priceCents > 0,
        ownerDisplayName: undefined,
      }
    },

    async getEnrollmentForUserCourse({ userId, courseId }) {
      const key = `${userId}:${courseId}`
      const enrollment = state.enrollments.get(key)
      return enrollment ? clone(enrollment) : null
    },

    async enrollInCourse({ userId, courseId }) {
      const key = `${userId}:${courseId}`
      const existing = state.enrollments.get(key)
      if (existing) {
        return clone(existing)
      }
      const published = publishedForCourse(courseId)
      if (!published) {
        throw new Error('Course is not published.')
      }
      const enrollment: EnrollmentRow = {
        id: randomUUID(),
        courseId,
        status: 'active',
        enrolledAt: nowIso(),
      }
      state.enrollments.set(key, enrollment)
      return clone(enrollment)
    },

    async listMyPayments({ userId }) {
      return Array.from(state.paymentsBySession.values())
        .filter((payment) => payment.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((payment) => clone(payment))
    },

    async recordStripePayment({
      userId,
      courseId,
      stripeSessionId,
      stripePaymentIntentId,
      amountCents,
      currency,
      status,
    }) {
      const existing = state.paymentsBySession.get(stripeSessionId)
      if (existing) {
        return clone(existing)
      }

      const payment: PaymentRow = {
        id: randomUUID(),
        userId,
        courseId,
        stripeSessionId,
        stripePaymentIntentId,
        amountCents,
        currency,
        status,
        createdAt: nowIso(),
      }
      state.paymentsBySession.set(stripeSessionId, payment)
      return clone(payment)
    },

    async ensureEnrollmentForPaidCourse({ userId, courseId }) {
      return this.enrollInCourse({ userId, courseId })
    },

    async listMyCourses({ userId }) {
      const rows = Array.from(state.enrollments.entries())
        .filter(([key]) => key.startsWith(`${userId}:`))
        .map(([, enrollment]) => enrollment)
        .map((enrollment) => {
          const course = state.courses.get(enrollment.courseId)
          const version = publishedForCourse(enrollment.courseId)
          if (!course || !version) {
            return null
          }
          return {
            id: course.id,
            slug: course.slug,
            title: version.title,
            description: version.description,
            version: version.version,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
          }
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row))

      return rows
    },

    async listLearnerCourses({ userId }) {
      const my = await this.listMyCourses({ userId })
      return my
        .map((entry) => {
          const version = publishedForCourse(entry.id)
          const course = state.courses.get(entry.id)
          if (!version || !course) {
            return null
          }
          return mapPublisherRecord(course, version)
        })
        .filter((row): row is PublisherCourseRecord => Boolean(row))
    },

    async getLearnerCourseById({ id }) {
      const course = state.courses.get(id)
      if (!course) {
        return null
      }
      const published = publishedForCourse(id)
      return published ? mapPublisherRecord(course, published) : null
    },

    async upsertLearnerExerciseAttempt({
      userId,
      courseId,
      courseVersionId,
      lessonId,
      exerciseId,
      answers,
      isCorrect,
    }) {
      const key = `${userId}:${courseId}:${courseVersionId}:${lessonId}:${exerciseId}`
      const previous = state.learnerAttemptsByKey.get(key)
      const attemptedAt = nowIso()
      const attempt: LearnerExerciseAttemptRecord = {
        id: previous?.id ?? randomUUID(),
        userId,
        courseId,
        courseVersionId,
        lessonId,
        exerciseId,
        answers: clone(answers),
        isCorrect,
        attemptedAt,
      }
      state.learnerAttemptsByKey.set(key, attempt)

      state.learnerAttemptHistory.push({
        id: randomUUID(),
        userId,
        courseId,
        courseVersionId,
        lessonId,
        exerciseId,
        answers: clone(answers),
        isCorrect,
        attemptedAt,
      })

      return clone(attempt)
    },

    async getLearnerCourseProgress({ userId, courseId }) {
      const course = state.courses.get(courseId)
      if (!course) {
        return null
      }
      const published = publishedForCourse(courseId)
      if (!published) {
        return null
      }

      const attempts = Array.from(state.learnerAttemptsByKey.values()).filter(
        (attempt) =>
          attempt.userId === userId &&
          attempt.courseId === courseId &&
          attempt.courseVersionId === published.id,
      )

      return buildCourseProgressFromContent({
        courseId,
        courseVersionId: published.id,
        content: published.content,
        attempts,
      })
    },

    async listLearnerExerciseAttemptHistory({
      userId,
      courseId,
      courseVersionId,
      lessonId,
      exerciseId,
    }) {
      return state.learnerAttemptHistory
        .filter(
          (attempt) =>
            attempt.userId === userId &&
            attempt.courseId === courseId &&
            attempt.courseVersionId === courseVersionId &&
            attempt.lessonId === lessonId &&
            attempt.exerciseId === exerciseId,
        )
        .sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt))
        .map((attempt) => clone(attempt))
    },

    async listPublisherCourses({ userId, email }) {
      const { ownerId } = await provisionPersonalOwner({ userId, email })
      const rows: PublisherCourseRecord[] = []

      for (const course of state.courses.values()) {
        if (course.ownerId !== ownerId) {
          continue
        }
        const draft = latestDraftForCourse(course.id)
        const published = publishedForCourse(course.id)
        const selected = draft ?? published
        if (!selected) {
          continue
        }
        rows.push(mapPublisherRecord(course, selected))
      }

      return rows.sort((a, b) => b.version - a.version)
    },

    async getPublisherCourseById({ userId, email, id }) {
      return ensurePublisherCourse({ userId, email, id })
    },

    async upsertPublisherCourse({ userId, email, row }) {
      const { ownerId } = await provisionPersonalOwner({ userId, email })
      const existingCourse = state.courses.get(row.id)

      if (!existingCourse) {
        const slugBase = slugify(row.title)
        let slug = slugBase
        let suffix = 1
        while (
          Array.from(state.courses.values()).some(
            (course) => course.slug === slug,
          )
        ) {
          slug = `${slugBase}-${suffix++}`
        }

        const identity: CourseIdentity = {
          id: row.id,
          ownerId,
          slug,
          priceCents: row.priceCents,
          currency: row.currency,
          stripePriceId: row.stripePriceId,
        }
        state.courses.set(identity.id, identity)

        const version: CourseVersion = {
          id: randomUUID(),
          courseId: identity.id,
          version: 1,
          status: 'draft',
          title: row.title,
          description: row.description,
          content: clone(row.content),
          changeNote: null,
          createdAt: nowIso(),
          createdBy: userId,
          publishedAt: null,
          archivedAt: null,
        }
        state.versions.set(version.id, version)
        return mapPublisherRecord(identity, version)
      }

      if (existingCourse.ownerId !== ownerId) {
        throw new Error('Course is not editable by current publisher.')
      }

      existingCourse.priceCents = row.priceCents
      existingCourse.currency = row.currency
      existingCourse.stripePriceId = row.stripePriceId
      state.courses.set(existingCourse.id, existingCourse)

      const draft = latestDraftForCourse(existingCourse.id)
      const target = draft ?? {
        id: randomUUID(),
        courseId: existingCourse.id,
        version:
          Math.max(
            ...listVersionsForCourse(existingCourse.id).map((v) => v.version),
            0,
          ) + 1,
        status: 'draft' as const,
        title: row.title,
        description: row.description,
        content: clone(row.content),
        changeNote: null,
        createdAt: nowIso(),
        createdBy: userId,
        publishedAt: null,
        archivedAt: null,
      }

      target.title = row.title
      target.description = row.description
      target.content = clone(row.content)
      state.versions.set(target.id, target)

      return mapPublisherRecord(existingCourse, target)
    },

    async seedPublisherSampleCourse({ userId, email, row }) {
      return this.upsertPublisherCourse({ userId, email, row })
    },

    async createDraftFromPublished({ userId, email, courseId }) {
      return createDraftFromPublishedInternal({ userId, email, courseId })
    },

    async publishCourseDraft({ userId, email, courseId, changeNote }) {
      const course = await ensureOwnedCourse({ userId, email, courseId })
      const draft = latestDraftForCourse(course.id)
      if (!draft) {
        throw new Error('No draft version available to publish.')
      }

      const previousPublishedId = state.publicationByCourse.get(courseId)
      if (previousPublishedId) {
        const previous = state.versions.get(previousPublishedId)
        if (previous) {
          previous.status = 'archived'
          previous.archivedAt = nowIso()
          state.versions.set(previous.id, previous)
        }
      }

      draft.status = 'published'
      draft.changeNote = changeNote ?? draft.changeNote ?? null
      draft.publishedAt = nowIso()
      draft.archivedAt = null
      state.versions.set(draft.id, draft)
      state.publicationByCourse.set(courseId, draft.id)

      return mapPublisherRecord(course, draft)
    },

    async restoreVersionAsDraft({ userId, email, courseId, versionId }) {
      const course = await ensureOwnedCourse({ userId, email, courseId })
      const source = state.versions.get(versionId)
      if (!source || source.courseId !== courseId) {
        throw new Error('Version not found for this course.')
      }

      const nextVersion =
        Math.max(...listVersionsForCourse(course.id).map((v) => v.version), 0) +
        1
      const restored: CourseVersion = {
        id: randomUUID(),
        courseId,
        version: nextVersion,
        status: 'draft',
        title: source.title,
        description: source.description,
        content: clone(source.content),
        changeNote: `Restored from v${source.version}`,
        createdAt: nowIso(),
        createdBy: userId,
        publishedAt: null,
        archivedAt: null,
      }

      state.versions.set(restored.id, restored)
      return mapPublisherRecord(course, restored)
    },

    async listCourseVersionHistory({ userId, email, courseId }) {
      await ensureOwnedCourse({ userId, email, courseId })
      return listVersionsForCourse(courseId)
        .map((row) => ({
          versionId: row.id,
          version: row.version,
          status: row.status,
          title: row.title,
          changeNote: row.changeNote,
          createdAt: row.createdAt,
          createdBy: row.createdBy,
          publishedAt: row.publishedAt,
          archivedAt: row.archivedAt,
        }))
        .sort((a, b) => b.version - a.version)
    },

    async diffCourseVersions({
      userId,
      email,
      courseId,
      fromVersionId,
      toVersionId,
    }) {
      await ensureOwnedCourse({ userId, email, courseId })

      const from = state.versions.get(fromVersionId)
      const to = state.versions.get(toVersionId)
      if (
        !from ||
        !to ||
        from.courseId !== courseId ||
        to.courseId !== courseId
      ) {
        throw new Error('Versions not found for this course.')
      }

      const fromFlat = flattenJson(from.content)
      const toFlat = flattenJson(to.content)
      const addedFields: string[] = []
      const removedFields: string[] = []
      const changedFields: string[] = []

      for (const key of toFlat.keys()) {
        if (!fromFlat.has(key)) {
          addedFields.push(key)
          continue
        }
        if (fromFlat.get(key) !== toFlat.get(key)) {
          changedFields.push(key)
        }
      }

      for (const key of fromFlat.keys()) {
        if (!toFlat.has(key)) {
          removedFields.push(key)
        }
      }

      return {
        courseId,
        fromVersionId,
        toVersionId,
        fromVersion: from.version,
        toVersion: to.version,
        titleChanged: from.title !== to.title,
        descriptionChanged: from.description !== to.description,
        addedFields: addedFields.sort(),
        removedFields: removedFields.sort(),
        changedFields: changedFields.sort(),
      }
    },
  }
}

export function createInMemoryCourseRepository(): CourseRepository {
  return createRepositoryFromState(sharedMemoryState)
}

export function createNodeCourseRepository(db: NodeDb): CourseRepository {
  return createNodePostgresCourseRepository(db)
}

export function createWorkerSupabaseCourseRepository(config: {
  supabaseUrl: string
  serviceRoleKey: string
}): CourseRepository {
  return createWorkerSupabaseCourseRepositoryImpl(config)
}
