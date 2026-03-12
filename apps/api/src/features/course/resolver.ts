import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../../graphql/context.js'
import { seedCourseRow } from './seed.js'
import {
  Course,
  CourseVersionDiff,
  CourseVersionHistory,
  Enrollment,
  MyCourse,
  PublicCourse,
} from './types.js'
import { CourseInput } from './inputs.js'
import { requireAuthenticatedUser } from '../auth/guard.js'
import { mapPublisherCourseToCourse, normalizeCourseInput } from './model.js'

const COURSE_EDIT_FORBIDDEN_MESSAGE =
  'Course is not editable by current publisher.'

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

  @Query(() => [PublicCourse])
  async publicCourses(@Ctx() _ctx: GraphQLContext) {
    return await _ctx.services.courseRepository.listPublicCourses()
  }

  @Query(() => PublicCourse, { nullable: true })
  async publicCourse(
    @Arg('slug', () => String) slug: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    return await ctx.services.courseRepository.getPublicCourseBySlug(slug)
  }

  @Query(() => [MyCourse])
  async myCourses(@Ctx() ctx: GraphQLContext) {
    const user = requireAuthenticatedUser(ctx)
    return await ctx.services.courseRepository.listMyCourses({
      userId: user.id,
    })
  }

  @Query(() => [Course])
  async courses(@Ctx() ctx: GraphQLContext) {
    return this.learnerCourses(ctx)
  }

  @Query(() => Course, { nullable: true })
  async course(
    @Arg('id', () => String) id: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    return this.learnerCourse(id, ctx)
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
    try {
      const saved = await ctx.services.courseRepository.upsertPublisherCourse({
        userId: user.id,
        email: user.email,
        row: {
          id: row.id,
          title: row.title,
          description: row.description,
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
          content: seedCourseRow.content,
        },
      })
    return mapPublisherCourseToCourse(seeded)
  }

  @Mutation(() => Course)
  async publishCourseDraft(
    @Arg('courseId', () => String) courseId: string,
    @Arg('changeNote', () => String, { nullable: true })
    changeNote: string | null,
    @Ctx() ctx: GraphQLContext,
  ) {
    const user = requireAuthenticatedUser(ctx)
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
}
