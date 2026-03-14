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
  priceCents?: number | null
  currency: string
  isPaid: boolean
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
          priceCents
          currency
          isPaid
          ownerDisplayName
        }
      }`,
      { slug },
    )
  },
  component: PublicCourseDetailRoute,
})

function formatPrice(priceCents: number | null | undefined, currency: string) {
  if (typeof priceCents !== 'number' || priceCents <= 0) {
    return null
  }

  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(priceCents / 100)
}

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
      if (publicCourse.isPaid) {
        const data = await fetchGraphQL<{
          createCourseCheckoutSession: { url: string; sessionId: string }
        }>(
          `mutation CreateCourseCheckoutSession($courseId: String!, $channel: CheckoutChannel!) {
            createCourseCheckoutSession(courseId: $courseId, channel: $channel) {
              url
              sessionId
            }
          }`,
          {
            courseId: publicCourse.id,
            channel: 'WEB',
          },
        )

        window.location.assign(data.createCourseCheckoutSession.url)
        return
      }

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
      setError(
        publicCourse.isPaid
          ? t('catalog.detail.checkoutError')
          : t('catalog.detail.enrollError'),
      )
    }
  }

  return (
    <section>
      <Link to="/courses" className="course-link">
        {t('catalog.detail.back')}
      </Link>
      <h2>{publicCourse.title}</h2>
      <p className="muted">{publicCourse.description}</p>
      <p className="muted">
        {publicCourse.isPaid
          ? t('catalog.price', {
              price:
                formatPrice(publicCourse.priceCents, publicCourse.currency) ??
                `${publicCourse.priceCents ?? 0} ${publicCourse.currency.toUpperCase()}`,
            })
          : t('catalog.free')}
      </p>
      {publicCourse.ownerDisplayName ? (
        <p className="muted">
          {t('catalog.ownerLabel', { name: publicCourse.ownerDisplayName })}
        </p>
      ) : null}

      {auth.status === 'authenticated' ? (
        <PrimaryButton type="button" onClick={() => void handleEnroll()}>
          {publicCourse.isPaid ? t('catalog.buy') : t('catalog.enroll')}
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
