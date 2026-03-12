import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton, Surface } from '@app/shared-ui'
import { useAuth } from '../features/auth/AuthProvider'
import { fetchGraphQL } from '../shared/api/graphql'

type PublicCourse = {
  id: string
  slug: string
  title: string
  description: string
  ownerDisplayName?: string
}

type LoaderData = {
  publicCourses: PublicCourse[]
}

export const Route = createFileRoute('/courses')({
  loader: async (): Promise<LoaderData> => {
    return await fetchGraphQL<LoaderData>(`query PublicCourses {
      publicCourses {
        id
        slug
        title
        description
        ownerDisplayName
      }
    }`)
  },
  component: CoursesCatalogRoute,
})

function CoursesCatalogRoute() {
  const { t } = useTranslation()
  const auth = useAuth()
  const { publicCourses } = Route.useLoaderData()
  const [error, setError] = useState<string | null>(null)

  async function handleEnroll(courseId: string) {
    if (auth.status !== 'authenticated') {
      return
    }

    try {
      await fetchGraphQL<{ enrollInCourse: { id: string } }>(
        `mutation EnrollInCourse($courseId: String!) {
          enrollInCourse(courseId: $courseId) {
            id
          }
        }`,
        { courseId },
      )
      setError(null)
    } catch {
      setError(t('catalog.detail.enrollError'))
    }
  }

  return (
    <section>
      <h2>{t('catalog.title')}</h2>
      <p className="muted">{t('catalog.subtitle')}</p>
      {error ? <p className="status-error">{error}</p> : null}

      <div className="course-grid" style={{ marginTop: 16 }}>
        {publicCourses.map((course: PublicCourse) => (
          <Surface key={course.id}>
            <div className="course-card">
              <div>
                <h3>{course.title}</h3>
                <p className="muted">{course.description}</p>
                {course.ownerDisplayName ? (
                  <p className="muted">
                    {t('catalog.ownerLabel', { name: course.ownerDisplayName })}
                  </p>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Link
                  to="/courses/$slug"
                  params={{ slug: course.slug }}
                  className="course-link"
                >
                  {t('catalog.open')}
                </Link>
                {auth.status === 'authenticated' ? (
                  <PrimaryButton
                    type="button"
                    onClick={() => void handleEnroll(course.id)}
                  >
                    {t('catalog.enroll')}
                  </PrimaryButton>
                ) : null}
              </div>
            </div>
          </Surface>
        ))}
      </div>

      {publicCourses.length === 0 ? (
        <p className="muted">{t('catalog.empty')}</p>
      ) : null}
    </section>
  )
}
