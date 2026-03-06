import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { tokens } from '@app/shared-tokens'
import { quizAttemptStore } from '../../../shared/offline/quizAttemptStore'
import type { Course } from '../course/types'

type LearnerHomeProps = {
  courses: Course[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onSelectLesson: (courseId: string, lessonId: string) => void
}

function getFirstLessonId(course: Course) {
  const modules = [...course.modules].sort((a, b) => a.order - b.order)
  const lessons = modules.flatMap((module) =>
    [...module.lessons].sort((a, b) => a.order - b.order),
  )
  return lessons[0]?.id
}

export function LearnerHome({
  courses,
  loading,
  error,
  onRetry,
  onSelectLesson,
}: LearnerHomeProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState('')

  function createAttemptId() {
    return globalThis.crypto?.randomUUID?.() ?? `attempt-${Date.now()}`
  }

  async function handleStartOffline() {
    const attemptId = createAttemptId()
    await quizAttemptStore.save({
      attemptId,
      quizId: 'demo-quiz',
      answers: {},
      startedAt: new Date().toISOString(),
    })
    setStatus(t('mobile.learners.statusSaved'))
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      accessibilityLabel={t('learners.courses.title')}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('mobile.learners.title')}</Text>
        <Text style={styles.subtitle}>{t('mobile.learners.subtitle')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={handleStartOffline}
          style={({ pressed }) => [
            styles.offlineButton,
            pressed && styles.offlineButtonPressed,
          ]}
        >
          <Text style={styles.offlineLabel}>{t('mobile.learners.cta')}</Text>
        </Pressable>
        {status ? <Text style={styles.offlineStatus}>{status}</Text> : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('learners.courses.title')}</Text>
        <Text style={styles.sectionSubtitle}>
          {t('learners.courses.subtitle')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={tokens.color.primary} />
          <Text style={styles.loadingText}>{t('mobile.learners.loading')}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{t('mobile.learners.error')}</Text>
          <Text style={styles.errorDetails}>
            {t('mobile.learners.errorDetails')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Text style={styles.retryLabel}>{t('mobile.learners.retry')}</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && courses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('learners.courses.empty')}</Text>
        </View>
      ) : null}

      <View style={styles.courseGrid}>
        {courses.map((course) => {
          const lessonId = getFirstLessonId(course)
          return (
            <View key={course.id} style={styles.courseCard}>
              <Text style={styles.courseLanguage}>{course.language}</Text>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseDescription}>{course.description}</Text>
              <Pressable
                accessibilityRole="button"
                disabled={!lessonId}
                onPress={() => lessonId && onSelectLesson(course.id, lessonId)}
                style={({ pressed }) => [
                  styles.startButton,
                  pressed && styles.startButtonPressed,
                  !lessonId && styles.startButtonDisabled,
                ]}
              >
                <Text style={styles.startLabel}>
                  {t('learners.courses.start')}
                </Text>
              </Pressable>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.lg,
    backgroundColor: tokens.color.background,
  },
  header: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  title: {
    fontSize: tokens.font.size.xl,
    fontWeight: String(tokens.font.weight.bold) as '700',
    color: tokens.color.text,
  },
  subtitle: {
    fontSize: tokens.font.size.md,
    color: tokens.color.muted,
  },
  offlineButton: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.primary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
  },
  offlineButtonPressed: {
    opacity: tokens.opacity.pressed,
  },
  offlineLabel: {
    color: tokens.color.text,
    fontWeight: String(tokens.font.weight.medium) as '500',
    fontSize: tokens.font.size.sm,
  },
  offlineStatus: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  sectionHeader: {
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.xs,
  },
  sectionTitle: {
    fontSize: tokens.font.size.lg,
    fontWeight: String(tokens.font.weight.bold) as '700',
    color: tokens.color.text,
  },
  sectionSubtitle: {
    fontSize: tokens.font.size.sm,
    color: tokens.color.muted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  loadingText: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  errorCard: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  errorText: {
    color: tokens.color.text,
    fontSize: tokens.font.size.md,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  errorDetails: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.primary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
  },
  retryButtonPressed: {
    opacity: tokens.opacity.pressed,
  },
  retryLabel: {
    color: tokens.color.text,
    fontWeight: String(tokens.font.weight.medium) as '500',
    fontSize: tokens.font.size.sm,
  },
  emptyCard: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    marginBottom: tokens.spacing.md,
  },
  emptyText: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  courseGrid: {
    gap: tokens.spacing.md,
  },
  courseCard: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    gap: tokens.spacing.xs,
  },
  courseLanguage: {
    textTransform: 'uppercase',
    fontSize: tokens.font.size.sm,
    color: tokens.color.accent,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  courseTitle: {
    fontSize: tokens.font.size.lg,
    fontWeight: String(tokens.font.weight.bold) as '700',
    color: tokens.color.text,
  },
  courseDescription: {
    fontSize: tokens.font.size.sm,
    color: tokens.color.muted,
    marginBottom: tokens.spacing.sm,
  },
  startButton: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.primary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
  },
  startButtonPressed: {
    opacity: tokens.opacity.pressed,
  },
  startButtonDisabled: {
    opacity: tokens.opacity.disabled,
  },
  startLabel: {
    color: tokens.color.text,
    fontWeight: String(tokens.font.weight.medium) as '500',
    fontSize: tokens.font.size.sm,
  },
})
