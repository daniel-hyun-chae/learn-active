import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { eq } from 'drizzle-orm'
import type { GraphQLContext } from '../../graphql/context.js'
import { courses as seedCourses, seedCourseRow } from './seed.js'
import { Course } from './types.js'
import { CourseInput } from './inputs.js'
import * as schema from '../../db/schema.js'

type CourseRow = {
  id: string
  title: string
  description: string
  language: string
  content: { modules: Course['modules'] }
}

function mapCourseRow(row: CourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    language: row.language,
    modules: row.content.modules,
  }
}

function ensureId(value?: string) {
  return value ?? crypto.randomUUID()
}

function normalizeCourseInput(input: CourseInput): CourseRow {
  const modules = input.modules.map((module, moduleIndex) => {
    const moduleId = ensureId(module.id)
    return {
      id: moduleId,
      title: module.title,
      order: module.order ?? moduleIndex + 1,
      lessons: module.lessons.map((lesson, lessonIndex) => {
        const lessonId = ensureId(lesson.id)
        return {
          id: lessonId,
          title: lesson.title,
          order: lesson.order ?? lessonIndex + 1,
          contents: lesson.contents.map((content, contentIndex) => ({
            id: ensureId(content.id ?? `content-${lessonId}-${contentIndex}`),
            type: content.type,
            text: content.text,
            imageUrl: content.imageUrl,
            imageAlt: content.imageAlt,
            lexicalJson: content.lexicalJson,
          })),
          exercises: lesson.exercises.map((exercise, exerciseIndex) => ({
            id: ensureId(
              exercise.id ?? `exercise-${lessonId}-${exerciseIndex}`,
            ),
            type: exercise.type,
            title: exercise.title,
            instructions: exercise.instructions,
            steps: exercise.steps.map((step, stepIndex) => ({
              id: ensureId(step.id ?? `step-${lessonId}-${stepIndex}`),
              order: step.order ?? stepIndex + 1,
              prompt: step.prompt,
              threadId: step.threadId,
              threadTitle: step.threadTitle,
              segments: step.segments.map((segment) => ({
                type: segment.type,
                text: segment.text,
                blankId: segment.blankId,
              })),
              blanks: step.blanks.map((blank, blankIndex) => ({
                id: ensureId(
                  blank.id ?? `blank-${lessonId}-${stepIndex}-${blankIndex}`,
                ),
                correct: blank.correct,
                variant: blank.variant,
                options: blank.options,
              })),
            })),
          })),
        }
      }),
    }
  })

  return {
    id: input.id ?? crypto.randomUUID(),
    title: input.title,
    description: input.description,
    language: input.language,
    content: { modules },
  }
}

@Resolver(() => Course)
export class CourseResolver {
  @Query(() => [Course])
  async courses(@Ctx() ctx: GraphQLContext) {
    if (!ctx.db) {
      return seedCourses
    }
    const rows = await ctx.db.select().from(schema.courses)
    return rows.map((row) => mapCourseRow(row as CourseRow))
  }

  @Query(() => Course, { nullable: true })
  async course(
    @Arg('id', () => String) id: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    if (!ctx.db) {
      return seedCourses.find((course) => course.id === id) ?? null
    }
    const rows = await ctx.db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.id, id))
      .limit(1)
    const row = rows[0]
    return row ? mapCourseRow(row as CourseRow) : null
  }

  @Mutation(() => Course)
  async upsertCourse(
    @Arg('input', () => CourseInput) input: CourseInput,
    @Ctx() ctx: GraphQLContext,
  ) {
    if (!ctx.db) {
      throw new Error('Database not available')
    }
    const row = normalizeCourseInput(input)

    await ctx.db
      .insert(schema.courses)
      .values({
        id: row.id,
        title: row.title,
        description: row.description,
        language: row.language,
        content: row.content,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.courses.id,
        set: {
          title: row.title,
          description: row.description,
          language: row.language,
          content: row.content,
          updatedAt: new Date(),
        },
      })

    const rows = await ctx.db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.id, row.id))
      .limit(1)
    return mapCourseRow(rows[0] as CourseRow)
  }

  @Mutation(() => Course)
  async seedSampleCourse(@Ctx() ctx: GraphQLContext) {
    if (!ctx.db) {
      return seedCourses[0]
    }
    await ctx.db
      .insert(schema.courses)
      .values(seedCourseRow)
      .onConflictDoUpdate({
        target: schema.courses.id,
        set: {
          title: seedCourseRow.title,
          description: seedCourseRow.description,
          language: seedCourseRow.language,
          content: seedCourseRow.content,
          updatedAt: new Date(),
        },
      })
    return mapCourseRow(seedCourseRow as CourseRow)
  }
}
