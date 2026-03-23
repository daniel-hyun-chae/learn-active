import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@app/shared-ui'
import { useAuth } from '../features/auth/AuthProvider'
import { fetchGraphQL } from '../shared/api/graphql'
import { LessonView } from '../features/learners/course/LessonView'
import type { Course, Lesson } from '../features/learners/course/types'

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
  modules?: Array<{
    id: string
    title: string
    order: number
    lessons: Array<{
      id: string
      title: string
      order: number
      contents: Array<{
        id: string
        type: 'TEXT' | 'IMAGE'
        text?: string
        imageUrl?: string
        imageAlt?: string
      }>
      contentPages: Array<{
        id: string
        title: string
        order: number
        contents: Array<{
          id: string
          type: 'TEXT' | 'IMAGE'
          text?: string
          imageUrl?: string
          imageAlt?: string
        }>
      }>
      exercises: Array<{
        id: string
        type: 'FILL_IN_THE_BLANK' | 'MULTIPLE_CHOICE' | 'REORDERING'
        title: string
        instructions?: string
        fillInBlank?: {
          steps: Array<{
            id: string
            order: number
            prompt: string
            threadId: string
            threadTitle?: string
            segments: Array<{
              type: 'TEXT' | 'BLANK'
              text?: string
              blankId?: string
            }>
            blanks: Array<{
              id: string
              correct: string
              variant: 'TYPING' | 'OPTIONS'
              options?: string[]
            }>
          }>
        }
        multipleChoice?: {
          question: string
          allowsMultiple: boolean
          choices: Array<{
            id: string
            order: number
            text: string
            isCorrect: boolean
          }>
        }
        reordering?: {
          prompt: string
          items: Array<{
            id: string
            order: number
            text: string
            isDistractor: boolean
          }>
        }
      }>
    }>
  }>
  ownerDisplayName?: string
}

type PreviewLoaderData = {
  publicPreviewCourse: Course | null
}

type PublicCourseModule = NonNullable<PublicCourse['modules']>[number]
type PublicCourseLesson = PublicCourseModule['lessons'][number]

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
          categoryIds
          tags
          languageCode
          previewLessonId
          enrollmentCount
          popularityScore
          modules {
            id
            title
            order
            lessons {
              id
              title
              order
              contents {
                id
                type
                text
                imageUrl
                imageAlt
              }
              contentPages {
                id
                title
                order
                contents {
                  id
                  type
                  text
                  imageUrl
                  imageAlt
                }
              }
              exercises {
                id
                type
                title
                instructions
                fillInBlank {
                  steps {
                    id
                    order
                    prompt
                    threadId
                    threadTitle
                    segments {
                      type
                      text
                      blankId
                    }
                    blanks {
                      id
                      correct
                      variant
                      options
                    }
                  }
                }
                multipleChoice {
                  question
                  allowsMultiple
                  choices {
                    id
                    order
                    text
                    isCorrect
                  }
                }
                reordering {
                  prompt
                  items {
                    id
                    order
                    text
                    isDistractor
                  }
                }
              }
            }
          }
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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLessonFromApi, setPreviewLessonFromApi] =
    useState<Lesson | null>(null)
  const previewLesson = useMemo<Lesson | null>(() => {
    if (!publicCourse?.previewLessonId) {
      return null
    }

    return (
      publicCourse.modules
        ?.flatMap((module: PublicCourseModule) => module.lessons)
        .find(
          (lesson: PublicCourseLesson) =>
            lesson.id === publicCourse.previewLessonId,
        ) ?? null
    )
  }, [publicCourse])

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

  async function handleOpenPreview() {
    if (!publicCourse.previewLessonId) {
      return
    }

    if (previewOpen) {
      setPreviewOpen(false)
      return
    }

    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const data = await fetchGraphQL<PreviewLoaderData>(
        `query PublicPreviewCourse($slug: String!) {
          publicPreviewCourse(slug: $slug) {
            id
            versionId
            title
            description
            previewLessonId
            modules {
              id
              title
              order
              lessons {
                id
                title
                order
                contents {
                  id
                  type
                  text
                  imageUrl
                  imageAlt
                }
                contentPages {
                  id
                  title
                  order
                  contents {
                    id
                    type
                    text
                    imageUrl
                    imageAlt
                  }
                }
                exercises {
                  id
                  type
                  title
                  instructions
                  fillInBlank {
                    steps {
                      id
                      order
                      prompt
                      threadId
                      threadTitle
                      segments {
                        type
                        text
                        blankId
                      }
                      blanks {
                        id
                        correct
                        variant
                        options
                      }
                    }
                  }
                  multipleChoice {
                    question
                    allowsMultiple
                    choices {
                      id
                      order
                      text
                      isCorrect
                    }
                  }
                  reordering {
                    prompt
                    items {
                      id
                      order
                      text
                      isDistractor
                    }
                  }
                }
              }
            }
          }
        }`,
        { slug: publicCourse.slug },
      )

      const previewCourse = data.publicPreviewCourse
      if (!previewCourse?.previewLessonId) {
        setPreviewLessonFromApi(null)
      } else {
        setPreviewLessonFromApi(
          previewCourse.modules
            .flatMap((module) => module.lessons)
            .find((lesson) => lesson.id === previewCourse.previewLessonId) ??
            null,
        )
      }
      setPreviewOpen(true)
    } catch {
      setPreviewError(t('catalog.detail.previewUnavailable'))
      setPreviewOpen(true)
    } finally {
      setPreviewLoading(false)
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
        {t('catalog.enrollmentCount', {
          count: publicCourse.enrollmentCount ?? 0,
        })}
      </p>
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

      {publicCourse.modules?.length ? (
        <section style={{ marginTop: 16 }}>
          <h3>{t('catalog.detail.structureTitle')}</h3>
          <ol>
            {[...publicCourse.modules]
              .sort((a, b) => a.order - b.order)
              .map((module) => (
                <li key={module.id}>
                  <strong>{module.title}</strong>
                  <ol>
                    {[...module.lessons]
                      .sort((a, b) => a.order - b.order)
                      .map((lesson) => (
                        <li key={lesson.id}>
                          {lesson.title}
                          {publicCourse.previewLessonId === lesson.id ? (
                            <span>
                              {' '}
                              ({t('catalog.detail.previewLessonBadge')})
                            </span>
                          ) : null}
                        </li>
                      ))}
                  </ol>
                </li>
              ))}
          </ol>
          {publicCourse.previewLessonId ? (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  void handleOpenPreview()
                }}
              >
                {previewOpen
                  ? t('catalog.detail.closePreview')
                  : t('catalog.detail.openPreview')}
              </button>
              {previewOpen ? (
                <div style={{ marginTop: 8 }}>
                  <p className="muted">
                    {t('catalog.detail.previewNotPersisted')}
                  </p>
                  {previewLoading ? (
                    <p className="muted">
                      {t('catalog.detail.previewLoading')}
                    </p>
                  ) : previewError ? (
                    <p className="muted">{previewError}</p>
                  ) : (previewLessonFromApi ?? previewLesson) ? (
                    <LessonView
                      lesson={(previewLessonFromApi ?? previewLesson)!}
                      selection={{ type: 'summary' }}
                    />
                  ) : (
                    <p className="muted">
                      {t('catalog.detail.previewUnavailable')}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
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
