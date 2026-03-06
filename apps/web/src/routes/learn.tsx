import { createFileRoute } from '@tanstack/react-router'
import { LearnerHome } from '../features/learners/home/LearnerHome'
import { fetchGraphQL } from '../shared/api/graphql'

type LoaderData = {
  apiHealth: string
  courses: Array<{
    id: string
    title: string
    description: string
    language: string
    modules: Array<{
      id: string
      lessons: Array<{ id: string }>
    }>
  }>
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
      courses: LoaderData['courses']
    }>(
      `query LandingCourses {
        health
        courses {
          id
          title
          description
          language
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
    return {
      apiHealth: data.health,
      courses: data.courses,
    }
  } catch {
    return {
      apiHealth: cachedHealth ?? 'unreachable',
      courses: [],
    }
  }
}

export const Route = createFileRoute('/learn')({
  loader: loadLandingData,
  component: LearnerHomeRoute,
})

function LearnerHomeRoute() {
  const data = Route.useLoaderData() as LoaderData
  return <LearnerHome apiHealth={data.apiHealth} courses={data.courses} />
}
