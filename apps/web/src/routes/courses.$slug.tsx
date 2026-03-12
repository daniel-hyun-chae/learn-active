import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@app/shared-ui'
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
  publicCourse: PublicCourse | null
}

export const Route = createFileRoute('/courses/$slug')({
  loader: async ({ params }): Promise<LoaderData> => {
    const { slug } = params as { slug: string }
    return await fetchGraphQL<LoaderData>(
      `query PublicCourse($slug: String!) {
        publicCourse(slug: $slug) {
          id
          slug
          title
          description
          ownerDisplayName
        }
      }`,
      { slug },
    )
  },
  component: PublicCourseDetailRoute,
})

function PublicCourseDetailRoute() {
  const { t } = useTranslation()
  const auth = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const { publicCourse } = Route.useLoaderData()

  if (!publicCourse) {
    return (
      <section>
        <p className="muted">{t('catalog.empty')}</p>
        <Link to="/courses" className="course-link">
          {t('catalog.detail.back')}
        </Link>
      </section>
    )
  }

  async function handleEnroll() {
    if (auth.status !== 'authenticated') {
      await navigate({
        to: '/auth',
        search: { returnTo: `/courses/${publicCourse.slug}` },
      })
      return
    }

    try {
      await fetchGraphQL<{ enrollInCourse: { id: string } }>(
        `mutation EnrollInCourse($courseId: String!) {
          enrollInCourse(courseId: $courseId) {
            id
          }
        }`,
        { courseId: publicCourse.id },
      )
      setError(null)
    } catch {
      setError(t('catalog.detail.enrollError'))
    }
  }

  return (
    <section>
      <Link to="/courses" className="course-link">
        {t('catalog.detail.back')}
      </Link>
      <h2>{publicCourse.title}</h2>
      <p className="muted">{publicCourse.description}</p>
      {publicCourse.ownerDisplayName ? (
        <p className="muted">
          {t('catalog.ownerLabel', { name: publicCourse.ownerDisplayName })}
        </p>
      ) : null}

      {auth.status === 'authenticated' ? (
        <PrimaryButton type="button" onClick={() => void handleEnroll()}>
          {t('catalog.enroll')}
        </PrimaryButton>
      ) : (
        <Link
          to="/auth"
          search={{ returnTo: `/courses/${publicCourse.slug}` }}
          className="course-link"
        >
          {t('catalog.detail.loginToEnroll')}
        </Link>
      )}

      {error ? <p className="status-error">{error}</p> : null}
    </section>
  )
}
