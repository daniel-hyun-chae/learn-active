import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { tokens } from '@app/shared-tokens'
import { quizAttemptStore } from '../../../shared/offline/quizAttemptStore'
import type { CatalogCourse, Course } from '../course/types'

type LearnerHomeProps = {
  courses: Course[]
  catalogCourses: CatalogCourse[]
  loading: boolean
  error: string | null
  purchaseError: string | null
  statusMessage: string | null
  pendingCourseId: string | null
  purchasingCourseId: string | null
  previewLoadingCourseId: string | null
  onRetry: () => void
  onEnrollFree: (courseId: string) => void
  onBuyCourse: (courseId: string) => void
  onOpenPreview: (course: CatalogCourse) => void
  onSelectLesson: (courseId: string, lessonId: string) => void
}

type DiscoveryFilters = {
  search: string
  categoryId: string
  languageCode: string
  priceFilter: 'all' | 'free' | 'paid'
}

function getFirstLessonId(course: Course) {
  const modules = [...course.modules].sort((a, b) => a.order - b.order)
  const lessons = modules.flatMap((module) =>
    [...module.lessons].sort((a, b) => a.order - b.order),
  )
  return lessons[0]?.id
}

function getResumeLessonId(course: Course) {
  return course.resumePosition?.lessonId ?? getFirstLessonId(course)
}

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

function formatRelativeAccess(value: string, locale: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - parsed.getTime()) / 60000),
  )
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return rtf.format(-diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  return rtf.format(-diffDays, 'day')
}

export function LearnerHome({
  courses,
  catalogCourses,
  loading,
  error,
  purchaseError,
  statusMessage,
  pendingCourseId,
  purchasingCourseId,
  previewLoadingCourseId,
  onRetry,
  onEnrollFree,
  onBuyCourse,
  onOpenPreview,
  onSelectLesson,
}: LearnerHomeProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState('')
  const [filters, setFilters] = useState<DiscoveryFilters>({
    search: '',
    categoryId: '',
    languageCode: '',
    priceFilter: 'all',
  })

  const locale = globalThis.navigator?.language ?? 'en'

  const enrolledByRecency = [...courses].sort((a, b) => {
    const aTime = a.resumePosition?.visitedAt
    const bTime = b.resumePosition?.visitedAt
    if (aTime && bTime) {
      return bTime.localeCompare(aTime)
    }
    if (aTime) {
      return -1
    }
    if (bTime) {
      return 1
    }
    return a.title.localeCompare(b.title)
  })

  const primaryContinueCourse = enrolledByRecency[0]
  const primaryContinueLessonId = primaryContinueCourse
    ? getResumeLessonId(primaryContinueCourse)
    : undefined

  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set(catalogCourses.flatMap((course) => course.categoryIds ?? [])),
      ).sort((a, b) => a.localeCompare(b)),
    [catalogCourses],
  )

  const availableLanguages = useMemo(
    () =>
      Array.from(
        new Set(
          catalogCourses.map((course) =>
            (course.languageCode ?? 'en').toLowerCase(),
          ),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [catalogCourses],
  )

  const filteredCatalogCourses = useMemo(
    () =>
      catalogCourses.filter((course) => {
        if (
          filters.search.trim().length > 0 &&
          !`${course.title} ${course.description}`
            .toLowerCase()
            .includes(filters.search.trim().toLowerCase())
        ) {
          return false
        }
        if (
          filters.categoryId &&
          !(course.categoryIds ?? []).includes(filters.categoryId)
        ) {
          return false
        }
        if (
          filters.languageCode &&
          (course.languageCode ?? 'en').toLowerCase() !==
            filters.languageCode.toLowerCase()
        ) {
          return false
        }
        if (filters.priceFilter === 'free' && course.isPaid) {
          return false
        }
        if (filters.priceFilter === 'paid' && !course.isPaid) {
          return false
        }
        return true
      }),
    [catalogCourses, filters],
  )

  const featuredCourses = useMemo(
    () =>
      [...catalogCourses]
        .sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0))
        .slice(0, 3),
    [catalogCourses],
  )

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

      <View style={styles.filterCard}>
        <TextInput
          accessibilityLabel={t('catalog.searchPlaceholder')}
          placeholder={t('catalog.searchPlaceholder')}
          placeholderTextColor={tokens.color.muted}
          value={filters.search}
          onChangeText={(value) =>
            setFilters((previous) => ({ ...previous, search: value }))
          }
          style={styles.filterInput}
        />
        <View style={styles.filterChipRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setFilters((previous) => ({ ...previous, priceFilter: 'all' }))
            }
            style={[
              styles.filterChip,
              filters.priceFilter === 'all' && styles.filterChipActive,
            ]}
          >
            <Text style={styles.filterChipText}>
              {t('catalog.filter.anyPrice')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setFilters((previous) => ({ ...previous, priceFilter: 'free' }))
            }
            style={[
              styles.filterChip,
              filters.priceFilter === 'free' && styles.filterChipActive,
            ]}
          >
            <Text style={styles.filterChipText}>
              {t('catalog.filter.freeOnly')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setFilters((previous) => ({ ...previous, priceFilter: 'paid' }))
            }
            style={[
              styles.filterChip,
              filters.priceFilter === 'paid' && styles.filterChipActive,
            ]}
          >
            <Text style={styles.filterChipText}>
              {t('catalog.filter.paidOnly')}
            </Text>
          </Pressable>
        </View>
        <View style={styles.filterChipRow}>
          {availableCategories.map((category) => (
            <Pressable
              key={category}
              accessibilityRole="button"
              onPress={() =>
                setFilters((previous) => ({
                  ...previous,
                  categoryId: previous.categoryId === category ? '' : category,
                }))
              }
              style={[
                styles.filterChip,
                filters.categoryId === category && styles.filterChipActive,
              ]}
            >
              <Text style={styles.filterChipText}>{category}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.filterChipRow}>
          {availableLanguages.map((languageCode) => (
            <Pressable
              key={languageCode}
              accessibilityRole="button"
              onPress={() =>
                setFilters((previous) => ({
                  ...previous,
                  languageCode:
                    previous.languageCode === languageCode ? '' : languageCode,
                }))
              }
              style={[
                styles.filterChip,
                filters.languageCode === languageCode &&
                  styles.filterChipActive,
              ]}
            >
              <Text style={styles.filterChipText}>{languageCode}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {featuredCourses.length > 0 ? (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>{t('catalog.featured.title')}</Text>
          {featuredCourses.map((course) => (
            <View key={`featured-${course.id}`} style={styles.courseCard}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseDescription}>{course.description}</Text>
              <Text style={styles.courseMeta}>
                {t('catalog.enrollmentCount', {
                  count: course.enrollmentCount ?? 0,
                })}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {primaryContinueCourse && primaryContinueLessonId ? (
        <View style={styles.courseCard}>
          <Text style={styles.sectionSubtitle}>
            {t('learners.resume.primaryLabel')}
          </Text>
          <Text style={styles.courseTitle}>{primaryContinueCourse.title}</Text>
          {primaryContinueCourse.resumePosition?.visitedAt ? (
            <Text style={styles.courseMeta}>
              {t('learners.resume.lastAccessed', {
                value:
                  formatRelativeAccess(
                    primaryContinueCourse.resumePosition.visitedAt,
                    locale,
                  ) ?? t('learners.resume.lastAccessedUnknown'),
              })}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              onSelectLesson(primaryContinueCourse.id, primaryContinueLessonId)
            }
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
            ]}
          >
            <Text style={styles.startLabel}>{t('learners.resume.cta')}</Text>
          </Pressable>
        </View>
      ) : null}

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

      {!loading && catalogCourses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t('learners.courses.empty')}</Text>
        </View>
      ) : null}

      {!loading && courses.length === 0 && catalogCourses.length > 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {t('learners.resume.noEnrollments')}
          </Text>
        </View>
      ) : null}

      {purchaseError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{purchaseError}</Text>
        </View>
      ) : null}

      {statusMessage ? (
        <Text style={styles.offlineStatus}>{statusMessage}</Text>
      ) : null}

      <View style={styles.courseGrid}>
        {[...filteredCatalogCourses]
          .sort((a, b) => {
            const aEnrollment = enrolledByRecency.find(
              (item) => item.id === a.id,
            )
            const bEnrollment = enrolledByRecency.find(
              (item) => item.id === b.id,
            )
            const aTime = aEnrollment?.resumePosition?.visitedAt
            const bTime = bEnrollment?.resumePosition?.visitedAt

            if (aTime && bTime) {
              return bTime.localeCompare(aTime)
            }
            if (aTime) {
              return -1
            }
            if (bTime) {
              return 1
            }
            return a.title.localeCompare(b.title)
          })
          .map((catalogCourse) => {
            const enrolledCourse = courses.find(
              (item) => item.id === catalogCourse.id,
            )
            const lessonId = enrolledCourse
              ? getResumeLessonId(enrolledCourse)
              : undefined
            const isPending = pendingCourseId === catalogCourse.id
            const isPurchasing = purchasingCourseId === catalogCourse.id
            const isPreviewLoading = previewLoadingCourseId === catalogCourse.id

            return (
              <View key={catalogCourse.id} style={styles.courseCard}>
                <Text style={styles.courseTitle}>{catalogCourse.title}</Text>
                <Text style={styles.courseDescription}>
                  {catalogCourse.description}
                </Text>
                <Text style={styles.courseMeta}>
                  {catalogCourse.isPaid
                    ? t('catalog.price', {
                        price:
                          formatPrice(
                            catalogCourse.priceCents,
                            catalogCourse.currency,
                          ) ??
                          `${catalogCourse.priceCents ?? 0} ${catalogCourse.currency.toUpperCase()}`,
                      })
                    : t('catalog.free')}
                </Text>
                {enrolledCourse?.resumePosition?.visitedAt ? (
                  <Text style={styles.courseMeta}>
                    {t('learners.resume.lastAccessed', {
                      value:
                        formatRelativeAccess(
                          enrolledCourse.resumePosition.visitedAt,
                          locale,
                        ) ?? t('learners.resume.lastAccessedUnknown'),
                    })}
                  </Text>
                ) : null}

                {lessonId ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onSelectLesson(catalogCourse.id, lessonId)}
                    style={({ pressed }) => [
                      styles.startButton,
                      pressed && styles.startButtonPressed,
                    ]}
                  >
                    <Text style={styles.startLabel}>
                      {t('learners.courses.start')}
                    </Text>
                  </Pressable>
                ) : catalogCourse.isPaid ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={isPurchasing || isPending}
                    onPress={() => onBuyCourse(catalogCourse.id)}
                    style={({ pressed }) => [
                      styles.startButton,
                      pressed && styles.startButtonPressed,
                      (isPurchasing || isPending) && styles.startButtonDisabled,
                    ]}
                  >
                    <Text style={styles.startLabel}>
                      {isPurchasing || isPending
                        ? t('mobile.learners.pending')
                        : t('mobile.learners.buy')}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.freeActionsRow}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onEnrollFree(catalogCourse.id)}
                      style={({ pressed }) => [
                        styles.startButton,
                        pressed && styles.startButtonPressed,
                      ]}
                    >
                      <Text style={styles.startLabel}>
                        {t('mobile.learners.enrollFree')}
                      </Text>
                    </Pressable>
                    {catalogCourse.previewLessonId ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => onOpenPreview(catalogCourse)}
                        style={({ pressed }) => [
                          styles.secondaryButton,
                          pressed && styles.startButtonPressed,
                        ]}
                      >
                        <Text style={styles.secondaryLabel}>
                          {isPreviewLoading
                            ? t('catalog.detail.previewLoading')
                            : t('catalog.detail.openPreview')}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                )}

                {isPending ? (
                  <Text style={styles.pendingText}>
                    {t('mobile.learners.pending')}
                  </Text>
                ) : null}
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
  filterCard: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  filterInput: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    color: tokens.color.text,
    backgroundColor: tokens.color.background,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  filterChip: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    backgroundColor: tokens.color.background,
  },
  filterChipActive: {
    borderColor: tokens.color.accent,
    backgroundColor: tokens.color.surface,
  },
  filterChipText: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
  },
  featuredSection: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
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
  courseMeta: {
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
  pendingText: {
    marginTop: tokens.spacing.xs,
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  startLabel: {
    color: tokens.color.text,
    fontWeight: String(tokens.font.weight.medium) as '500',
    fontSize: tokens.font.size.sm,
  },
  freeActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.accent,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface,
  },
  secondaryLabel: {
    color: tokens.color.accent,
    fontWeight: String(tokens.font.weight.medium) as '500',
    fontSize: tokens.font.size.sm,
  },
})
