import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../../graphql/context.js'
import { seedCourseRow } from './seed.js'
import {
  AttemptAnswer,
  Course,
  CourseProgress,
  CheckoutChannel,
  CheckoutSession,
  CourseVersionDiff,
  CourseVersionHistory,
  Enrollment,
  EnrollmentStatus,
  Exercise,
  LearnerExerciseAttempt,
  LearnerExerciseAttemptHistoryEntry,
  LearnerResumePosition,
  MyCourse,
  Payment,
  PublicCourse,
  PublicPreviewLesson,
} from './types.js'
import {
  CourseInput,
  PublicCatalogQueryInput,
  LearnerExerciseAttemptInput,
  LearnerResumePositionInput,
} from './inputs.js'
import { requireAuthenticatedUser } from '../auth/guard.js'
import {
  isActivelyEnrolled,
  mapPublisherCourseToCourse,
  normalizeCourseInput,
} from './model.js'
import {
  formatPublisherValidationIssue,
  validatePublisherCourse,
} from './publisher-validation.js'

const COURSE_EDIT_FORBIDDEN_MESSAGE =
  'Course is not editable by current publisher.'

const DEFAULT_WEB_ORIGIN = 'http://localhost:3000'
const STRIPE_MIN_EUR_PRICE_CENTS = 50
const PUBLISH_VALIDATION_ERROR_LIMIT = 3

function normalizeAnswer(value: string | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function evaluateExerciseCorrectness(
  exercise: Exercise,
  answers: Record<string, string>,
) {
  if (exercise.type === 'REORDERING') {
    const items = [...(exercise.reordering?.items ?? [])].sort(
      (a, b) => a.order - b.order,
    )
    const itemById = new Map(items.map((item) => [item.id, item]))
    const learnerOrderedNonDistractorIds = Object.entries(answers)
      .filter(([id]) => itemById.has(id))
      .map(([id, rank]) => ({
        id,
        rank: Number.parseInt(rank, 10),
      }))
      .filter((entry) => Number.isFinite(entry.rank))
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => entry.id)
      .filter((id) => !itemById.get(id)?.isDistractor)

    const expectedNonDistractorIds = items
      .filter((item) => !item.isDistractor)
      .map((item) => item.id)

    if (
      learnerOrderedNonDistractorIds.length !== expectedNonDistractorIds.length
    ) {
      return false
    }

    return learnerOrderedNonDistractorIds.every(
      (id, index) => id === expectedNonDistractorIds[index],
    )
  }

  if (exercise.type === 'FILL_IN_THE_BLANK') {
    const steps = exercise.fillInBlank?.steps ?? []
    for (const step of steps) {
      for (const blank of step.blanks) {
        if (
          normalizeAnswer(answers[blank.id]) !== normalizeAnswer(blank.correct)
        ) {
          return false
        }
      }
    }
    return true
  }

  const choices = exercise.multipleChoice?.choices ?? []
  const selected = new Set(
    Object.entries(answers)
      .filter(([, value]) => value === 'true')
      .map(([key]) => key),
  )
  const correct = new Set(
    choices.filter((choice) => choice.isCorrect).map((choice) => choice.id),
  )
  if (selected.size !== correct.size) {
    return false
  }
  for (const choiceId of selected) {
    if (!correct.has(choiceId)) {
      return false
    }
  }
  return true
}

function findLessonExercise(
  course: Course,
  lessonId: string,
  exerciseId: string,
): Exercise | null {
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (lesson.id !== lessonId) {
        continue
      }
      const exercise = lesson.exercises.find((entry) => entry.id === exerciseId)
      return exercise ?? null
    }
  }
  return null
}

function findCourseLesson(course: Course, lessonId: string) {
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (lesson.id === lessonId) {
        return lesson
      }
    }
  }
  return null
}

function getRequestOrigin(request: Request) {
  const candidates = [
    request.headers.get('origin'),
    request.headers.get('referer'),
    request.url,
  ]

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    try {
      return new URL(candidate).origin
    } catch {
      // keep trying the next candidate
    }
  }

  try {
    return new URL(request.url).origin
  } catch {
    return DEFAULT_WEB_ORIGIN
  }
}

function assertEurCurrency(currency: string) {
  if (currency !== 'eur') {
    throw new GraphQLError('Only EUR pricing is supported in this phase.', {
      extensions: { code: 'BAD_USER_INPUT' },
    })
  }
}

function assertMinimumStripePrice(priceCents: number | null | undefined) {
  if (
    typeof priceCents === 'number' &&
    priceCents > 0 &&
    priceCents < STRIPE_MIN_EUR_PRICE_CENTS
  ) {
    throw new GraphQLError(
      `Paid EUR courses must be priced at least ${STRIPE_MIN_EUR_PRICE_CENTS} cents.`,
      { extensions: { code: 'BAD_USER_INPUT' } },
    )
  }
}

@Resolver(() => Course)
export class CourseResolver {
  @Query(() => [Course])
  async learnerCourses(@Ctx() ctx: GraphQLContext) {
    const user = requireAuthenticatedUser(ctx)

    const rows = await ctx.services.courseRepository.listLearnerCourses({
      userId: user.id,
    })
    return rows.map((row) => mapPublisherCourseToCourse(row))
  }

  @Query(() => Course, { nullable: true })
  async learnerCourse(
    @Arg('id', () => String) id: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)

    const row = await ctx.services.courseRepository.getLearnerCourseById({
      userId: user.id,
      id,
    })
    return row ? mapPublisherCourseToCourse(row) : null
  }

  @Query(() => CourseProgress, { nullable: true })
  async learnerCourseProgress(
    @Arg('courseId', () => String) courseId: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)
    return await ctx.services.courseRepository.getLearnerCourseProgress({
      userId: user.id,
      courseId,
    })
  }

  @Query(() => [LearnerExerciseAttemptHistoryEntry])
  async learnerExerciseAttemptHistory(
    @Arg('courseId', () => String) courseId: string,
    @Arg('courseVersionId', () => String) courseVersionId: string,
    @Arg('lessonId', () => String) lessonId: string,
    @Arg('exerciseId', () => String) exerciseId: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)
    const rows =
      await ctx.services.courseRepository.listLearnerExerciseAttemptHistory({
        userId: user.id,
        courseId,
        courseVersionId,
        lessonId,
        exerciseId,
      })

    return rows.map((row) => ({
      ...row,
      answers: Object.entries(row.answers).map(
        ([key, value]): AttemptAnswer => ({ key, value }),
      ),
    }))
  }

  @Query(() => [PublicCourse])
  async publicCourses(
    @Arg('query', () => PublicCatalogQueryInput, { nullable: true })
    query: PublicCatalogQueryInput | null,
    @Ctx() _ctx: GraphQLContext,
  ) {
    return await _ctx.services.courseRepository.listPublicCourses(
      query
        ? {
            search: query.search ?? undefined,
            categoryIds: query.categoryIds ?? undefined,
            priceFilter: query.priceFilter ?? undefined,
            languageCodes: query.languageCodes ?? undefined,
            sort: query.sort ?? undefined,
            limit: query.limit ?? undefined,
          }
        : undefined,
    )
  }

  @Query(() => PublicCourse, { nullable: true })
  async publicCourse(
    @Arg('slug', () => String) slug: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    return await ctx.services.courseRepository.getPublicCourseBySlug(slug)
  }

  @Query(() => PublicPreviewLesson, { nullable: true })
  async publicPreviewLesson(
    @Arg('slug', () => String) slug: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    return await ctx.services.courseRepository.getPublicPreviewLessonBySlug(
      slug,
    )
  }

  @Query(() => Course, { nullable: true })
  async publicPreviewCourse(
    @Arg('slug', () => String) slug: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    const publicCourse =
      await ctx.services.courseRepository.getPublicCourseBySlug(slug)
    if (!publicCourse?.modules || !publicCourse.previewLessonId) {
      return null
    }

    return {
      id: publicCourse.id,
      versionId: `preview-${publicCourse.id}`,
      version: 0,
      status: 'published',
      title: publicCourse.title,
      description: publicCourse.description,
      priceCents: publicCourse.priceCents,
      currency: publicCourse.currency,
      stripePriceId: publicCourse.stripePriceId,
      isPaid: publicCourse.isPaid,
      categoryIds: publicCourse.categoryIds ?? [],
      tags: publicCourse.tags ?? [],
      languageCode: publicCourse.languageCode ?? 'en',
      previewLessonId: publicCourse.previewLessonId,
      changeNote: null,
      createdAt: new Date().toISOString(),
      createdBy: 'public-preview',
      publishedAt: new Date().toISOString(),
      archivedAt: null,
      resumePosition: null,
      modules: publicCourse.modules,
    }
  }

  @Query(() => [MyCourse])
  async myCourses(@Ctx() ctx: GraphQLContext) {
    const user = requireAuthenticatedUser(ctx)
    return await ctx.services.courseRepository.listMyCourses({
      userId: user.id,
    })
  }

  @Query(() => [Payment])
  async myPayments(@Ctx() ctx: GraphQLContext) {
    const user = requireAuthenticatedUser(ctx)
    return await ctx.services.courseRepository.listMyPayments({
      userId: user.id,
    })
  }

  @Query(() => EnrollmentStatus)
  async courseEnrollmentStatus(
    @Arg('courseId', () => String) courseId: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)
    const enrollment =
      await ctx.services.courseRepository.getEnrollmentForUserCourse({
        userId: user.id,
        courseId,
      })

    return {
      enrolled: enrollment ? isActivelyEnrolled(enrollment.status) : false,
      status: enrollment?.status ?? null,
    }
  }

  @Query(() => [Course])
  async publisherCourses(@Ctx() ctx: GraphQLContext) {
    const user = requireAuthenticatedUser(ctx)
    const rows = await ctx.services.courseRepository.listPublisherCourses({
      userId: user.id,
      email: user.email,
    })
    return rows.map((row) => mapPublisherCourseToCourse(row))
  }

  @Query(() => Course, { nullable: true })
  async publisherCourse(
    @Arg('id', () => String) id: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)
    const row = await ctx.services.courseRepository.getPublisherCourseById({
      userId: user.id,
      email: user.email,
      id,
    })
    return row ? mapPublisherCourseToCourse(row) : null
  }

  @Query(() => [CourseVersionHistory])
  async courseVersionHistory(
    @Arg('courseId', () => String) courseId: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)
    return await ctx.services.courseRepository.listCourseVersionHistory({
      userId: user.id,
      email: user.email,
      courseId,
    })
  }

  @Query(() => CourseVersionDiff)
  async courseVersionDiff(
    @Arg('courseId', () => String) courseId: string,
    @Arg('fromVersionId', () => String) fromVersionId: string,
    @Arg('toVersionId', () => String) toVersionId: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)
    return await ctx.services.courseRepository.diffCourseVersions({
      userId: user.id,
      email: user.email,
      courseId,
      fromVersionId,
      toVersionId,
    })
  }

  @Mutation(() => Course)
  async upsertCourse(
    @Arg('input', () => CourseInput) input: CourseInput,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)

    const row = normalizeCourseInput(input, ctx.services.generateId)
    assertEurCurrency(row.currency)
    assertMinimumStripePrice(row.priceCents)

    const isPaid = typeof row.priceCents === 'number' && row.priceCents > 0

    let stripePriceId: string | null = null
    if (isPaid) {
      if (!ctx.services.stripe) {
        throw new GraphQLError(
          'Stripe is not configured in this environment.',
          {
            extensions: { code: 'SERVICE_UNAVAILABLE' },
          },
        )
      }

      const existing =
        await ctx.services.courseRepository.getPublisherCourseById({
          userId: user.id,
          email: user.email,
          id: row.id,
        })

      const provisioned = await ctx.services.stripe.createOrUpdateCoursePrice({
        courseId: row.id,
        courseTitle: row.title,
        amountCents: row.priceCents ?? 0,
        currency: row.currency,
        existingPriceId: existing?.stripePriceId ?? null,
      })
      stripePriceId = provisioned.stripePriceId
    }

    try {
      const saved = await ctx.services.courseRepository.upsertPublisherCourse({
        userId: user.id,
        email: user.email,
        row: {
          id: row.id,
          title: row.title,
          description: row.description,
          priceCents: row.priceCents,
          currency: row.currency,
          stripePriceId: isPaid ? stripePriceId : null,
          categoryIds: row.categoryIds,
          tags: row.tags,
          languageCode: row.languageCode,
          previewLessonId: row.previewLessonId,
          content: row.content,
        },
      })
      return mapPublisherCourseToCourse(saved)
    } catch (error) {
      throw new GraphQLError(
        error instanceof Error ? error.message : COURSE_EDIT_FORBIDDEN_MESSAGE,
        { extensions: { code: 'FORBIDDEN' } },
      )
    }
  }

  @Mutation(() => Course)
  async seedSampleCourse(@Ctx() ctx: GraphQLContext) {
    const user = requireAuthenticatedUser(ctx)

    const seeded =
      await ctx.services.courseRepository.seedPublisherSampleCourse({
        userId: user.id,
        email: user.email,
        row: {
          id: seedCourseRow.id,
          title: seedCourseRow.title,
          description: seedCourseRow.description,
          priceCents: null,
          currency: 'eur',
          stripePriceId: null,
          categoryIds: seedCourseRow.categoryIds,
          tags: seedCourseRow.tags,
          languageCode: seedCourseRow.languageCode,
          previewLessonId: seedCourseRow.previewLessonId,
          content: seedCourseRow.content,
        },
      })
    return mapPublisherCourseToCourse(seeded)
  }

  @Mutation(() => CheckoutSession)
  async createCourseCheckoutSession(
    @Arg('courseId', () => String) courseId: string,
    @Arg('channel', () => CheckoutChannel, {
      nullable: true,
      defaultValue: CheckoutChannel.WEB,
    })
    channel: CheckoutChannel,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)

    const course =
      await ctx.services.courseRepository.getPublicCourseById(courseId)
    if (!course) {
      throw new GraphQLError('Course is not purchasable.', {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }

    if (!course.isPaid || !course.priceCents || course.priceCents <= 0) {
      throw new GraphQLError(
        'This course is free and does not require checkout.',
        {
          extensions: { code: 'BAD_USER_INPUT' },
        },
      )
    }

    const existingEnrollment =
      await ctx.services.courseRepository.getEnrollmentForUserCourse({
        userId: user.id,
        courseId,
      })
    if (existingEnrollment && isActivelyEnrolled(existingEnrollment.status)) {
      throw new GraphQLError(
        'You are already actively enrolled in this course.',
        {
          extensions: { code: 'BAD_USER_INPUT' },
        },
      )
    }

    if (!course.stripePriceId) {
      throw new GraphQLError('Course checkout is not configured.', {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }

    if (!ctx.services.stripe) {
      throw new GraphQLError('Stripe is not configured in this environment.', {
        extensions: { code: 'SERVICE_UNAVAILABLE' },
      })
    }

    let session
    try {
      session = await ctx.services.stripe.createCheckoutSession({
        stripePriceId: course.stripePriceId,
        userId: user.id,
        courseId: course.id,
        courseSlug: course.slug,
        channel,
        requestOrigin: getRequestOrigin(ctx.request),
      })
    } catch (error) {
      throw new GraphQLError(
        error instanceof Error
          ? error.message
          : 'Unable to create Stripe checkout session.',
        { extensions: { code: 'SERVICE_UNAVAILABLE' } },
      )
    }

    return {
      url: session.url,
      sessionId: session.sessionId,
    }
  }

  @Mutation(() => Course)
  async publishCourseDraft(
    @Arg('courseId', () => String) courseId: string,
    @Arg('changeNote', () => String, { nullable: true })
    changeNote: string | null,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)

    const draft = await ctx.services.courseRepository.getPublisherCourseById({
      userId: user.id,
      email: user.email,
      id: courseId,
    })

    if (draft) {
      const draftCourse = mapPublisherCourseToCourse(draft)
      const validation = validatePublisherCourse({
        modules: draftCourse.modules,
      })

      if (validation.hasErrors) {
        const topErrors = validation.errors
          .slice(0, PUBLISH_VALIDATION_ERROR_LIMIT)
          .map((issue) => formatPublisherValidationIssue(issue))
        const additionalCount = validation.errors.length - topErrors.length
        const moreText =
          additionalCount > 0 ? ` (+${additionalCount} more)` : ''

        throw new GraphQLError(
          `Publish blocked by validation errors. ${topErrors.join(' ')}${moreText}`,
          { extensions: { code: 'BAD_USER_INPUT' } },
        )
      }
    }

    try {
      const published = await ctx.services.courseRepository.publishCourseDraft({
        userId: user.id,
        email: user.email,
        courseId,
        changeNote,
      })
      return mapPublisherCourseToCourse(published)
    } catch (error) {
      throw new GraphQLError(
        error instanceof Error ? error.message : 'Publish failed.',
        { extensions: { code: 'BAD_USER_INPUT' } },
      )
    }
  }

  @Mutation(() => Course)
  async createDraftFromPublished(
    @Arg('courseId', () => String) courseId: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)
    const draft = await ctx.services.courseRepository.createDraftFromPublished({
      userId: user.id,
      email: user.email,
      courseId,
    })
    return mapPublisherCourseToCourse(draft)
  }

  @Mutation(() => Course)
  async restoreVersionAsDraft(
    @Arg('courseId', () => String) courseId: string,
    @Arg('versionId', () => String) versionId: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)
    const draft = await ctx.services.courseRepository.restoreVersionAsDraft({
      userId: user.id,
      email: user.email,
      courseId,
      versionId,
    })
    return mapPublisherCourseToCourse(draft)
  }

  @Mutation(() => Enrollment)
  async enrollInCourse(
    @Arg('courseId', () => String) courseId: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)
    const enrollment = await ctx.services.courseRepository.enrollInCourse({
      userId: user.id,
      courseId,
    })
    return enrollment
  }

  @Mutation(() => LearnerExerciseAttempt)
  async upsertLearnerExerciseAttempt(
    @Arg('input', () => LearnerExerciseAttemptInput)
    input: LearnerExerciseAttemptInput,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)

    const learnerCourse =
      await ctx.services.courseRepository.getLearnerCourseById({
        userId: user.id,
        id: input.courseId,
      })

    if (!learnerCourse) {
      throw new GraphQLError('Course is not available to this learner.', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    if (learnerCourse.versionId !== input.courseVersionId) {
      throw new GraphQLError(
        'Course version is not current for this learner enrollment.',
        { extensions: { code: 'BAD_USER_INPUT' } },
      )
    }

    const mappedCourse = mapPublisherCourseToCourse(learnerCourse)
    const exercise = findLessonExercise(
      mappedCourse,
      input.lessonId,
      input.exerciseId,
    )
    if (!exercise) {
      throw new GraphQLError('Exercise not found for this lesson.', {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }

    const answers = Object.fromEntries(
      input.answers.map((entry) => [entry.key, entry.value]),
    )
    const isCorrect = evaluateExerciseCorrectness(exercise, answers)

    const saved =
      await ctx.services.courseRepository.upsertLearnerExerciseAttempt({
        userId: user.id,
        courseId: input.courseId,
        courseVersionId: input.courseVersionId,
        lessonId: input.lessonId,
        exerciseId: input.exerciseId,
        answers,
        isCorrect,
      })

    return {
      ...saved,
      answers: Object.entries(saved.answers).map(
        ([key, value]): AttemptAnswer => ({ key, value }),
      ),
    }
  }

  @Mutation(() => LearnerResumePosition)
  async upsertLearnerResumePosition(
    @Arg('input', () => LearnerResumePositionInput)
    input: LearnerResumePositionInput,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)

    if (
      input.block !== 'summary' &&
      input.block !== 'contentPage' &&
      input.block !== 'exercise'
    ) {
      throw new GraphQLError('Resume block is invalid.', {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }

    const learnerCourse =
      await ctx.services.courseRepository.getLearnerCourseById({
        userId: user.id,
        id: input.courseId,
      })

    if (!learnerCourse) {
      throw new GraphQLError('Course is not available to this learner.', {
        extensions: { code: 'FORBIDDEN' },
      })
    }

    const mappedCourse = mapPublisherCourseToCourse(learnerCourse)
    const lesson = findCourseLesson(mappedCourse, input.lessonId)
    if (!lesson) {
      throw new GraphQLError('Lesson not found for this course.', {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }

    if (input.block === 'contentPage') {
      if (!input.contentPageId) {
        throw new GraphQLError(
          'contentPageId is required for contentPage block.',
          {
            extensions: { code: 'BAD_USER_INPUT' },
          },
        )
      }

      const contentPageExists = lesson.contentPages.some(
        (contentPage) => contentPage.id === input.contentPageId,
      )
      if (!contentPageExists) {
        throw new GraphQLError('Content page not found for this lesson.', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }
    }

    if (input.block === 'exercise') {
      if (!input.exerciseId) {
        throw new GraphQLError('exerciseId is required for exercise block.', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      const exerciseExists = lesson.exercises.some(
        (exercise) => exercise.id === input.exerciseId,
      )
      if (!exerciseExists) {
        throw new GraphQLError('Exercise not found for this lesson.', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }
    }

    return await ctx.services.courseRepository.upsertLearnerResumePosition({
      userId: user.id,
      courseId: input.courseId,
      lessonId: input.lessonId,
      block: input.block,
      contentPageId: input.contentPageId,
      exerciseId: input.exerciseId,
    })
  }
}
