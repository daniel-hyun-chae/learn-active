import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton, Surface } from '@app/shared-ui'
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
  categoryIds?: string[]
  tags?: string[]
  languageCode?: string
  previewLessonId?: string | null
  enrollmentCount?: number
  popularityScore?: number
  ownerDisplayName?: string
}

type CatalogSearch = {
  q?: string
  category?: string
  price?: 'all' | 'free' | 'paid'
  language?: string
}

type LoaderData = {
  publicCourses: PublicCourse[]
}

export const Route = createFileRoute('/courses')({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    q: typeof search.q === 'string' ? search.q : undefined,
    category: typeof search.category === 'string' ? search.category : undefined,
    price:
      search.price === 'free' ||
      search.price === 'paid' ||
      search.price === 'all'
        ? search.price
        : 'all',
    language: typeof search.language === 'string' ? search.language : undefined,
  }),
  loader: async (): Promise<LoaderData> => {
    return await fetchGraphQL<LoaderData>(`query PublicCourses {
      publicCourses {
        id
        slug
        title
        description
        priceCents
        currency
        isPaid
        categoryIds
        tags
        languageCode
        previewLessonId
        enrollmentCount
        popularityScore
        ownerDisplayName
      }
    }`)
  },
  component: CoursesCatalogRoute,
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

function CoursesCatalogRoute() {
  const { t } = useTranslation()
  const auth = useAuth()
  const navigate = useNavigate({ from: '/courses' })
  const { publicCourses } = Route.useLoaderData()
  const search = Route.useSearch()
  const [error, setError] = useState<string | null>(null)

  const featuredCourses = useMemo(
    () =>
      [...publicCourses]
        .sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0))
        .slice(0, 3),
    [publicCourses],
  )

  const filteredCourses = useMemo(() => {
    const query = (search.q ?? '').trim().toLowerCase()
    return publicCourses.filter((course: PublicCourse) => {
      if (
        query.length > 0 &&
        !`${course.title} ${course.description}`.toLowerCase().includes(query)
      ) {
        return false
      }
      if (
        search.category &&
        !(course.categoryIds ?? []).includes(search.category)
      ) {
        return false
      }
      if (search.price === 'free' && course.isPaid) {
        return false
      }
      if (search.price === 'paid' && !course.isPaid) {
        return false
      }
      if (
        search.language &&
        (course.languageCode ?? 'en').toLowerCase() !==
          search.language.toLowerCase()
      ) {
        return false
      }
      return true
    })
  }, [publicCourses, search])

  const availableCategories = useMemo(() => {
    const values = new Set<string>()
    for (const course of publicCourses) {
      for (const categoryId of course.categoryIds ?? []) {
        values.add(categoryId)
      }
    }
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [publicCourses])

  const availableLanguages = useMemo(() => {
    const values = new Set<string>()
    for (const course of publicCourses) {
      values.add((course.languageCode ?? 'en').toLowerCase())
    }
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [publicCourses])

  function updateSearch(partial: Partial<CatalogSearch>) {
    void navigate({
      search: {
        ...search,
        ...partial,
      },
      replace: true,
    })
  }

  async function handleEnroll(courseId: string, isPaid: boolean) {
    if (auth.status !== 'authenticated') {
      return
    }

    try {
      if (isPaid) {
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
            courseId,
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
        { courseId },
      )
      setError(null)
    } catch {
      setError(
        isPaid
          ? t('catalog.detail.checkoutError')
          : t('catalog.detail.enrollError'),
      )
    }
  }

  return (
    <section>
      <h2>{t('catalog.title')}</h2>
      <p className="muted">{t('catalog.subtitle')}</p>
      {error ? <p className="status-error">{error}</p> : null}

      <div style={{ display: 'grid', gap: 8, marginTop: 12, marginBottom: 12 }}>
        <input
          type="search"
          value={search.q ?? ''}
          onChange={(event) =>
            updateSearch({ q: event.target.value || undefined })
          }
          placeholder={t('catalog.searchPlaceholder')}
          aria-label={t('catalog.searchPlaceholder')}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={search.category ?? ''}
            onChange={(event) =>
              updateSearch({ category: event.target.value || undefined })
            }
            aria-label={t('catalog.filter.category')}
          >
            <option value="">{t('catalog.filter.anyCategory')}</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={search.price ?? 'all'}
            onChange={(event) =>
              updateSearch({
                price: event.target.value as CatalogSearch['price'],
              })
            }
            aria-label={t('catalog.filter.price')}
          >
            <option value="all">{t('catalog.filter.anyPrice')}</option>
            <option value="free">{t('catalog.filter.freeOnly')}</option>
            <option value="paid">{t('catalog.filter.paidOnly')}</option>
          </select>

          <select
            value={search.language ?? ''}
            onChange={(event) =>
              updateSearch({ language: event.target.value || undefined })
            }
            aria-label={t('catalog.filter.language')}
          >
            <option value="">{t('catalog.filter.anyLanguage')}</option>
            {availableLanguages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
      </div>

      {featuredCourses.length > 0 ? (
        <>
          <h3>{t('catalog.featured.title')}</h3>
          <div
            className="course-grid"
            style={{ marginTop: 8, marginBottom: 12 }}
          >
            {featuredCourses.map((course) => (
              <Surface key={`featured-${course.id}`}>
                <div className="course-card">
                  <div>
                    <h3>{course.title}</h3>
                    <p className="muted">{course.description}</p>
                    <p className="muted">
                      {t('catalog.enrollmentCount', {
                        count: course.enrollmentCount ?? 0,
                      })}
                    </p>
                  </div>
                  <Link
                    to="/courses/$slug"
                    params={{ slug: course.slug }}
                    className="course-link"
                  >
                    {t('catalog.open')}
                  </Link>
                </div>
              </Surface>
            ))}
          </div>
        </>
      ) : null}

      <div className="course-grid" style={{ marginTop: 16 }}>
        {filteredCourses.map((course: PublicCourse) => (
          <Surface key={course.id}>
            <div className="course-card">
              <div>
                <h3>{course.title}</h3>
                <p className="muted">{course.description}</p>
                <p className="muted">
                  {t('catalog.enrollmentCount', {
                    count: course.enrollmentCount ?? 0,
                  })}
                </p>
                <p className="muted">
                  {course.isPaid
                    ? t('catalog.price', {
                        price:
                          formatPrice(course.priceCents, course.currency) ??
                          `${course.priceCents ?? 0} ${course.currency.toUpperCase()}`,
                      })
                    : t('catalog.free')}
                </p>
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
                    onClick={() => void handleEnroll(course.id, course.isPaid)}
                  >
                    {course.isPaid ? t('catalog.buy') : t('catalog.enroll')}
                  </PrimaryButton>
                ) : null}
              </div>
            </div>
          </Surface>
        ))}
      </div>

      {filteredCourses.length === 0 ? (
        <p className="muted">{t('catalog.empty')}</p>
      ) : null}
    </section>
  )
}
