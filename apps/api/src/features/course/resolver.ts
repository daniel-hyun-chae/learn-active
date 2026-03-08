import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { eq } from 'drizzle-orm'
import type { GraphQLContext } from '../../graphql/context.js'
import { courses as seedCourses, seedCourseRow } from './seed.js'
import { Course } from './types.js'
import { CourseInput } from './inputs.js'
import * as schema from '../../db/schema.js'
import { requireAuthenticatedUser } from '../auth/guard.js'

type CourseRow = {
  id: string
  title: string
  description: string
  content: { modules: Course['modules'] }
}

function toCourseRow(course: Course): CourseRow {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    content: {
      modules: normalizeStoredModules(course.modules),
    },
  }
}

const inMemoryCourses = new Map<string, CourseRow>(
  [...seedCourses, mapCourseRow(seedCourseRow as CourseRow)].map((course) => {
    const row = toCourseRow(course)
    return [row.id, row]
  }),
)

function normalizeStoredModules(modules: Course['modules']): Course['modules'] {
  return modules.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson) => ({
      ...lesson,
      contents: lesson.contents ?? [],
      contentPages: lesson.contentPages ?? [],
      exercises: lesson.exercises ?? [],
    })),
  }))
}

function mapCourseRow(row: CourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    modules: normalizeStoredModules(row.content?.modules ?? []),
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
          contentPages: (lesson.contentPages ?? []).map((page, pageIndex) => {
            const pageId = ensureId(
              page.id ?? `content-page-${lessonId}-${pageIndex}`,
            )
            return {
              id: pageId,
              title: page.title,
              order: page.order ?? pageIndex + 1,
              contents: page.contents.map((content, contentIndex) => ({
                id: ensureId(content.id ?? `content-${pageId}-${contentIndex}`),
                type: content.type,
                text: content.text,
                imageUrl: content.imageUrl,
                imageAlt: content.imageAlt,
                lexicalJson: content.lexicalJson,
              })),
            }
          }),
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
    content: { modules },
  }
}

@Resolver(() => Course)
export class CourseResolver {
  @Query(() => [Course])
  async courses(@Ctx() ctx: GraphQLContext) {
    requireAuthenticatedUser(ctx)

    if (!ctx.db) {
      return Array.from(inMemoryCourses.values()).map((row) =>
        mapCourseRow(row),
      )
    }
    const rows = await ctx.db.select().from(schema.courses)
    if (rows.length === 0) {
      return Array.from(inMemoryCourses.values()).map((row) =>
        mapCourseRow(row),
      )
    }
    return rows.map((row) => mapCourseRow(row as CourseRow))
  }

  @Query(() => Course, { nullable: true })
  async course(
    @Arg('id', () => String) id: string,
    @Ctx() ctx: GraphQLContext,
  ) {
    requireAuthenticatedUser(ctx)

    if (!ctx.db) {
      const row = inMemoryCourses.get(id)
      return row ? mapCourseRow(row) : null
    }
    const rows = await ctx.db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.id, id))
      .limit(1)
    const row = rows[0]
    if (row) {
      return mapCourseRow(row as CourseRow)
    }
    const fallback = inMemoryCourses.get(id)
    return fallback ? mapCourseRow(fallback) : null
  }

  @Mutation(() => Course)
  async upsertCourse(
    @Arg('input', () => CourseInput) input: CourseInput,
    @Ctx() ctx: GraphQLContext,
  ) {
    requireAuthenticatedUser(ctx)

    const row = normalizeCourseInput(input)

    if (!ctx.db) {
      inMemoryCourses.set(row.id, row)
      return mapCourseRow(row)
    }

    await ctx.db
      .insert(schema.courses)
      .values({
        id: row.id,
        title: row.title,
        description: row.description,
        content: row.content,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.courses.id,
        set: {
          title: row.title,
          description: row.description,
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
    requireAuthenticatedUser(ctx)

    if (!ctx.db) {
      inMemoryCourses.set(seedCourseRow.id, seedCourseRow as CourseRow)
      return mapCourseRow(seedCourseRow as CourseRow)
    }
    await ctx.db
      .insert(schema.courses)
      .values(seedCourseRow)
      .onConflictDoUpdate({
        target: schema.courses.id,
        set: {
          title: seedCourseRow.title,
          description: seedCourseRow.description,
          content: seedCourseRow.content,
          updatedAt: new Date(),
        },
      })
    return mapCourseRow(seedCourseRow as CourseRow)
  }
}
