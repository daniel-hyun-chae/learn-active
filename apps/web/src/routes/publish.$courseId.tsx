import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { requireWebSession } from '../features/auth/route-guard'
import { fetchGraphQL } from '../shared/api/graphql'
import type { CourseDraft } from '../features/publishers/types'
import { PublisherHome } from '../features/publishers/PublisherHome'

type LoaderData = {
  course: CourseDraft | null
}

export const Route = createFileRoute('/publish/$courseId')({
  beforeLoad: async ({ location }) => {
    await requireWebSession(location.pathname)
  },
  staleTime: 0,
  gcTime: 0,
  shouldReload: () => true,
  loader: async ({ params }): Promise<LoaderData> => {
    const { courseId } = params as { courseId: string }
    const data = await fetchGraphQL<{ course: CourseDraft | null }>(
      `query PublisherCourse($id: String!) {
        course(id: $id) {
          id
          title
          description
          modules {
            id
            title
            order
            lessons {
              id
              title
              order
              contents { id type text imageUrl imageAlt lexicalJson }
              contentPages {
                id
                title
                order
                contents { id type text imageUrl imageAlt lexicalJson }
              }
              exercises {
                id
                type
                title
                instructions
                steps {
                  id
                  order
                  prompt
                  threadId
                  threadTitle
                  segments { type text blankId }
                  blanks { id correct variant options }
                }
              }
            }
          }
        }
      }`,
      { id: courseId },
    )
    return data
  },
  component: PublisherCourseEditorRoute,
})

function PublisherCourseEditorRoute() {
  const { t } = useTranslation()
  const data = Route.useLoaderData()

  if (!data.course) {
    return (
      <section className="publisher-home" data-test="publisher-course-missing">
        <h2>{t('publishers.course.notFoundTitle')}</h2>
        <p className="muted">{t('publishers.course.notFoundBody')}</p>
        <Link to="/publish" className="course-link">
          {t('publishers.home.backToCourses')}
        </Link>
      </section>
    )
  }

  return <PublisherHome course={data.course} />
}
