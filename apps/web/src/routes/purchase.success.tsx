import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@app/shared-ui'
import {
  getActiveWebSession,
  requireWebSession,
} from '../features/auth/route-guard'
import {
  fetchGraphQL,
  setGraphQLAccessTokenProvider,
} from '../shared/api/graphql'

type EnrollmentStatusResponse = {
  courseEnrollmentStatus: {
    enrolled: boolean
    status?: string | null
  }
}

export const Route = createFileRoute('/purchase/success')({
  validateSearch: (search: Record<string, unknown>) => ({
    courseId: typeof search.courseId === 'string' ? search.courseId : '',
  }),
  beforeLoad: async ({ location }) => {
    await requireWebSession(`${location.pathname}${location.search}`)
  },
  component: PurchaseSuccessRoute,
})

function PurchaseSuccessRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { courseId } = Route.useSearch()
  const [enrolled, setEnrolled] = useState(false)
  const [polling, setPolling] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) {
      setPolling(false)
      return
    }

    let cancelled = false
    let attempts = 0

    async function pollStatus() {
      attempts += 1
      try {
        const session = await getActiveWebSession()
        setGraphQLAccessTokenProvider(async () => session?.access_token ?? null)

        const data = await fetchGraphQL<EnrollmentStatusResponse>(
          `query CourseEnrollmentStatus($courseId: String!) {
            courseEnrollmentStatus(courseId: $courseId) {
              enrolled
              status
            }
          }`,
          { courseId },
        )

        if (cancelled) {
          return
        }

        if (data.courseEnrollmentStatus.enrolled) {
          setEnrolled(true)
          setPolling(false)
          setError(null)
          return
        }

        if (attempts >= 20) {
          setPolling(false)
          setError(t('mobile.learners.purchaseTimeout'))
          return
        }
      } catch {
        if (!cancelled) {
          setError(t('catalog.detail.checkoutError'))
          setPolling(false)
        }
      }

      if (!cancelled) {
        window.setTimeout(() => {
          void pollStatus()
        }, 2000)
      }
    }

    void pollStatus()

    return () => {
      cancelled = true
    }
  }, [courseId, t])

  const subtitle = useMemo(() => {
    if (!courseId) {
      return t('purchase.success.noCourse')
    }
    if (enrolled) {
      return t('purchase.success.enrolled')
    }
    return t('purchase.success.subtitle')
  }, [courseId, enrolled, t])

  return (
    <section>
      <h2>{t('purchase.success.title')}</h2>
      <p className="muted">{subtitle}</p>

      {polling && !enrolled ? (
        <p className="muted">{t('catalog.detail.purchasePending')}</p>
      ) : null}

      {error ? <p className="status-error">{error}</p> : null}

      {enrolled ? (
        <PrimaryButton
          type="button"
          onClick={() =>
            void navigate({
              to: '/my-courses',
            })
          }
        >
          {t('purchase.success.openMyCourses')}
        </PrimaryButton>
      ) : null}
    </section>
  )
}
