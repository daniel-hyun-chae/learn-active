import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import type { GraphQLContext } from '../../graphql/context.js'
import { seedCourseRow } from './seed.js'
import { Course } from './types.js'
import { CourseInput } from './inputs.js'
import { requireAuthenticatedUser } from '../auth/guard.js'
import { mapCourseRecord, normalizeCourseInput } from './model.js'

@Resolver(() => Course)
export class CourseResolver {
  @Query(() => [Course])
  async courses(@Ctx() ctx: GraphQLContext) {
    requireAuthenticatedUser(ctx)

    const rows = await ctx.services.courseRepository.listCourses()
    return rows.map((row) => mapCourseRecord(row))
  }

  @Query(() => Course, { nullable: true })
  async course(
    @Arg('id', () => String) id: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    requireAuthenticatedUser(ctx)

    const row = await ctx.services.courseRepository.getCourseById(id)
    return row ? mapCourseRecord(row) : null
  }

  @Mutation(() => Course)
  async upsertCourse(
    @Arg('input', () => CourseInput) input: CourseInput,
    @Ctx() ctx: GraphQLContext,
  ) {
    requireAuthenticatedUser(ctx)

    const row = normalizeCourseInput(input, ctx.services.generateId)
    const saved = await ctx.services.courseRepository.upsertCourse(row)
    return mapCourseRecord(saved)
  }

  @Mutation(() => Course)
  async seedSampleCourse(@Ctx() ctx: GraphQLContext) {
    requireAuthenticatedUser(ctx)

    const seeded =
      await ctx.services.courseRepository.seedSampleCourse(seedCourseRow)
    return mapCourseRecord(seeded)
  }
}
