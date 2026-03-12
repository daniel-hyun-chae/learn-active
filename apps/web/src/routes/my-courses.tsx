import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Surface } from '@app/shared-ui'
import { requireWebSession } from '../features/auth/route-guard'
import {
  fetchGraphQL,
  setGraphQLAccessTokenProvider,
} from '../shared/api/graphql'

type MyCourse = {
  id: string
  slug: string
  title: string
  description: string
  version: number
  status: string
  enrolledAt: string
}

type LoaderData = {
  myCourses: MyCourse[]
}

export const Route = createFileRoute('/my-courses')({
  beforeLoad: async ({ location }) => {
    await requireWebSession(location.pathname)
  },
  loader: async (): Promise<LoaderData> => {
    const session = await requireWebSession('/my-courses')
    setGraphQLAccessTokenProvider(async () => session?.access_token ?? null)
    return await fetchGraphQL<LoaderData>(`query MyCourses {
      myCourses {
        id
        slug
        title
        description
        version
        status
        enrolledAt
      }
    }`)
  },
  component: MyCoursesRoute,
})

function MyCoursesRoute() {
  const { t } = useTranslation()
  const data = Route.useLoaderData()

  return (
    <section>
      <h2>{t('myCourses.title')}</h2>
      <p className="muted">{t('myCourses.subtitle')}</p>

      <div className="course-grid" style={{ marginTop: 16 }}>
        {data.myCourses.map((course: MyCourse) => (
          <Surface key={course.id}>
            <div className="course-card">
              <div>
                <h3>{course.title}</h3>
                <p className="muted">{course.description}</p>
                <p className="muted">
                  {t('myCourses.version', { version: course.version })}
                </p>
              </div>
              <Link to="/learn" className="course-link">
                {t('learners.courses.open')}
              </Link>
            </div>
          </Surface>
        ))}
      </div>

      {data.myCourses.length === 0 ? (
        <p className="muted">{t('myCourses.empty')}</p>
      ) : null}
    </section>
  )
}
