import { createFileRoute } from '@tanstack/react-router'
import { LearnerHome } from '../features/learners/home/LearnerHome'
import type { CourseProgress } from '../features/learners/course/types'
import { requireWebSession } from '../features/auth/route-guard'
import {
  fetchGraphQL,
  setGraphQLAccessTokenProvider,
} from '../shared/api/graphql'

type LoaderData = {
  apiHealth: string
  courses: Array<{
    id: string
    versionId: string
    title: string
    description: string
    resumePosition?: {
      courseId: string
      lessonId: string
      block: 'summary' | 'contentPage' | 'exercise'
      contentPageId: string | null
      exerciseId: string | null
      visitedAt: string
    } | null
    modules: Array<{
      id: string
      lessons: Array<{ id: string }>
    }>
  }>
  catalogCourses: Array<{
    id: string
    slug: string
    title: string
    description: string
    priceCents?: number | null
    currency: string
    isPaid: boolean
  }>
  progressByCourseId: Record<string, CourseProgress>
}

async function loadLandingData(): Promise<LoaderData> {
  const session = await requireWebSession('/learn')
  setGraphQLAccessTokenProvider(async () => session?.access_token ?? null)

  const cachedHealth = (
    globalThis as typeof globalThis & {
      __API_HEALTH__?: string
    }
  ).__API_HEALTH__

  try {
    const data = await fetchGraphQL<{
      health: string
      learnerCourses: LoaderData['courses']
    }>(
      `query LandingCourses {
        health
        learnerCourses {
          id
          versionId
          title
          description
          resumePosition {
            courseId
            lessonId
            block
            contentPageId
            exerciseId
            visitedAt
          }
          modules {
            id
            lessons { id }
          }
        }
      }`,
    )

    let catalogCourses: LoaderData['catalogCourses'] = []
    if (data.learnerCourses.length === 0) {
      try {
        const catalogData = await fetchGraphQL<{
          publicCourses: LoaderData['catalogCourses']
        }>(
          `query LandingCatalogCourses {
            publicCourses {
              id
              slug
              title
              description
              priceCents
              currency
              isPaid
            }
          }`,
        )
        catalogCourses = catalogData.publicCourses
      } catch {
        catalogCourses = []
      }
    }

    ;(
      globalThis as typeof globalThis & { __API_HEALTH__?: string }
    ).__API_HEALTH__ = data.health

    const progressEntries = await Promise.all(
      data.learnerCourses.map(async (course) => {
        try {
          const progressData = await fetchGraphQL<{
            learnerCourseProgress: CourseProgress | null
          }>(
            `query LearnerCourseProgress($courseId: String!) {
              learnerCourseProgress(courseId: $courseId) {
                courseId
                courseVersionId
                completedExercises
                totalExercises
                percentComplete
                modules {
                  moduleId
                  completedExercises
                  totalExercises
                  percentComplete
                  lessons {
                    lessonId
                    completedExercises
                    totalExercises
                    percentComplete
                    exerciseAttempts {
                      exerciseId
                      attempted
                      isCorrect
                      attemptedAt
                    }
                  }
                }
              }
            }`,
            { courseId: course.id },
          )

          return [course.id, progressData.learnerCourseProgress] as const
        } catch {
          return [course.id, null] as const
        }
      }),
    )

    return {
      apiHealth: data.health,
      courses: data.learnerCourses,
      catalogCourses,
      progressByCourseId: Object.fromEntries(
        progressEntries.filter((entry): entry is [string, CourseProgress] =>
          Boolean(entry[1]),
        ),
      ),
    }
  } catch {
    return {
      apiHealth: cachedHealth ?? 'unreachable',
      courses: [],
      catalogCourses: [],
      progressByCourseId: {},
    }
  }
}

export const Route = createFileRoute('/learn')({
  beforeLoad: async ({ location }) => {
    await requireWebSession(location.pathname)
  },
  loader: loadLandingData,
  component: LearnerHomeRoute,
})

function LearnerHomeRoute() {
  const data = Route.useLoaderData() as LoaderData
  return (
    <LearnerHome
      apiHealth={data.apiHealth}
      courses={data.courses}
      catalogCourses={data.catalogCourses}
      progressByCourseId={data.progressByCourseId}
    />
  )
}
