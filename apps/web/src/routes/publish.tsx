import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton, Surface } from '@app/shared-ui'
import { requireWebSession } from '../features/auth/route-guard'
import {
  fetchGraphQL,
  setGraphQLAccessTokenProvider,
} from '../shared/api/graphql'
import {
  emptyCourse,
  toCourseInput,
} from '../features/publishers/publisher-utils'

type CourseSummary = {
  id: string
  title: string
  description: string
}

type LoaderData = {
  publisherCourses: CourseSummary[]
}

export const Route = createFileRoute('/publish')({
  beforeLoad: async ({ location }) => {
    await requireWebSession(location.pathname)
  },
  loader: async (): Promise<LoaderData> => {
    const session = await requireWebSession('/publish')
    setGraphQLAccessTokenProvider(async () => session?.access_token ?? null)

    const data = await fetchGraphQL<LoaderData>(`query PublisherCoursesLanding {
      publisherCourses {
        id
        title
        description
      }
    }`)
    return data
  },
  component: PublisherLandingRoute,
})

function PublisherLandingRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const data = Route.useLoaderData() as LoaderData
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')

  const showLanding =
    location.pathname === '/publish' || location.pathname === '/publish/'

  if (!showLanding) {
    return <Outlet />
  }

  async function handleCreateCourse() {
    setStatus('saving')
    try {
      const draft = emptyCourse(t)
      const input = toCourseInput({
        ...draft,
        title: '',
        description: '',
      })
      const result = await fetchGraphQL<{
        upsertCourse: { id: string; title: string; description: string }
      }>(
        `mutation CreateCourse($input: CourseInput!) {
          upsertCourse(input: $input) {
            id
            title
            description
            categoryIds
            tags
            languageCode
            previewLessonId
          }
        }`,
        { input },
      )
      await navigate({
        to: '/publish/$courseId',
        params: { courseId: result.upsertCourse.id },
      })
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="publisher-home" data-test="publisher-landing">
      <div className="publisher-header">
        <div>
          <h2>{t('publishers.home.title')}</h2>
          <p className="muted">{t('publishers.home.subtitle')}</p>
        </div>
        <PrimaryButton
          type="button"
          data-test="publisher-create-course"
          onClick={handleCreateCourse}
        >
          {t('publishers.home.createCourse')}
        </PrimaryButton>
      </div>

      {status === 'error' ? (
        <p className="status-error">{t('publishers.status.errorGeneric')}</p>
      ) : null}

      <div className="course-grid">
        {data.publisherCourses.map((course: CourseSummary) => (
          <Surface key={course.id} data-test="publisher-course-card">
            <div className="course-card">
              <div>
                <h3>{course.title || t('publishers.course.untitled')}</h3>
                <p className="muted">{course.description}</p>
              </div>
              <Link
                to="/publish/$courseId"
                params={{ courseId: course.id }}
                className="course-link"
                data-test="publisher-enter-course"
              >
                {t('publishers.home.enterCourse')}
              </Link>
            </div>
          </Surface>
        ))}
      </div>

      {data.publisherCourses.length === 0 ? (
        <p className="muted">{t('publishers.home.empty')}</p>
      ) : null}
    </section>
  )
}
