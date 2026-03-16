/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { createHash } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { createNodeDb } from '../../db/connection.js'
import type {
  CourseProgressRecord,
  CourseVersionDiffRecord,
  CourseVersionHistoryRecord,
  ExerciseAttemptStatusRecord,
  LessonProgressRecord,
  LearnerExerciseAttemptRecord,
  ModuleProgressRecord,
  EnrollmentRecord,
  PaymentRecord,
  PublicCourseRecord,
  PublisherCourseRecord,
} from './model.js'
import { seedCourseRow } from './seed.js'
import type { CourseRepository } from './repository-contract.js'

type NodeDb = NonNullable<Awaited<ReturnType<typeof createNodeDb>>>

type DbCourseIdentity = {
  id: string
  owner_id: string
  slug: string
  price_cents: number | null
  currency: string
  stripe_price_id: string | null
}

type DbCourseVersion = {
  id: string
  course_id: string
  version: number
  status: 'draft' | 'published' | 'archived'
  title: string
  description: string
  content: unknown
  change_note: string | null
  created_at: string | Date
  created_by: string
  published_at: string | Date | null
  archived_at: string | Date | null
}

type PublisherJoinedRow = {
  course_id: string
  slug: string
  owner_id: string
  price_cents: number | null
  currency: string
  stripe_price_id: string | null
  version_id: string
  version: number
  status: 'draft' | 'published' | 'archived'
  title: string
  description: string
  content: unknown
  change_note: string | null
  created_at: string | Date
  created_by: string
  published_at: string | Date | null
  archived_at: string | Date | null
}

type PublicJoinedRow = {
  id: string
  slug: string
  title: string
  description: string
  price_cents: number | null
  currency: string
  stripe_price_id: string | null
  owner_display_name: string | null
}

const SYSTEM_PROFILE_USER_ID = '00000000-0000-0000-0000-000000000001'
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function assertUuid(value: string, label: string) {
  if (!UUID_RE.test(value)) {
    throw new Error(`${label} must be a UUID.`)
  }
}

function toDbCourseId(value: string) {
  if (UUID_RE.test(value)) {
    return value.toLowerCase()
  }

  const raw = createHash('sha256').update(value).digest('hex').slice(0, 32)
  const chars = raw.split('')
  chars[12] = '5'
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16)
  const normalized = chars.join('')
  return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20, 32)}`
}

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

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null
  }
  if (typeof value === 'string') {
    return value
  }
  return value.toISOString()
}

function normalizeContent(value: unknown): {
  modules: PublisherCourseRecord['content']['modules']
} {
  if (typeof value === 'string') {
    try {
      return clone(JSON.parse(value))
    } catch {
      return { modules: [] }
    }
  }

  if (value && typeof value === 'object') {
    return clone(
      value as { modules: PublisherCourseRecord['content']['modules'] },
    )
  }

  return { modules: [] }
}

function mapPublisherJoinedRow(row: PublisherJoinedRow): PublisherCourseRecord {
  return {
    courseId: row.course_id,
    slug: row.slug,
    ownerId: row.owner_id,
    priceCents: row.price_cents,
    currency: row.currency,
    stripePriceId: row.stripe_price_id,
    versionId: row.version_id,
    version: row.version,
    status: row.status,
    title: row.title,
    description: row.description,
    content: normalizeContent(row.content),
    changeNote: row.change_note,
    createdAt: toIso(row.created_at) ?? nowIso(),
    createdBy: row.created_by,
    publishedAt: toIso(row.published_at),
    archivedAt: toIso(row.archived_at),
  }
}

function mapEnrollmentRow(row: {
  id: string
  course_id: string
  status: string
  enrolled_at: string | Date
}): EnrollmentRecord {
  return {
    id: row.id,
    courseId: row.course_id,
    status: row.status,
    enrolledAt: toIso(row.enrolled_at) ?? nowIso(),
  }
}

function mapPaymentRow(row: {
  id: string
  user_id: string
  course_id: string
  stripe_session_id: string
  stripe_payment_intent_id: string | null
  amount_cents: number
  currency: string
  status: string
  created_at: string | Date
}): PaymentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    stripeSessionId: row.stripe_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    createdAt: toIso(row.created_at) ?? nowIso(),
  }
}

function normalizeAttemptAnswers(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') {
    return {}
  }
  const record = value as Record<string, unknown>
  const entries = Object.entries(record).map(([key, raw]) => [
    key,
    typeof raw === 'string' ? raw : String(raw ?? ''),
  ])
  return Object.fromEntries(entries)
}

function mapLearnerAttemptRow(row: {
  id: string
  user_id: string
  course_id: string
  course_version_id: string
  lesson_id: string
  exercise_id: string
  answers: unknown
  is_correct: boolean
  attempted_at: string | Date
}): LearnerExerciseAttemptRecord {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    courseVersionId: row.course_version_id,
    lessonId: row.lesson_id,
    exerciseId: row.exercise_id,
    answers: normalizeAttemptAnswers(row.answers),
    isCorrect: Boolean(row.is_correct),
    attemptedAt: toIso(row.attempted_at) ?? nowIso(),
  }
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

async function nodeRows<T>(db: NodeDb, statement: ReturnType<typeof sql>) {
  const result = await db.execute(statement as never)
  return ((result as { rows?: T[] }).rows ?? []) as T[]
}

async function ensureNodeSeedCourse(db: NodeDb) {
  const seedCourseId = toDbCourseId(seedCourseRow.id)

  const existing = await nodeRows<{ id: string }>(
    db,
    sql`select id::text as id from public.courses where id = ${seedCourseId}::uuid limit 1`,
  )
  if (existing[0]) {
    return
  }

  await nodeRows(
    db,
    sql`
      insert into public.profiles (user_id, email, display_name)
      values (
        ${SYSTEM_PROFILE_USER_ID}::uuid,
        'system-migration@local.invalid',
        'System Migration Profile'
      )
      on conflict (user_id) do nothing
    `,
  )

  const owners = await nodeRows<{ owner_id: string }>(
    db,
    sql`select id::text as owner_id from public.owners where type = 'system' order by created_at asc limit 1`,
  )
  const ownerId = owners[0]?.owner_id
  if (!ownerId) {
    throw new Error('System owner is missing. Cannot bootstrap seed course.')
  }

  const slugBase = `${slugify(seedCourseRow.title)}-seed`
  let slug = slugBase
  let suffix = 1
  let slugAvailable = false
  while (!slugAvailable) {
    const taken = await nodeRows<{ id: string }>(
      db,
      sql`select id::text as id from public.courses where slug = ${slug} limit 1`,
    )
    if (!taken[0]) {
      slugAvailable = true
      continue
    }
    slug = `${slugBase}-${suffix++}`
  }

  const versionId = crypto.randomUUID()

  await nodeRows(
    db,
    sql`
      insert into public.courses (
        id,
        owner_id,
        slug,
        price_cents,
        currency,
        stripe_price_id
      ) values (
        ${seedCourseId}::uuid,
        ${ownerId}::uuid,
        ${slug},
        null,
        'eur',
        null
      )
    `,
  )

  await nodeRows(
    db,
    sql`
      insert into public.course_versions (
        id,
        course_id,
        version,
        status,
        title,
        description,
        content,
        change_note,
        created_by,
        published_at,
        archived_at
      ) values (
        ${versionId}::uuid,
        ${seedCourseId}::uuid,
        1,
        'published',
        ${seedCourseRow.title},
        ${seedCourseRow.description},
        ${JSON.stringify(seedCourseRow.content)}::jsonb,
        'Initial migrated published version',
        ${SYSTEM_PROFILE_USER_ID}::uuid,
        timezone('utc', now()),
        null
      )
    `,
  )

  await nodeRows(
    db,
    sql`
      insert into public.course_publications (course_id, published_version_id, published_at)
      values (
        ${seedCourseId}::uuid,
        ${versionId}::uuid,
        timezone('utc', now())
      )
      on conflict (course_id)
      do update set
        published_version_id = excluded.published_version_id,
        published_at = excluded.published_at
    `,
  )
}

export function createNodePostgresCourseRepository(
  db: NodeDb,
): CourseRepository {
  let seedReady: Promise<void> | null = null

  function ensureSeed() {
    if (!seedReady) {
      seedReady = ensureNodeSeedCourse(db)
    }
    return seedReady
  }

  async function provisionPersonalOwner(args: {
    userId: string
    email: string | null
  }) {
    assertUuid(args.userId, 'userId')

    const rows = await nodeRows<{ owner_id: string }>(
      db,
      sql`select public.provision_personal_owner(${args.userId}::uuid, ${args.email})::text as owner_id`,
    )
    const ownerId = rows[0]?.owner_id
    if (!ownerId) {
      throw new Error('Failed to provision personal owner.')
    }
    return { ownerId }
  }

  async function ensureOwnedCourse(args: {
    userId: string
    email: string | null
    courseId: string
  }): Promise<DbCourseIdentity> {
    const dbCourseId = toDbCourseId(args.courseId)

    const { ownerId } = await provisionPersonalOwner(args)
    const rows = await nodeRows<DbCourseIdentity>(
      db,
      sql`
        select
          id::text as id,
          owner_id::text as owner_id,
          slug,
          price_cents,
          currency,
          stripe_price_id
        from public.courses
        where id = ${dbCourseId}::uuid
          and owner_id = ${ownerId}::uuid
        limit 1
      `,
    )
    const course = rows[0]
    if (!course) {
      throw new Error('Course is not editable by current publisher.')
    }
    return course
  }

  async function latestDraftForCourse(courseId: string) {
    const rows = await nodeRows<DbCourseVersion>(
      db,
      sql`
        select
          id::text as id,
          course_id::text as course_id,
          version,
          status,
          title,
          description,
          content,
          change_note,
          created_at,
          created_by::text as created_by,
          published_at,
          archived_at
        from public.course_versions
        where course_id = ${courseId}::uuid
          and status = 'draft'
        order by version desc
        limit 1
      `,
    )
    return rows[0] ?? null
  }

  async function publishedForCourse(courseId: string) {
    const rows = await nodeRows<DbCourseVersion>(
      db,
      sql`
        select
          v.id::text as id,
          v.course_id::text as course_id,
          v.version,
          v.status,
          v.title,
          v.description,
          v.content,
          v.change_note,
          v.created_at,
          v.created_by::text as created_by,
          v.published_at,
          v.archived_at
        from public.course_publications cp
        join public.course_versions v on v.id = cp.published_version_id
        where cp.course_id = ${courseId}::uuid
        limit 1
      `,
    )
    return rows[0] ?? null
  }

  async function nextVersionNumber(courseId: string) {
    const rows = await nodeRows<{ next_version: number }>(
      db,
      sql`
        select coalesce(max(version), 0) + 1 as next_version
        from public.course_versions
        where course_id = ${courseId}::uuid
      `,
    )
    return rows[0]?.next_version ?? 1
  }

  async function uniqueSlug(title: string) {
    const slugBase = slugify(title)
    let slug = slugBase
    let suffix = 1

    let slugExists = true
    while (slugExists) {
      const rows = await nodeRows<{ id: string }>(
        db,
        sql`select id::text as id from public.courses where slug = ${slug} limit 1`,
      )
      if (!rows[0]) {
        slugExists = false
        continue
      }
      slug = `${slugBase}-${suffix++}`
    }

    return slug
  }

  return {
    provisionPersonalOwner,

    async listPublicCourses() {
      await ensureSeed()
      const rows = await nodeRows<PublicJoinedRow>(
        db,
        sql`
          select
            c.id::text as id,
            c.slug,
            v.title,
            v.description,
            c.price_cents,
            c.currency,
            c.stripe_price_id,
            p.display_name as owner_display_name
          from public.courses c
          join public.course_publications cp on cp.course_id = c.id
          join public.course_versions v on v.id = cp.published_version_id
          left join public.owners o on o.id = c.owner_id
          left join public.profiles p on p.user_id = o.personal_user_id
          order by v.title asc
        `,
      )

      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        priceCents: row.price_cents,
        currency: row.currency,
        stripePriceId: row.stripe_price_id,
        isPaid: typeof row.price_cents === 'number' && row.price_cents > 0,
        ownerDisplayName: row.owner_display_name ?? undefined,
      }))
    },

    async getPublicCourseById(id) {
      const dbCourseId = toDbCourseId(id)
      await ensureSeed()

      const rows = await nodeRows<PublicJoinedRow>(
        db,
        sql`
          select
            c.id::text as id,
            c.slug,
            v.title,
            v.description,
            c.price_cents,
            c.currency,
            c.stripe_price_id,
            p.display_name as owner_display_name
          from public.courses c
          join public.course_publications cp on cp.course_id = c.id
          join public.course_versions v on v.id = cp.published_version_id
          left join public.owners o on o.id = c.owner_id
          left join public.profiles p on p.user_id = o.personal_user_id
          where c.id = ${dbCourseId}::uuid
          limit 1
        `,
      )

      const row = rows[0]
      if (!row) {
        return null
      }
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        priceCents: row.price_cents,
        currency: row.currency,
        stripePriceId: row.stripe_price_id,
        isPaid: typeof row.price_cents === 'number' && row.price_cents > 0,
        ownerDisplayName: row.owner_display_name ?? undefined,
      }
    },

    async getPublicCourseBySlug(slug) {
      await ensureSeed()

      const rows = await nodeRows<PublicJoinedRow>(
        db,
        sql`
          select
            c.id::text as id,
            c.slug,
            v.title,
            v.description,
            c.price_cents,
            c.currency,
            c.stripe_price_id,
            p.display_name as owner_display_name
          from public.courses c
          join public.course_publications cp on cp.course_id = c.id
          join public.course_versions v on v.id = cp.published_version_id
          left join public.owners o on o.id = c.owner_id
          left join public.profiles p on p.user_id = o.personal_user_id
          where c.slug = ${slug}
          limit 1
        `,
      )

      const row = rows[0]
      if (!row) {
        return null
      }

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        priceCents: row.price_cents,
        currency: row.currency,
        stripePriceId: row.stripe_price_id,
        isPaid: typeof row.price_cents === 'number' && row.price_cents > 0,
        ownerDisplayName: row.owner_display_name ?? undefined,
      }
    },

    async getEnrollmentForUserCourse({ userId, courseId }) {
      assertUuid(userId, 'userId')
      const dbCourseId = toDbCourseId(courseId)

      const rows = await nodeRows<{
        id: string
        course_id: string
        status: string
        enrolled_at: string | Date
      }>(
        db,
        sql`
          select
            id::text as id,
            course_id::text as course_id,
            status,
            enrolled_at
          from public.enrollments
          where user_id = ${userId}::uuid
            and course_id = ${dbCourseId}::uuid
          limit 1
        `,
      )
      const row = rows[0]
      return row ? mapEnrollmentRow(row) : null
    },

    async enrollInCourse({ userId, courseId }) {
      assertUuid(userId, 'userId')
      const dbCourseId = toDbCourseId(courseId)

      await ensureSeed()

      const publication = await nodeRows<{ course_id: string }>(
        db,
        sql`
          select course_id::text as course_id
          from public.course_publications
          where course_id = ${dbCourseId}::uuid
          limit 1
        `,
      )
      if (!publication[0]) {
        throw new Error('Course is not published.')
      }

      const rows = await nodeRows<{
        id: string
        course_id: string
        status: string
        enrolled_at: string | Date
      }>(
        db,
        sql`
          insert into public.enrollments (
            id,
            user_id,
            course_id,
            status
          ) values (
            gen_random_uuid(),
            ${userId}::uuid,
            ${dbCourseId}::uuid,
            'active'
          )
          on conflict (user_id, course_id)
          do update set status = public.enrollments.status
          returning
            id::text as id,
            course_id::text as course_id,
            status,
            enrolled_at
        `,
      )

      return mapEnrollmentRow(rows[0])
    },

    async listMyPayments({ userId }) {
      assertUuid(userId, 'userId')

      const rows = await nodeRows<{
        id: string
        user_id: string
        course_id: string
        stripe_session_id: string
        stripe_payment_intent_id: string | null
        amount_cents: number
        currency: string
        status: string
        created_at: string | Date
      }>(
        db,
        sql`
          select
            id::text as id,
            user_id::text as user_id,
            course_id::text as course_id,
            stripe_session_id,
            stripe_payment_intent_id,
            amount_cents,
            currency,
            status,
            created_at
          from public.payments
          where user_id = ${userId}::uuid
          order by created_at desc
        `,
      )

      return rows.map((row) => mapPaymentRow(row))
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
      assertUuid(userId, 'userId')
      const dbCourseId = toDbCourseId(courseId)

      const inserted = await nodeRows<{
        id: string
        user_id: string
        course_id: string
        stripe_session_id: string
        stripe_payment_intent_id: string | null
        amount_cents: number
        currency: string
        status: string
        created_at: string | Date
      }>(
        db,
        sql`
          insert into public.payments (
            id,
            user_id,
            course_id,
            stripe_session_id,
            stripe_payment_intent_id,
            amount_cents,
            currency,
            status
          ) values (
            gen_random_uuid(),
            ${userId}::uuid,
            ${dbCourseId}::uuid,
            ${stripeSessionId},
            ${stripePaymentIntentId},
            ${amountCents},
            ${currency},
            ${status}
          )
          on conflict (stripe_session_id) do nothing
          returning
            id::text as id,
            user_id::text as user_id,
            course_id::text as course_id,
            stripe_session_id,
            stripe_payment_intent_id,
            amount_cents,
            currency,
            status,
            created_at
        `,
      )

      const row =
        inserted[0] ??
        (
          await nodeRows<{
            id: string
            user_id: string
            course_id: string
            stripe_session_id: string
            stripe_payment_intent_id: string | null
            amount_cents: number
            currency: string
            status: string
            created_at: string | Date
          }>(
            db,
            sql`
              select
                id::text as id,
                user_id::text as user_id,
                course_id::text as course_id,
                stripe_session_id,
                stripe_payment_intent_id,
                amount_cents,
                currency,
                status,
                created_at
              from public.payments
              where stripe_session_id = ${stripeSessionId}
              limit 1
            `,
          )
        )[0]

      if (!row) {
        throw new Error('Failed to persist Stripe payment.')
      }

      return mapPaymentRow(row)
    },

    async ensureEnrollmentForPaidCourse({ userId, courseId }) {
      return this.enrollInCourse({ userId, courseId })
    },

    async listMyCourses({ userId }) {
      assertUuid(userId, 'userId')

      const rows = await nodeRows<{
        id: string
        slug: string
        title: string
        description: string
        version: number
        status: string
        enrolled_at: string | Date
      }>(
        db,
        sql`
          select
            c.id::text as id,
            c.slug,
            v.title,
            v.description,
            v.version,
            e.status,
            e.enrolled_at
          from public.enrollments e
          join public.courses c on c.id = e.course_id
          join public.course_publications cp on cp.course_id = c.id
          join public.course_versions v on v.id = cp.published_version_id
          where e.user_id = ${userId}::uuid
          order by e.enrolled_at desc
        `,
      )

      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        version: row.version,
        status: row.status,
        enrolledAt: toIso(row.enrolled_at) ?? nowIso(),
      }))
    },

    async listLearnerCourses({ userId }) {
      assertUuid(userId, 'userId')

      const rows = await nodeRows<PublisherJoinedRow>(
        db,
        sql`
          select
            c.id::text as course_id,
            c.slug,
            c.owner_id::text as owner_id,
            c.price_cents,
            c.currency,
            c.stripe_price_id,
            v.id::text as version_id,
            v.version,
            v.status,
            v.title,
            v.description,
            v.content,
            v.change_note,
            v.created_at,
            v.created_by::text as created_by,
            v.published_at,
            v.archived_at
          from public.enrollments e
          join public.courses c on c.id = e.course_id
          join public.course_publications cp on cp.course_id = c.id
          join public.course_versions v on v.id = cp.published_version_id
          where e.user_id = ${userId}::uuid
          order by e.enrolled_at desc
        `,
      )

      return rows.map((row) => mapPublisherJoinedRow(row))
    },

    async getLearnerCourseById({ id }) {
      const dbCourseId = toDbCourseId(id)

      const rows = await nodeRows<PublisherJoinedRow>(
        db,
        sql`
          select
            c.id::text as course_id,
            c.slug,
            c.owner_id::text as owner_id,
            c.price_cents,
            c.currency,
            c.stripe_price_id,
            v.id::text as version_id,
            v.version,
            v.status,
            v.title,
            v.description,
            v.content,
            v.change_note,
            v.created_at,
            v.created_by::text as created_by,
            v.published_at,
            v.archived_at
          from public.courses c
          join public.course_publications cp on cp.course_id = c.id
          join public.course_versions v on v.id = cp.published_version_id
          where c.id = ${dbCourseId}::uuid
          limit 1
        `,
      )
      const row = rows[0]
      return row ? mapPublisherJoinedRow(row) : null
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
      assertUuid(userId, 'userId')
      assertUuid(courseVersionId, 'courseVersionId')
      const dbCourseId = toDbCourseId(courseId)

      const rows = await nodeRows<{
        id: string
        user_id: string
        course_id: string
        course_version_id: string
        lesson_id: string
        exercise_id: string
        answers: unknown
        is_correct: boolean
        attempted_at: string | Date
      }>(
        db,
        sql`
          insert into public.learner_exercise_attempts (
            id,
            user_id,
            course_id,
            course_version_id,
            lesson_id,
            exercise_id,
            answers,
            is_correct,
            attempted_at
          ) values (
            gen_random_uuid(),
            ${userId}::uuid,
            ${dbCourseId}::uuid,
            ${courseVersionId}::uuid,
            ${lessonId},
            ${exerciseId},
            ${JSON.stringify(answers)}::jsonb,
            ${isCorrect},
            timezone('utc', now())
          )
          on conflict (user_id, course_id, course_version_id, lesson_id, exercise_id)
          do update set
            answers = excluded.answers,
            is_correct = excluded.is_correct,
            attempted_at = timezone('utc', now())
          returning
            id::text as id,
            user_id::text as user_id,
            course_id::text as course_id,
            course_version_id::text as course_version_id,
            lesson_id,
            exercise_id,
            answers,
            is_correct,
            attempted_at
        `,
      )

      return mapLearnerAttemptRow(rows[0])
    },

    async getLearnerCourseProgress({ userId, courseId }) {
      assertUuid(userId, 'userId')
      const dbCourseId = toDbCourseId(courseId)

      const courseRows = await nodeRows<PublisherJoinedRow>(
        db,
        sql`
          select
            c.id::text as course_id,
            c.slug,
            c.owner_id::text as owner_id,
            c.price_cents,
            c.currency,
            c.stripe_price_id,
            v.id::text as version_id,
            v.version,
            v.status,
            v.title,
            v.description,
            v.content,
            v.change_note,
            v.created_at,
            v.created_by::text as created_by,
            v.published_at,
            v.archived_at
          from public.courses c
          join public.course_publications cp on cp.course_id = c.id
          join public.course_versions v on v.id = cp.published_version_id
          where c.id = ${dbCourseId}::uuid
          limit 1
        `,
      )
      const courseRow = courseRows[0]
      if (!courseRow) {
        return null
      }

      const attempts = await nodeRows<{
        id: string
        user_id: string
        course_id: string
        course_version_id: string
        lesson_id: string
        exercise_id: string
        answers: unknown
        is_correct: boolean
        attempted_at: string | Date
      }>(
        db,
        sql`
          select
            id::text as id,
            user_id::text as user_id,
            course_id::text as course_id,
            course_version_id::text as course_version_id,
            lesson_id,
            exercise_id,
            answers,
            is_correct,
            attempted_at
          from public.learner_exercise_attempts
          where user_id = ${userId}::uuid
            and course_id = ${dbCourseId}::uuid
            and course_version_id = ${courseRow.version_id}::uuid
        `,
      )

      return buildCourseProgressFromContent({
        courseId: courseRow.course_id,
        courseVersionId: courseRow.version_id,
        content: normalizeContent(courseRow.content),
        attempts: attempts.map((row) => mapLearnerAttemptRow(row)),
      })
    },

    async listPublisherCourses({ userId, email }) {
      const { ownerId } = await provisionPersonalOwner({ userId, email })

      const rows = await nodeRows<PublisherJoinedRow>(
        db,
        sql`
          with owner_courses as (
            select c.*
            from public.courses c
            where c.owner_id = ${ownerId}::uuid
          ),
          latest_drafts as (
            select distinct on (cv.course_id)
              cv.course_id,
              cv.id as draft_id
            from public.course_versions cv
            join owner_courses oc on oc.id = cv.course_id
            where cv.status = 'draft'
            order by cv.course_id, cv.version desc
          )
          select
            c.id::text as course_id,
            c.slug,
            c.owner_id::text as owner_id,
            c.price_cents,
            c.currency,
            c.stripe_price_id,
            v.id::text as version_id,
            v.version,
            v.status,
            v.title,
            v.description,
            v.content,
            v.change_note,
            v.created_at,
            v.created_by::text as created_by,
            v.published_at,
            v.archived_at
          from owner_courses c
          left join latest_drafts d on d.course_id = c.id
          left join public.course_publications cp on cp.course_id = c.id
          join public.course_versions v on v.id = coalesce(d.draft_id, cp.published_version_id)
          order by v.version desc
        `,
      )

      return rows.map((row) => mapPublisherJoinedRow(row))
    },

    async getPublisherCourseById({ userId, email, id }) {
      const dbCourseId = toDbCourseId(id)
      const { ownerId } = await provisionPersonalOwner({ userId, email })

      const rows = await nodeRows<PublisherJoinedRow>(
        db,
        sql`
          with selected_course as (
            select *
            from public.courses
            where id = ${dbCourseId}::uuid
              and owner_id = ${ownerId}::uuid
            limit 1
          ),
          latest_draft as (
            select
              cv.id as draft_id
            from public.course_versions cv
            join selected_course sc on sc.id = cv.course_id
            where cv.status = 'draft'
            order by cv.version desc
            limit 1
          )
          select
            c.id::text as course_id,
            c.slug,
            c.owner_id::text as owner_id,
            c.price_cents,
            c.currency,
            c.stripe_price_id,
            v.id::text as version_id,
            v.version,
            v.status,
            v.title,
            v.description,
            v.content,
            v.change_note,
            v.created_at,
            v.created_by::text as created_by,
            v.published_at,
            v.archived_at
          from selected_course c
          left join latest_draft d on true
          left join public.course_publications cp on cp.course_id = c.id
          join public.course_versions v on v.id = coalesce(d.draft_id, cp.published_version_id)
          limit 1
        `,
      )

      const row = rows[0]
      return row ? mapPublisherJoinedRow(row) : null
    },

    async upsertPublisherCourse({ userId, email, row }) {
      assertUuid(userId, 'userId')
      const dbCourseId = toDbCourseId(row.id)

      const { ownerId } = await provisionPersonalOwner({ userId, email })
      const existing = await nodeRows<DbCourseIdentity>(
        db,
        sql`
          select
            id::text as id,
            owner_id::text as owner_id,
            slug,
            price_cents,
            currency,
            stripe_price_id
          from public.courses
          where id = ${dbCourseId}::uuid
          limit 1
        `,
      )

      if (!existing[0]) {
        const slug = await uniqueSlug(row.title)
        await nodeRows(
          db,
          sql`
            insert into public.courses (
              id,
              owner_id,
              slug,
              price_cents,
              currency,
              stripe_price_id
            ) values (
              ${dbCourseId}::uuid,
              ${ownerId}::uuid,
              ${slug},
              ${row.priceCents},
              ${row.currency},
              ${row.stripePriceId}
            )
          `,
        )

        const createdDraft = await nodeRows<PublisherJoinedRow>(
          db,
          sql`
            insert into public.course_versions (
              id,
              course_id,
              version,
              status,
              title,
              description,
              content,
              change_note,
              created_by,
              published_at,
              archived_at
            ) values (
              gen_random_uuid(),
              ${dbCourseId}::uuid,
              1,
              'draft',
              ${row.title},
              ${row.description},
              ${JSON.stringify(row.content)}::jsonb,
              null,
              ${userId}::uuid,
              null,
              null
            )
            returning
              ${dbCourseId}::text as course_id,
              ${slug} as slug,
              ${ownerId}::text as owner_id,
              ${row.priceCents}::int as price_cents,
              ${row.currency} as currency,
              ${row.stripePriceId} as stripe_price_id,
              id::text as version_id,
              version,
              status,
              title,
              description,
              content,
              change_note,
              created_at,
              created_by::text as created_by,
              published_at,
              archived_at
          `,
        )

        return mapPublisherJoinedRow(createdDraft[0])
      }

      const course = existing[0]
      if (course.owner_id !== ownerId) {
        throw new Error('Course is not editable by current publisher.')
      }

      await nodeRows(
        db,
        sql`
          update public.courses
          set
            price_cents = ${row.priceCents},
            currency = ${row.currency},
            stripe_price_id = ${row.stripePriceId},
            updated_at = timezone('utc', now())
          where id = ${dbCourseId}::uuid
        `,
      )

      const draft = await latestDraftForCourse(dbCourseId)
      if (draft) {
        const updated = await nodeRows<PublisherJoinedRow>(
          db,
          sql`
            update public.course_versions
            set
              title = ${row.title},
              description = ${row.description},
              content = ${JSON.stringify(row.content)}::jsonb
            where id = ${draft.id}::uuid
            returning
              ${dbCourseId}::text as course_id,
              ${course.slug} as slug,
              ${course.owner_id}::text as owner_id,
              ${row.priceCents}::int as price_cents,
              ${row.currency} as currency,
              ${row.stripePriceId} as stripe_price_id,
              id::text as version_id,
              version,
              status,
              title,
              description,
              content,
              change_note,
              created_at,
              created_by::text as created_by,
              published_at,
              archived_at
          `,
        )
        return mapPublisherJoinedRow(updated[0])
      }

      const nextVersion = await nextVersionNumber(dbCourseId)
      const inserted = await nodeRows<PublisherJoinedRow>(
        db,
        sql`
          insert into public.course_versions (
            id,
            course_id,
            version,
            status,
            title,
            description,
            content,
            change_note,
            created_by,
            published_at,
            archived_at
          ) values (
            gen_random_uuid(),
            ${dbCourseId}::uuid,
            ${nextVersion},
            'draft',
            ${row.title},
            ${row.description},
            ${JSON.stringify(row.content)}::jsonb,
            null,
            ${userId}::uuid,
            null,
            null
          )
          returning
            ${dbCourseId}::text as course_id,
            ${course.slug} as slug,
            ${course.owner_id}::text as owner_id,
            ${row.priceCents}::int as price_cents,
            ${row.currency} as currency,
            ${row.stripePriceId} as stripe_price_id,
            id::text as version_id,
            version,
            status,
            title,
            description,
            content,
            change_note,
            created_at,
            created_by::text as created_by,
            published_at,
            archived_at
        `,
      )

      return mapPublisherJoinedRow(inserted[0])
    },

    async seedPublisherSampleCourse({ userId, email, row }) {
      return this.upsertPublisherCourse({ userId, email, row })
    },

    async createDraftFromPublished({ userId, email, courseId }) {
      assertUuid(userId, 'userId')
      const course = await ensureOwnedCourse({ userId, email, courseId })

      const existingDraft = await latestDraftForCourse(course.id)
      if (existingDraft) {
        return mapPublisherJoinedRow({
          course_id: course.id,
          slug: course.slug,
          owner_id: course.owner_id,
          price_cents: course.price_cents,
          currency: course.currency,
          stripe_price_id: course.stripe_price_id,
          version_id: existingDraft.id,
          version: existingDraft.version,
          status: existingDraft.status,
          title: existingDraft.title,
          description: existingDraft.description,
          content: existingDraft.content,
          change_note: existingDraft.change_note,
          created_at: existingDraft.created_at,
          created_by: existingDraft.created_by,
          published_at: existingDraft.published_at,
          archived_at: existingDraft.archived_at,
        })
      }

      const published = await publishedForCourse(course.id)
      if (!published) {
        throw new Error('No published version exists for this course.')
      }

      const nextVersion = await nextVersionNumber(course.id)
      const rows = await nodeRows<PublisherJoinedRow>(
        db,
        sql`
          insert into public.course_versions (
            id,
            course_id,
            version,
            status,
            title,
            description,
            content,
            change_note,
            created_by,
            published_at,
            archived_at
          ) values (
            gen_random_uuid(),
            ${course.id}::uuid,
            ${nextVersion},
            'draft',
            ${published.title},
            ${published.description},
            ${JSON.stringify(normalizeContent(published.content))}::jsonb,
            null,
            ${userId}::uuid,
            null,
            null
          )
          returning
            ${course.id}::text as course_id,
            ${course.slug} as slug,
            ${course.owner_id}::text as owner_id,
            ${course.price_cents}::int as price_cents,
            ${course.currency} as currency,
            ${course.stripe_price_id} as stripe_price_id,
            id::text as version_id,
            version,
            status,
            title,
            description,
            content,
            change_note,
            created_at,
            created_by::text as created_by,
            published_at,
            archived_at
        `,
      )

      return mapPublisherJoinedRow(rows[0])
    },

    async publishCourseDraft({ userId, email, courseId, changeNote }) {
      assertUuid(userId, 'userId')
      const course = await ensureOwnedCourse({ userId, email, courseId })

      const draft = await latestDraftForCourse(course.id)
      if (!draft) {
        throw new Error('No draft version available to publish.')
      }

      const previousPublication = await nodeRows<{
        published_version_id: string
      }>(
        db,
        sql`
          select published_version_id::text as published_version_id
          from public.course_publications
          where course_id = ${course.id}::uuid
          limit 1
        `,
      )

      if (previousPublication[0]?.published_version_id) {
        await nodeRows(
          db,
          sql`
            update public.course_versions
            set
              status = 'archived',
              archived_at = timezone('utc', now())
            where id = ${previousPublication[0].published_version_id}::uuid
          `,
        )
      }

      const publishedRows = await nodeRows<PublisherJoinedRow>(
        db,
        sql`
          update public.course_versions
          set
            status = 'published',
            change_note = coalesce(${changeNote}, change_note),
            published_at = timezone('utc', now()),
            archived_at = null
          where id = ${draft.id}::uuid
          returning
            ${course.id}::text as course_id,
            ${course.slug} as slug,
            ${course.owner_id}::text as owner_id,
            ${course.price_cents}::int as price_cents,
            ${course.currency} as currency,
            ${course.stripe_price_id} as stripe_price_id,
            id::text as version_id,
            version,
            status,
            title,
            description,
            content,
            change_note,
            created_at,
            created_by::text as created_by,
            published_at,
            archived_at
        `,
      )
      const published = publishedRows[0]

      await nodeRows(
        db,
        sql`
          insert into public.course_publications (
            course_id,
            published_version_id,
            published_at
          ) values (
            ${course.id}::uuid,
            ${published.version_id}::uuid,
            timezone('utc', now())
          )
          on conflict (course_id)
          do update set
            published_version_id = excluded.published_version_id,
            published_at = excluded.published_at
        `,
      )

      return mapPublisherJoinedRow(published)
    },

    async restoreVersionAsDraft({ userId, email, courseId, versionId }) {
      assertUuid(userId, 'userId')
      assertUuid(versionId, 'versionId')
      const course = await ensureOwnedCourse({ userId, email, courseId })

      const sourceRows = await nodeRows<DbCourseVersion>(
        db,
        sql`
          select
            id::text as id,
            course_id::text as course_id,
            version,
            status,
            title,
            description,
            content,
            change_note,
            created_at,
            created_by::text as created_by,
            published_at,
            archived_at
          from public.course_versions
          where id = ${versionId}::uuid
            and course_id = ${course.id}::uuid
          limit 1
        `,
      )
      const source = sourceRows[0]
      if (!source) {
        throw new Error('Version not found for this course.')
      }

      const nextVersion = await nextVersionNumber(course.id)
      const rows = await nodeRows<PublisherJoinedRow>(
        db,
        sql`
          insert into public.course_versions (
            id,
            course_id,
            version,
            status,
            title,
            description,
            content,
            change_note,
            created_by,
            published_at,
            archived_at
          ) values (
            gen_random_uuid(),
            ${course.id}::uuid,
            ${nextVersion},
            'draft',
            ${source.title},
            ${source.description},
            ${JSON.stringify(normalizeContent(source.content))}::jsonb,
            ${`Restored from v${source.version}`},
            ${userId}::uuid,
            null,
            null
          )
          returning
            ${course.id}::text as course_id,
            ${course.slug} as slug,
            ${course.owner_id}::text as owner_id,
            ${course.price_cents}::int as price_cents,
            ${course.currency} as currency,
            ${course.stripe_price_id} as stripe_price_id,
            id::text as version_id,
            version,
            status,
            title,
            description,
            content,
            change_note,
            created_at,
            created_by::text as created_by,
            published_at,
            archived_at
        `,
      )

      return mapPublisherJoinedRow(rows[0])
    },

    async listCourseVersionHistory({ userId, email, courseId }) {
      const course = await ensureOwnedCourse({ userId, email, courseId })

      const rows = await nodeRows<DbCourseVersion>(
        db,
        sql`
          select
            id::text as id,
            course_id::text as course_id,
            version,
            status,
            title,
            description,
            content,
            change_note,
            created_at,
            created_by::text as created_by,
            published_at,
            archived_at
          from public.course_versions
          where course_id = ${course.id}::uuid
          order by version desc
        `,
      )

      return rows.map(
        (row): CourseVersionHistoryRecord => ({
          versionId: row.id,
          version: row.version,
          status: row.status,
          title: row.title,
          changeNote: row.change_note,
          createdAt: toIso(row.created_at) ?? nowIso(),
          createdBy: row.created_by,
          publishedAt: toIso(row.published_at),
          archivedAt: toIso(row.archived_at),
        }),
      )
    },

    async diffCourseVersions({
      userId,
      email,
      courseId,
      fromVersionId,
      toVersionId,
    }) {
      assertUuid(fromVersionId, 'fromVersionId')
      assertUuid(toVersionId, 'toVersionId')
      const course = await ensureOwnedCourse({ userId, email, courseId })

      const fromRows = await nodeRows<DbCourseVersion>(
        db,
        sql`
          select
            id::text as id,
            course_id::text as course_id,
            version,
            status,
            title,
            description,
            content,
            change_note,
            created_at,
            created_by::text as created_by,
            published_at,
            archived_at
          from public.course_versions
          where id = ${fromVersionId}::uuid
            and course_id = ${course.id}::uuid
          limit 1
        `,
      )
      const toRows = await nodeRows<DbCourseVersion>(
        db,
        sql`
          select
            id::text as id,
            course_id::text as course_id,
            version,
            status,
            title,
            description,
            content,
            change_note,
            created_at,
            created_by::text as created_by,
            published_at,
            archived_at
          from public.course_versions
          where id = ${toVersionId}::uuid
            and course_id = ${course.id}::uuid
          limit 1
        `,
      )

      const from = fromRows[0]
      const to = toRows[0]
      if (!from || !to) {
        throw new Error('Versions not found for this course.')
      }

      const fromFlat = flattenJson(normalizeContent(from.content))
      const toFlat = flattenJson(normalizeContent(to.content))
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

      const result: CourseVersionDiffRecord = {
        courseId: course.id,
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
      return result
    },
  }
}

async function must<T>(
  query: PromiseLike<{ data: T; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function ensureWorkerSeedCourse(client: SupabaseClient) {
  const seedCourseId = toDbCourseId(seedCourseRow.id)

  const existing = await must(
    client.from('courses').select('id').eq('id', seedCourseId).maybeSingle(),
  )
  if (existing?.id) {
    return
  }

  await must(
    client
      .from('profiles')
      .upsert(
        {
          user_id: SYSTEM_PROFILE_USER_ID,
          email: 'system-migration@local.invalid',
          display_name: 'System Migration Profile',
        },
        { onConflict: 'user_id' },
      )
      .select('user_id')
      .maybeSingle(),
  )

  const owner = await must(
    client
      .from('owners')
      .select('id')
      .eq('type', 'system')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  )
  if (!owner?.id) {
    throw new Error('System owner is missing. Cannot bootstrap seed course.')
  }

  const slugBase = `${slugify(seedCourseRow.title)}-seed`
  let slug = slugBase
  let suffix = 1
  let slugAvailable = false
  while (!slugAvailable) {
    const row = await must(
      client.from('courses').select('id').eq('slug', slug).maybeSingle(),
    )
    if (!row?.id) {
      slugAvailable = true
      continue
    }
    slug = `${slugBase}-${suffix++}`
  }

  await must(
    client.from('courses').insert({
      id: seedCourseId,
      owner_id: owner.id,
      slug,
      price_cents: null,
      currency: 'eur',
      stripe_price_id: null,
    }),
  )

  const versionId = crypto.randomUUID()
  await must(
    client.from('course_versions').insert({
      id: versionId,
      course_id: seedCourseId,
      version: 1,
      status: 'published',
      title: seedCourseRow.title,
      description: seedCourseRow.description,
      content: clone(seedCourseRow.content),
      change_note: 'Initial migrated published version',
      created_by: SYSTEM_PROFILE_USER_ID,
      published_at: nowIso(),
      archived_at: null,
    }),
  )

  await must(
    client.from('course_publications').upsert(
      {
        course_id: seedCourseId,
        published_version_id: versionId,
        published_at: nowIso(),
      },
      { onConflict: 'course_id' },
    ),
  )
}

function mapPublicJoinedToRecord(row: PublicJoinedRow): PublicCourseRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    priceCents: row.price_cents,
    currency: row.currency,
    stripePriceId: row.stripe_price_id,
    isPaid: typeof row.price_cents === 'number' && row.price_cents > 0,
    ownerDisplayName: row.owner_display_name ?? undefined,
  }
}

export function createWorkerSupabaseCourseRepositoryImpl(config: {
  supabaseUrl: string
  serviceRoleKey: string
}): CourseRepository {
  const client = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  let seedReady: Promise<void> | null = null
  function ensureSeed() {
    if (!seedReady) {
      seedReady = ensureWorkerSeedCourse(client)
    }
    return seedReady
  }

  async function provisionPersonalOwner(args: {
    userId: string
    email: string | null
  }) {
    assertUuid(args.userId, 'userId')
    const data = await must(
      client.rpc('provision_personal_owner', {
        p_user_id: args.userId,
        p_email: args.email,
      }),
    )
    const ownerId = String(data ?? '')
    if (!ownerId) {
      throw new Error('Failed to provision personal owner.')
    }
    return { ownerId }
  }

  async function ensureOwnedCourse(args: {
    userId: string
    email: string | null
    courseId: string
  }): Promise<DbCourseIdentity> {
    const dbCourseId = toDbCourseId(args.courseId)
    const { ownerId } = await provisionPersonalOwner(args)
    const data = await must(
      client
        .from('courses')
        .select('id, owner_id, slug, price_cents, currency, stripe_price_id')
        .eq('id', dbCourseId)
        .eq('owner_id', ownerId)
        .maybeSingle(),
    )
    if (!data) {
      throw new Error('Course is not editable by current publisher.')
    }
    return data as DbCourseIdentity
  }

  async function latestDraftForCourse(courseId: string) {
    const data = await must(
      client
        .from('course_versions')
        .select(
          'id, course_id, version, status, title, description, content, change_note, created_at, created_by, published_at, archived_at',
        )
        .eq('course_id', courseId)
        .eq('status', 'draft')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
    )
    return (data ?? null) as DbCourseVersion | null
  }

  async function publishedForCourse(courseId: string) {
    const publication = await must(
      client
        .from('course_publications')
        .select('published_version_id')
        .eq('course_id', courseId)
        .maybeSingle(),
    )
    if (!publication?.published_version_id) {
      return null
    }
    const version = await must(
      client
        .from('course_versions')
        .select(
          'id, course_id, version, status, title, description, content, change_note, created_at, created_by, published_at, archived_at',
        )
        .eq('id', publication.published_version_id)
        .maybeSingle(),
    )
    return (version ?? null) as DbCourseVersion | null
  }

  async function nextVersionNumber(courseId: string) {
    const rows = await must(
      client
        .from('course_versions')
        .select('version')
        .eq('course_id', courseId)
        .order('version', { ascending: false })
        .limit(1),
    )
    const current = rows[0]?.version ?? 0
    return current + 1
  }

  async function uniqueSlug(title: string) {
    const base = slugify(title)
    let slug = base
    let suffix = 1
    let slugExists = true
    while (slugExists) {
      const row = await must(
        client.from('courses').select('id').eq('slug', slug).maybeSingle(),
      )
      if (!row?.id) {
        slugExists = false
        continue
      }
      slug = `${base}-${suffix++}`
    }

    return slug
  }

  async function hydratePublicRows(courseRows: DbCourseIdentity[]) {
    if (courseRows.length === 0) {
      return [] as PublicJoinedRow[]
    }

    const courseIdList = courseRows.map((row) => row.id)
    const publications = await must(
      client
        .from('course_publications')
        .select('course_id, published_version_id')
        .in('course_id', courseIdList),
    )
    if (publications.length === 0) {
      return [] as PublicJoinedRow[]
    }

    const versionIds = publications
      .map((row) => row.published_version_id)
      .filter((value): value is string => typeof value === 'string')
    const versions =
      versionIds.length > 0
        ? await must(
            client
              .from('course_versions')
              .select('id, title, description')
              .in('id', versionIds),
          )
        : []

    const ownerIds = Array.from(
      new Set(
        courseRows
          .map((row) => row.owner_id)
          .filter((value): value is string => typeof value === 'string'),
      ),
    )
    const owners =
      ownerIds.length > 0
        ? await must(
            client
              .from('owners')
              .select('id, personal_user_id')
              .in('id', ownerIds),
          )
        : []
    const profileIds = owners
      .map((row) => row.personal_user_id)
      .filter((value): value is string => typeof value === 'string')
    const profiles =
      profileIds.length > 0
        ? await must(
            client
              .from('profiles')
              .select('user_id, display_name')
              .in('user_id', profileIds),
          )
        : []

    const publicationByCourse = new Map(
      publications.map((row) => [
        row.course_id as string,
        row.published_version_id as string,
      ]),
    )
    const versionById = new Map(
      versions.map((row) => [
        row.id as string,
        row as { title: string; description: string },
      ]),
    )
    const profileByUserId = new Map(
      profiles.map((row) => [
        row.user_id as string,
        row.display_name as string | null,
      ]),
    )
    const ownerById = new Map(
      owners.map((row) => [
        row.id as string,
        row.personal_user_id as string | null,
      ]),
    )

    const rows: PublicJoinedRow[] = []
    for (const course of courseRows) {
      const versionId = publicationByCourse.get(course.id)
      if (!versionId) {
        continue
      }
      const version = versionById.get(versionId)
      if (!version) {
        continue
      }

      const ownerUserId = ownerById.get(course.owner_id)
      const ownerDisplayName = ownerUserId
        ? (profileByUserId.get(ownerUserId) ?? null)
        : null

      rows.push({
        id: course.id,
        slug: course.slug,
        title: version.title,
        description: version.description,
        price_cents: course.price_cents,
        currency: course.currency,
        stripe_price_id: course.stripe_price_id,
        owner_display_name: ownerDisplayName,
      })
    }

    return rows
  }

  async function publisherSelectedVersionForCourse(
    course: DbCourseIdentity,
  ): Promise<PublisherCourseRecord | null> {
    const draft = await latestDraftForCourse(course.id)
    if (draft) {
      return mapPublisherJoinedRow({
        course_id: course.id,
        slug: course.slug,
        owner_id: course.owner_id,
        price_cents: course.price_cents,
        currency: course.currency,
        stripe_price_id: course.stripe_price_id,
        version_id: draft.id,
        version: draft.version,
        status: draft.status,
        title: draft.title,
        description: draft.description,
        content: draft.content,
        change_note: draft.change_note,
        created_at: draft.created_at,
        created_by: draft.created_by,
        published_at: draft.published_at,
        archived_at: draft.archived_at,
      })
    }

    const published = await publishedForCourse(course.id)
    if (!published) {
      return null
    }
    return mapPublisherJoinedRow({
      course_id: course.id,
      slug: course.slug,
      owner_id: course.owner_id,
      price_cents: course.price_cents,
      currency: course.currency,
      stripe_price_id: course.stripe_price_id,
      version_id: published.id,
      version: published.version,
      status: published.status,
      title: published.title,
      description: published.description,
      content: published.content,
      change_note: published.change_note,
      created_at: published.created_at,
      created_by: published.created_by,
      published_at: published.published_at,
      archived_at: published.archived_at,
    })
  }

  return {
    provisionPersonalOwner,

    async listPublicCourses() {
      await ensureSeed()
      const courseRows = await must(
        client
          .from('courses')
          .select('id, owner_id, slug, price_cents, currency, stripe_price_id'),
      )
      const rows = await hydratePublicRows(courseRows as DbCourseIdentity[])
      return rows
        .map((row) => mapPublicJoinedToRecord(row))
        .sort((a, b) => a.title.localeCompare(b.title))
    },

    async getPublicCourseById(id) {
      const dbCourseId = toDbCourseId(id)
      await ensureSeed()

      const course = await must(
        client
          .from('courses')
          .select('id, owner_id, slug, price_cents, currency, stripe_price_id')
          .eq('id', dbCourseId)
          .maybeSingle(),
      )
      if (!course) {
        return null
      }
      const rows = await hydratePublicRows([course as DbCourseIdentity])
      const row = rows[0]
      return row ? mapPublicJoinedToRecord(row) : null
    },

    async getPublicCourseBySlug(slug) {
      await ensureSeed()
      const course = await must(
        client
          .from('courses')
          .select('id, owner_id, slug, price_cents, currency, stripe_price_id')
          .eq('slug', slug)
          .maybeSingle(),
      )
      if (!course) {
        return null
      }
      const rows = await hydratePublicRows([course as DbCourseIdentity])
      const row = rows[0]
      return row ? mapPublicJoinedToRecord(row) : null
    },

    async getEnrollmentForUserCourse({ userId, courseId }) {
      assertUuid(userId, 'userId')
      const dbCourseId = toDbCourseId(courseId)

      const row = await must(
        client
          .from('enrollments')
          .select('id, course_id, status, enrolled_at')
          .eq('user_id', userId)
          .eq('course_id', dbCourseId)
          .maybeSingle(),
      )
      return row ? mapEnrollmentRow(row) : null
    },

    async enrollInCourse({ userId, courseId }) {
      assertUuid(userId, 'userId')
      const dbCourseId = toDbCourseId(courseId)

      const publication = await must(
        client
          .from('course_publications')
          .select('course_id')
          .eq('course_id', dbCourseId)
          .maybeSingle(),
      )
      if (!publication?.course_id) {
        throw new Error('Course is not published.')
      }

      const existing = await must(
        client
          .from('enrollments')
          .select('id, course_id, status, enrolled_at')
          .eq('user_id', userId)
          .eq('course_id', dbCourseId)
          .maybeSingle(),
      )
      if (existing) {
        return mapEnrollmentRow(existing)
      }

      const inserted = await must(
        client
          .from('enrollments')
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            course_id: dbCourseId,
            status: 'active',
          })
          .select('id, course_id, status, enrolled_at')
          .single(),
      )
      return mapEnrollmentRow(inserted)
    },

    async listMyPayments({ userId }) {
      assertUuid(userId, 'userId')
      const rows = await must(
        client
          .from('payments')
          .select(
            'id, user_id, course_id, stripe_session_id, stripe_payment_intent_id, amount_cents, currency, status, created_at',
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      )
      return rows.map((row) => mapPaymentRow(row))
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
      assertUuid(userId, 'userId')
      const dbCourseId = toDbCourseId(courseId)

      const existing = await must(
        client
          .from('payments')
          .select(
            'id, user_id, course_id, stripe_session_id, stripe_payment_intent_id, amount_cents, currency, status, created_at',
          )
          .eq('stripe_session_id', stripeSessionId)
          .maybeSingle(),
      )
      if (existing) {
        return mapPaymentRow(existing)
      }

      const inserted = await must(
        client
          .from('payments')
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            course_id: dbCourseId,
            stripe_session_id: stripeSessionId,
            stripe_payment_intent_id: stripePaymentIntentId,
            amount_cents: amountCents,
            currency,
            status,
          })
          .select(
            'id, user_id, course_id, stripe_session_id, stripe_payment_intent_id, amount_cents, currency, status, created_at',
          )
          .single(),
      )
      return mapPaymentRow(inserted)
    },

    async ensureEnrollmentForPaidCourse({ userId, courseId }) {
      return this.enrollInCourse({ userId, courseId })
    },

    async listMyCourses({ userId }) {
      assertUuid(userId, 'userId')
      const enrollments = await must(
        client
          .from('enrollments')
          .select('course_id, status, enrolled_at')
          .eq('user_id', userId)
          .order('enrolled_at', { ascending: false }),
      )
      if (enrollments.length === 0) {
        return []
      }

      const courseIds = enrollments.map((row) => row.course_id as string)
      const courses = await must(
        client.from('courses').select('id, slug').in('id', courseIds),
      )
      const publications = await must(
        client
          .from('course_publications')
          .select('course_id, published_version_id')
          .in('course_id', courseIds),
      )
      const versionIds = publications.map(
        (row) => row.published_version_id as string,
      )
      const versions =
        versionIds.length > 0
          ? await must(
              client
                .from('course_versions')
                .select('id, title, description, version')
                .in('id', versionIds),
            )
          : []

      const courseById = new Map(
        courses.map((row) => [row.id as string, { slug: row.slug as string }]),
      )
      const publicationByCourseId = new Map(
        publications.map((row) => [
          row.course_id as string,
          row.published_version_id as string,
        ]),
      )
      const versionById = new Map(
        versions.map((row) => [row.id as string, row]),
      )

      return enrollments
        .map((enrollment) => {
          const course = courseById.get(enrollment.course_id as string)
          const versionId = publicationByCourseId.get(
            enrollment.course_id as string,
          )
          const version = versionId ? versionById.get(versionId) : null
          if (!course || !version) {
            return null
          }

          return {
            id: enrollment.course_id as string,
            slug: course.slug,
            title: String(version.title ?? ''),
            description: String(version.description ?? ''),
            version: Number(version.version ?? 1),
            status: String(enrollment.status ?? 'active'),
            enrolledAt:
              toIso(enrollment.enrolled_at as string | Date) ?? nowIso(),
          }
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row))
    },

    async listLearnerCourses({ userId }) {
      const myCourses = await this.listMyCourses({ userId })
      if (myCourses.length === 0) {
        return []
      }

      const courseIds = myCourses.map((row) => row.id)
      const courses = await must(
        client
          .from('courses')
          .select('id, owner_id, slug, price_cents, currency, stripe_price_id')
          .in('id', courseIds),
      )
      const publications = await must(
        client
          .from('course_publications')
          .select('course_id, published_version_id')
          .in('course_id', courseIds),
      )
      const versionIds = publications.map(
        (row) => row.published_version_id as string,
      )
      const versions =
        versionIds.length > 0
          ? await must(
              client
                .from('course_versions')
                .select(
                  'id, course_id, version, status, title, description, content, change_note, created_at, created_by, published_at, archived_at',
                )
                .in('id', versionIds),
            )
          : []

      const courseById = new Map(
        (courses as DbCourseIdentity[]).map((row) => [row.id, row]),
      )
      const publicationByCourseId = new Map(
        publications.map((row) => [
          row.course_id as string,
          row.published_version_id as string,
        ]),
      )
      const versionById = new Map(
        (versions as DbCourseVersion[]).map((row) => [row.id, row]),
      )

      return courseIds
        .map((courseId) => {
          const course = courseById.get(courseId)
          const versionId = publicationByCourseId.get(courseId)
          const version = versionId ? versionById.get(versionId) : null
          if (!course || !version) {
            return null
          }

          return mapPublisherJoinedRow({
            course_id: course.id,
            slug: course.slug,
            owner_id: course.owner_id,
            price_cents: course.price_cents,
            currency: course.currency,
            stripe_price_id: course.stripe_price_id,
            version_id: version.id,
            version: version.version,
            status: version.status,
            title: version.title,
            description: version.description,
            content: version.content,
            change_note: version.change_note,
            created_at: version.created_at,
            created_by: version.created_by,
            published_at: version.published_at,
            archived_at: version.archived_at,
          })
        })
        .filter((row): row is PublisherCourseRecord => Boolean(row))
    },

    async getLearnerCourseById({ id }) {
      const dbCourseId = toDbCourseId(id)
      const course = await must(
        client
          .from('courses')
          .select('id, owner_id, slug, price_cents, currency, stripe_price_id')
          .eq('id', dbCourseId)
          .maybeSingle(),
      )
      if (!course) {
        return null
      }
      const published = await publishedForCourse(dbCourseId)
      if (!published) {
        return null
      }
      return mapPublisherJoinedRow({
        course_id: dbCourseId,
        slug: String(course.slug),
        owner_id: String(course.owner_id),
        price_cents: (course.price_cents as number | null) ?? null,
        currency: String(course.currency ?? 'eur'),
        stripe_price_id: (course.stripe_price_id as string | null) ?? null,
        version_id: published.id,
        version: published.version,
        status: published.status,
        title: published.title,
        description: published.description,
        content: published.content,
        change_note: published.change_note,
        created_at: published.created_at,
        created_by: published.created_by,
        published_at: published.published_at,
        archived_at: published.archived_at,
      })
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
      assertUuid(userId, 'userId')
      assertUuid(courseVersionId, 'courseVersionId')
      const dbCourseId = toDbCourseId(courseId)

      const existing = await must(
        client
          .from('learner_exercise_attempts')
          .select('id')
          .eq('user_id', userId)
          .eq('course_id', dbCourseId)
          .eq('course_version_id', courseVersionId)
          .eq('lesson_id', lessonId)
          .eq('exercise_id', exerciseId)
          .maybeSingle(),
      )

      const payload = {
        user_id: userId,
        course_id: dbCourseId,
        course_version_id: courseVersionId,
        lesson_id: lessonId,
        exercise_id: exerciseId,
        answers: clone(answers),
        is_correct: isCorrect,
        attempted_at: nowIso(),
      }

      const saved = existing?.id
        ? await must(
            client
              .from('learner_exercise_attempts')
              .update(payload)
              .eq('id', existing.id)
              .select(
                'id, user_id, course_id, course_version_id, lesson_id, exercise_id, answers, is_correct, attempted_at',
              )
              .single(),
          )
        : await must(
            client
              .from('learner_exercise_attempts')
              .insert({
                id: crypto.randomUUID(),
                ...payload,
              })
              .select(
                'id, user_id, course_id, course_version_id, lesson_id, exercise_id, answers, is_correct, attempted_at',
              )
              .single(),
          )

      return mapLearnerAttemptRow(saved)
    },

    async getLearnerCourseProgress({ userId, courseId }) {
      assertUuid(userId, 'userId')
      const dbCourseId = toDbCourseId(courseId)

      const course = await this.getLearnerCourseById({ userId, id: courseId })
      if (!course) {
        return null
      }

      const attempts = await must(
        client
          .from('learner_exercise_attempts')
          .select(
            'id, user_id, course_id, course_version_id, lesson_id, exercise_id, answers, is_correct, attempted_at',
          )
          .eq('user_id', userId)
          .eq('course_id', dbCourseId)
          .eq('course_version_id', course.versionId),
      )

      return buildCourseProgressFromContent({
        courseId: course.courseId,
        courseVersionId: course.versionId,
        content: normalizeContent(course.content),
        attempts: attempts.map((row) =>
          mapLearnerAttemptRow(
            row as {
              id: string
              user_id: string
              course_id: string
              course_version_id: string
              lesson_id: string
              exercise_id: string
              answers: unknown
              is_correct: boolean
              attempted_at: string | Date
            },
          ),
        ),
      })
    },

    async listPublisherCourses({ userId, email }) {
      const { ownerId } = await provisionPersonalOwner({ userId, email })
      const courses = await must(
        client
          .from('courses')
          .select('id, owner_id, slug, price_cents, currency, stripe_price_id')
          .eq('owner_id', ownerId),
      )

      const records: PublisherCourseRecord[] = []
      for (const course of courses as DbCourseIdentity[]) {
        const selected = await publisherSelectedVersionForCourse(course)
        if (selected) {
          records.push(selected)
        }
      }

      return records.sort((a, b) => b.version - a.version)
    },

    async getPublisherCourseById({ userId, email, id }) {
      const dbCourseId = toDbCourseId(id)
      const { ownerId } = await provisionPersonalOwner({ userId, email })
      const course = await must(
        client
          .from('courses')
          .select('id, owner_id, slug, price_cents, currency, stripe_price_id')
          .eq('id', dbCourseId)
          .eq('owner_id', ownerId)
          .maybeSingle(),
      )
      if (!course) {
        return null
      }
      return publisherSelectedVersionForCourse(course as DbCourseIdentity)
    },

    async upsertPublisherCourse({ userId, email, row }) {
      assertUuid(userId, 'userId')
      const dbCourseId = toDbCourseId(row.id)

      const { ownerId } = await provisionPersonalOwner({ userId, email })
      const existing = await must(
        client
          .from('courses')
          .select('id, owner_id, slug, price_cents, currency, stripe_price_id')
          .eq('id', dbCourseId)
          .maybeSingle(),
      )

      if (!existing) {
        const slug = await uniqueSlug(row.title)
        await must(
          client.from('courses').insert({
            id: dbCourseId,
            owner_id: ownerId,
            slug,
            price_cents: row.priceCents,
            currency: row.currency,
            stripe_price_id: row.stripePriceId,
          }),
        )

        const created = await must(
          client
            .from('course_versions')
            .insert({
              id: crypto.randomUUID(),
              course_id: dbCourseId,
              version: 1,
              status: 'draft',
              title: row.title,
              description: row.description,
              content: clone(row.content),
              change_note: null,
              created_by: userId,
              published_at: null,
              archived_at: null,
            })
            .select(
              'id, course_id, version, status, title, description, content, change_note, created_at, created_by, published_at, archived_at',
            )
            .single(),
        )

        return mapPublisherJoinedRow({
          course_id: dbCourseId,
          slug,
          owner_id: ownerId,
          price_cents: row.priceCents,
          currency: row.currency,
          stripe_price_id: row.stripePriceId,
          version_id: String(created.id),
          version: Number(created.version),
          status: created.status,
          title: created.title,
          description: created.description,
          content: created.content,
          change_note: created.change_note,
          created_at: created.created_at,
          created_by: created.created_by,
          published_at: created.published_at,
          archived_at: created.archived_at,
        })
      }

      const course = existing as DbCourseIdentity
      if (course.owner_id !== ownerId) {
        throw new Error('Course is not editable by current publisher.')
      }

      await must(
        client
          .from('courses')
          .update({
            price_cents: row.priceCents,
            currency: row.currency,
            stripe_price_id: row.stripePriceId,
            updated_at: nowIso(),
          })
          .eq('id', dbCourseId),
      )

      const draft = await latestDraftForCourse(dbCourseId)
      if (draft) {
        const updated = await must(
          client
            .from('course_versions')
            .update({
              title: row.title,
              description: row.description,
              content: clone(row.content),
            })
            .eq('id', draft.id)
            .select(
              'id, course_id, version, status, title, description, content, change_note, created_at, created_by, published_at, archived_at',
            )
            .single(),
        )

        return mapPublisherJoinedRow({
          course_id: dbCourseId,
          slug: course.slug,
          owner_id: course.owner_id,
          price_cents: row.priceCents,
          currency: row.currency,
          stripe_price_id: row.stripePriceId,
          version_id: String(updated.id),
          version: Number(updated.version),
          status: updated.status,
          title: updated.title,
          description: updated.description,
          content: updated.content,
          change_note: updated.change_note,
          created_at: updated.created_at,
          created_by: updated.created_by,
          published_at: updated.published_at,
          archived_at: updated.archived_at,
        })
      }

      const version = await nextVersionNumber(dbCourseId)
      const inserted = await must(
        client
          .from('course_versions')
          .insert({
            id: crypto.randomUUID(),
            course_id: dbCourseId,
            version,
            status: 'draft',
            title: row.title,
            description: row.description,
            content: clone(row.content),
            change_note: null,
            created_by: userId,
            published_at: null,
            archived_at: null,
          })
          .select(
            'id, course_id, version, status, title, description, content, change_note, created_at, created_by, published_at, archived_at',
          )
          .single(),
      )

      return mapPublisherJoinedRow({
        course_id: dbCourseId,
        slug: course.slug,
        owner_id: course.owner_id,
        price_cents: row.priceCents,
        currency: row.currency,
        stripe_price_id: row.stripePriceId,
        version_id: String(inserted.id),
        version: Number(inserted.version),
        status: inserted.status,
        title: inserted.title,
        description: inserted.description,
        content: inserted.content,
        change_note: inserted.change_note,
        created_at: inserted.created_at,
        created_by: inserted.created_by,
        published_at: inserted.published_at,
        archived_at: inserted.archived_at,
      })
    },

    async seedPublisherSampleCourse({ userId, email, row }) {
      return this.upsertPublisherCourse({ userId, email, row })
    },

    async createDraftFromPublished({ userId, email, courseId }) {
      assertUuid(userId, 'userId')
      const course = await ensureOwnedCourse({ userId, email, courseId })

      const existingDraft = await latestDraftForCourse(course.id)
      if (existingDraft) {
        return mapPublisherJoinedRow({
          course_id: course.id,
          slug: course.slug,
          owner_id: course.owner_id,
          price_cents: course.price_cents,
          currency: course.currency,
          stripe_price_id: course.stripe_price_id,
          version_id: existingDraft.id,
          version: existingDraft.version,
          status: existingDraft.status,
          title: existingDraft.title,
          description: existingDraft.description,
          content: existingDraft.content,
          change_note: existingDraft.change_note,
          created_at: existingDraft.created_at,
          created_by: existingDraft.created_by,
          published_at: existingDraft.published_at,
          archived_at: existingDraft.archived_at,
        })
      }

      const published = await publishedForCourse(course.id)
      if (!published) {
        throw new Error('No published version exists for this course.')
      }

      const version = await nextVersionNumber(course.id)
      const inserted = await must(
        client
          .from('course_versions')
          .insert({
            id: crypto.randomUUID(),
            course_id: course.id,
            version,
            status: 'draft',
            title: published.title,
            description: published.description,
            content: clone(normalizeContent(published.content)),
            change_note: null,
            created_by: userId,
            published_at: null,
            archived_at: null,
          })
          .select(
            'id, course_id, version, status, title, description, content, change_note, created_at, created_by, published_at, archived_at',
          )
          .single(),
      )

      return mapPublisherJoinedRow({
        course_id: course.id,
        slug: course.slug,
        owner_id: course.owner_id,
        price_cents: course.price_cents,
        currency: course.currency,
        stripe_price_id: course.stripe_price_id,
        version_id: String(inserted.id),
        version: Number(inserted.version),
        status: inserted.status,
        title: inserted.title,
        description: inserted.description,
        content: inserted.content,
        change_note: inserted.change_note,
        created_at: inserted.created_at,
        created_by: inserted.created_by,
        published_at: inserted.published_at,
        archived_at: inserted.archived_at,
      })
    },

    async publishCourseDraft({ userId, email, courseId, changeNote }) {
      const course = await ensureOwnedCourse({ userId, email, courseId })
      const draft = await latestDraftForCourse(course.id)
      if (!draft) {
        throw new Error('No draft version available to publish.')
      }

      const previous = await must(
        client
          .from('course_publications')
          .select('published_version_id')
          .eq('course_id', course.id)
          .maybeSingle(),
      )

      if (previous?.published_version_id) {
        await must(
          client
            .from('course_versions')
            .update({ status: 'archived', archived_at: nowIso() })
            .eq('id', previous.published_version_id),
        )
      }

      const published = await must(
        client
          .from('course_versions')
          .update({
            status: 'published',
            change_note: changeNote ?? draft.change_note ?? null,
            published_at: nowIso(),
            archived_at: null,
          })
          .eq('id', draft.id)
          .select(
            'id, course_id, version, status, title, description, content, change_note, created_at, created_by, published_at, archived_at',
          )
          .single(),
      )

      await must(
        client.from('course_publications').upsert(
          {
            course_id: course.id,
            published_version_id: published.id,
            published_at: nowIso(),
          },
          { onConflict: 'course_id' },
        ),
      )

      return mapPublisherJoinedRow({
        course_id: course.id,
        slug: course.slug,
        owner_id: course.owner_id,
        price_cents: course.price_cents,
        currency: course.currency,
        stripe_price_id: course.stripe_price_id,
        version_id: String(published.id),
        version: Number(published.version),
        status: published.status,
        title: published.title,
        description: published.description,
        content: published.content,
        change_note: published.change_note,
        created_at: published.created_at,
        created_by: published.created_by,
        published_at: published.published_at,
        archived_at: published.archived_at,
      })
    },

    async restoreVersionAsDraft({ userId, email, courseId, versionId }) {
      assertUuid(userId, 'userId')
      assertUuid(versionId, 'versionId')

      const course = await ensureOwnedCourse({ userId, email, courseId })
      const source = await must(
        client
          .from('course_versions')
          .select(
            'id, course_id, version, status, title, description, content, change_note, created_at, created_by, published_at, archived_at',
          )
          .eq('id', versionId)
          .eq('course_id', course.id)
          .maybeSingle(),
      )
      if (!source) {
        throw new Error('Version not found for this course.')
      }

      const version = await nextVersionNumber(course.id)
      const inserted = await must(
        client
          .from('course_versions')
          .insert({
            id: crypto.randomUUID(),
            course_id: course.id,
            version,
            status: 'draft',
            title: source.title,
            description: source.description,
            content: clone(normalizeContent(source.content)),
            change_note: `Restored from v${source.version}`,
            created_by: userId,
            published_at: null,
            archived_at: null,
          })
          .select(
            'id, course_id, version, status, title, description, content, change_note, created_at, created_by, published_at, archived_at',
          )
          .single(),
      )

      return mapPublisherJoinedRow({
        course_id: course.id,
        slug: course.slug,
        owner_id: course.owner_id,
        price_cents: course.price_cents,
        currency: course.currency,
        stripe_price_id: course.stripe_price_id,
        version_id: String(inserted.id),
        version: Number(inserted.version),
        status: inserted.status,
        title: inserted.title,
        description: inserted.description,
        content: inserted.content,
        change_note: inserted.change_note,
        created_at: inserted.created_at,
        created_by: inserted.created_by,
        published_at: inserted.published_at,
        archived_at: inserted.archived_at,
      })
    },

    async listCourseVersionHistory({ userId, email, courseId }) {
      const course = await ensureOwnedCourse({ userId, email, courseId })
      const rows = await must(
        client
          .from('course_versions')
          .select(
            'id, version, status, title, change_note, created_at, created_by, published_at, archived_at',
          )
          .eq('course_id', course.id)
          .order('version', { ascending: false }),
      )

      return rows.map(
        (row): CourseVersionHistoryRecord => ({
          versionId: String(row.id),
          version: Number(row.version),
          status: row.status,
          title: String(row.title),
          changeNote: (row.change_note as string | null) ?? null,
          createdAt: toIso(row.created_at as string | Date) ?? nowIso(),
          createdBy: String(row.created_by),
          publishedAt: toIso(row.published_at as string | Date | null),
          archivedAt: toIso(row.archived_at as string | Date | null),
        }),
      )
    },

    async diffCourseVersions({
      userId,
      email,
      courseId,
      fromVersionId,
      toVersionId,
    }) {
      assertUuid(fromVersionId, 'fromVersionId')
      assertUuid(toVersionId, 'toVersionId')

      const course = await ensureOwnedCourse({ userId, email, courseId })
      const from = await must(
        client
          .from('course_versions')
          .select('id, course_id, version, title, description, content')
          .eq('id', fromVersionId)
          .eq('course_id', course.id)
          .maybeSingle(),
      )
      const to = await must(
        client
          .from('course_versions')
          .select('id, course_id, version, title, description, content')
          .eq('id', toVersionId)
          .eq('course_id', course.id)
          .maybeSingle(),
      )
      if (!from || !to) {
        throw new Error('Versions not found for this course.')
      }

      const fromFlat = flattenJson(normalizeContent(from.content))
      const toFlat = flattenJson(normalizeContent(to.content))
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

      const result: CourseVersionDiffRecord = {
        courseId: course.id,
        fromVersionId,
        toVersionId,
        fromVersion: Number(from.version),
        toVersion: Number(to.version),
        titleChanged: String(from.title) !== String(to.title),
        descriptionChanged: String(from.description) !== String(to.description),
        addedFields: addedFields.sort(),
        removedFields: removedFields.sort(),
        changedFields: changedFields.sort(),
      }
      return result
    },
  }
}
