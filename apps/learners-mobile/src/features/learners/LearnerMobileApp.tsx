import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useTranslation } from 'react-i18next'
import { tokens } from '@app/shared-tokens'
import { fetchGraphQL } from '../../shared/api/graphql'
import { useMobileAuth } from '../auth/MobileAuthProvider'
import type { CatalogCourse, Course, Lesson } from './course/types'
import { LessonView } from './course/LessonView'
import { LearnerHome } from './home/LearnerHome'

type ScreenState =
  | { name: 'home' }
  | { name: 'lesson'; courseId: string; lessonId: string }

const coursesQuery = `query Courses {
  learnerCourses {
    id
    title
    description
    priceCents
    currency
    isPaid
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
        }
      }
    }
  }
  publicCourses {
    id
    slug
    title
    description
    priceCents
    currency
    isPaid
  }
}`

function findLesson(courses: Course[], courseId: string, lessonId: string) {
  const course = courses.find((item) => item.id === courseId)
  const lesson = course?.modules
    .flatMap((module) => module.lessons)
    .find((item) => item.id === lessonId)
  return lesson
}

export function LearnerMobileApp() {
  const { t } = useTranslation()
  const auth = useMobileAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [catalogCourses, setCatalogCourses] = useState<CatalogCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null)
  const [purchasingCourseId, setPurchasingCourseId] = useState<string | null>(
    null,
  )
  const [screen, setScreen] = useState<ScreenState>({ name: 'home' })

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGraphQL<{
        learnerCourses: Course[]
        publicCourses: CatalogCourse[]
      }>(coursesQuery)
      setCourses(data.learnerCourses)
      setCatalogCourses(data.publicCourses)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const selectedLesson = useMemo<Lesson | null>(() => {
    if (screen.name !== 'lesson') return null
    return findLesson(courses, screen.courseId, screen.lessonId) ?? null
  }, [courses, screen])

  useEffect(() => {
    void loadCourses()
  }, [loadCourses])

  const pollEnrollmentStatus = useCallback(
    async (courseId: string) => {
      setPendingCourseId(courseId)
      setStatusMessage(t('mobile.learners.pending'))
      setPurchaseError(null)

      for (let attempt = 0; attempt < 20; attempt += 1) {
        try {
          const data = await fetchGraphQL<{
            courseEnrollmentStatus: {
              enrolled: boolean
              status?: string | null
            }
          }>(
            `query CourseEnrollmentStatus($courseId: String!) {
              courseEnrollmentStatus(courseId: $courseId) {
                enrolled
                status
              }
            }`,
            { courseId },
          )

          if (data.courseEnrollmentStatus.enrolled) {
            setPendingCourseId(null)
            setStatusMessage(t('purchase.success.enrolled'))
            await loadCourses()
            return
          }
        } catch {
          setPurchaseError(t('mobile.learners.purchaseFailed'))
          setPendingCourseId(null)
          return
        }

        await new Promise((resolve) => {
          setTimeout(resolve, 2000)
        })
      }

      setPendingCourseId(null)
      setStatusMessage(t('mobile.learners.purchaseTimeout'))
    },
    [loadCourses, t],
  )

  useEffect(() => {
    function handleUrl(url: string) {
      const parsed = Linking.parse(url)
      const path = [parsed.hostname, parsed.path]
        .filter(Boolean)
        .join('/')
        .replace(/^\/+/, '')
      const courseId =
        typeof parsed.queryParams?.courseId === 'string'
          ? parsed.queryParams.courseId
          : null

      if (path === 'purchase/success' && courseId) {
        void pollEnrollmentStatus(courseId)
        return
      }

      if (path === 'purchase/cancel') {
        setPendingCourseId(null)
        setStatusMessage(t('mobile.learners.purchaseCancelled'))
      }
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url)
    })

    void Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [pollEnrollmentStatus, t])

  const handleEnrollFree = useCallback(
    async (courseId: string) => {
      setPurchaseError(null)
      setStatusMessage(null)
      try {
        await fetchGraphQL<{ enrollInCourse: { id: string } }>(
          `mutation EnrollInCourse($courseId: String!) {
            enrollInCourse(courseId: $courseId) {
              id
            }
          }`,
          { courseId },
        )
        await loadCourses()
      } catch {
        setPurchaseError(t('catalog.detail.enrollError'))
      }
    },
    [loadCourses, t],
  )

  const handleBuyCourse = useCallback(
    async (courseId: string) => {
      setPurchasingCourseId(courseId)
      setPurchaseError(null)
      setStatusMessage(null)
      try {
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
            channel: 'MOBILE',
          },
        )

        await WebBrowser.openBrowserAsync(data.createCourseCheckoutSession.url)
      } catch {
        setPurchaseError(t('mobile.learners.purchaseFailed'))
      } finally {
        setPurchasingCourseId(null)
      }
    },
    [t],
  )

  if (loading && courses.length === 0 && catalogCourses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={tokens.color.primary} />
        <Text style={styles.loadingText}>{t('mobile.learners.loading')}</Text>
      </View>
    )
  }

  if (screen.name === 'lesson') {
    if (!selectedLesson) {
      return (
        <View style={styles.missingContainer}>
          <Text style={styles.missingText}>
            {t('learners.lesson.notFound')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setScreen({ name: 'home' })}
          >
            <Text style={styles.missingAction}>
              {t('mobile.learners.back')}
            </Text>
          </Pressable>
        </View>
      )
    }

    return (
      <View style={styles.root}>
        <View style={styles.authBar}>
          <Text style={styles.authLabel} numberOfLines={1}>
            {t('auth.signedInAs', {
              email: auth.user?.email ?? t('auth.userFallback'),
            })}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void auth.signOut()}
            testID="mobile-auth-logout"
          >
            <Text style={styles.authLogout}>{t('auth.logout')}</Text>
          </Pressable>
        </View>
        <LessonView
          lesson={selectedLesson}
          onBack={() => setScreen({ name: 'home' })}
        />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <View style={styles.authBar}>
        <Text style={styles.authLabel} numberOfLines={1}>
          {t('auth.signedInAs', {
            email: auth.user?.email ?? t('auth.userFallback'),
          })}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void auth.signOut()}
          testID="mobile-auth-logout"
        >
          <Text style={styles.authLogout}>{t('auth.logout')}</Text>
        </Pressable>
      </View>

      <LearnerHome
        courses={courses}
        catalogCourses={catalogCourses}
        loading={loading}
        error={error}
        purchaseError={purchaseError}
        statusMessage={statusMessage}
        pendingCourseId={pendingCourseId}
        purchasingCourseId={purchasingCourseId}
        onRetry={loadCourses}
        onEnrollFree={handleEnrollFree}
        onBuyCourse={handleBuyCourse}
        onSelectLesson={(courseId, lessonId) =>
          setScreen({ name: 'lesson', courseId, lessonId })
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.background,
  },
  authBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
  },
  authLabel: {
    flex: 1,
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
    marginRight: tokens.spacing.sm,
  },
  authLogout: {
    color: tokens.color.accent,
    fontSize: tokens.font.size.sm,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.color.background,
    gap: tokens.spacing.md,
  },
  loadingText: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.md,
  },
  missingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
    backgroundColor: tokens.color.background,
  },
  missingText: {
    color: tokens.color.text,
    fontSize: tokens.font.size.md,
    marginBottom: tokens.spacing.md,
    textAlign: 'center',
  },
  missingAction: {
    color: tokens.color.accent,
    fontSize: tokens.font.size.md,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
})
