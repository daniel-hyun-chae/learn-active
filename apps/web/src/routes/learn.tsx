import { createFileRoute } from '@tanstack/react-router'
import { LearnerHome } from '../features/learners/home/LearnerHome'
import type { CourseProgress } from '../features/learners/course/types'
import { requireWebSession } from '../features/auth/route-guard'
import { fetchGraphQL } from '../shared/api/graphql'

type LoaderData = {
  apiHealth: string
  courses: Array<{
    id: string
    versionId: string
    title: string
    description: string
    modules: Array<{
      id: string
      lessons: Array<{ id: string }>
    }>
  }>
  progressByCourseId: Record<string, CourseProgress>
}

async function loadLandingData(): Promise<LoaderData> {
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
          modules {
            id
            lessons { id }
          }
        }
      }`,
    )

    ;(
      globalThis as typeof globalThis & { __API_HEALTH__?: string }
    ).__API_HEALTH__ = data.health

    const progressEntries = await Promise.all(
      data.learnerCourses.map(async (course) => {
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
      }),
    )

    return {
      apiHealth: data.health,
      courses: data.learnerCourses,
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
      progressByCourseId={data.progressByCourseId}
    />
  )
}
