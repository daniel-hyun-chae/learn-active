import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { tokens } from '@app/shared-tokens'
import { fetchGraphQL } from '../../shared/api/graphql'
import { useMobileAuth } from '../auth/MobileAuthProvider'
import type { Course, Lesson } from './course/types'
import { LessonView } from './course/LessonView'
import { LearnerHome } from './home/LearnerHome'

type ScreenState =
  | { name: 'home' }
  | { name: 'lesson'; courseId: string; lessonId: string }

const coursesQuery = `query Courses {
  courses {
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
      }
    }
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [screen, setScreen] = useState<ScreenState>({ name: 'home' })

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchGraphQL<{ courses: Course[] }>(coursesQuery)
      setCourses(data.courses)
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

  if (loading && courses.length === 0) {
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
        loading={loading}
        error={error}
        onRetry={loadCourses}
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
