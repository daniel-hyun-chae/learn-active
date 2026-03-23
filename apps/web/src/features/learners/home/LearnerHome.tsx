import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Surface, PrimaryButton } from '@app/shared-ui'
import { tokenVars } from '@app/shared-tokens'
import { quizAttemptStore } from '../../../shared/offline/quizAttemptStore'
import type { CourseProgress } from '../course/types'
type CourseSummary = {
  id: string
  versionId: string
  title: string
  description: string
  resumePosition?: {
    courseId: string
    lessonId: string
    block: 'summary' | 'contentPage' | 'exercise'
    contentPageId: string | null
    exerciseId: string | null
    visitedAt: string
  } | null
  modules: Array<{
    id: string
    lessons: Array<{ id: string }>
  }>
}

type CatalogCourseSummary = {
  id: string
  slug: string
  title: string
  description: string
}

type CourseProgressByCourseId = Record<string, CourseProgress>

const quizFormatKeys = [
  'learners.quiz.format.multipleChoice',
  'learners.quiz.format.imageHotspot',
  'learners.quiz.format.ordering',
  'learners.quiz.format.matching',
] as const

function createAttemptId() {
  return globalThis.crypto?.randomUUID?.() ?? `attempt-${Date.now()}`
}

type LearnerHomeProps = {
  apiHealth: string
  courses: CourseSummary[]
  catalogCourses?: CatalogCourseSummary[]
  progressByCourseId?: CourseProgressByCourseId
}

function formatRelativeAccessTime(
  value: string,
  locale: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const accessed = new Date(value)
  if (Number.isNaN(accessed.getTime())) {
    return t('learners.resume.lastAccessedUnknown')
  }

  const diffMs = Date.now() - accessed.getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000))
  const safeLocale = (() => {
    try {
      return Intl.getCanonicalLocales(locale)[0] ?? 'en'
    } catch {
      return 'en'
    }
  })()

  const rtf = (() => {
    try {
      return new Intl.RelativeTimeFormat(safeLocale, { numeric: 'auto' })
    } catch {
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    }
  })()

  if (diffMinutes < 60) {
    return t('learners.resume.lastAccessed', {
      value: rtf.format(-diffMinutes, 'minute'),
    })
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return t('learners.resume.lastAccessed', {
      value: rtf.format(-diffHours, 'hour'),
    })
  }

  const diffDays = Math.round(diffHours / 24)
  return t('learners.resume.lastAccessed', {
    value: rtf.format(-diffDays, 'day'),
  })
}

function buildResumePath(course: CourseSummary) {
  const position = course.resumePosition
  if (!position?.lessonId) {
    return null
  }

  return {
    to: '/courses/$courseId/lessons/$lessonId' as const,
    params: {
      courseId: course.id,
      lessonId: position.lessonId,
    },
    search: {
      block: position.block,
      contentPageId:
        position.block === 'contentPage'
          ? (position.contentPageId ?? undefined)
          : undefined,
      exerciseId:
        position.block === 'exercise'
          ? (position.exerciseId ?? undefined)
          : undefined,
    },
  }
}

function buildDefaultCoursePath(course: CourseSummary) {
  const firstModule = course.modules[0]
  const firstLesson = firstModule?.lessons[0]
  if (!firstLesson) {
    return null
  }

  return {
    to: '/courses/$courseId/lessons/$lessonId' as const,
    params: {
      courseId: course.id,
      lessonId: firstLesson.id,
    },
    search: {
      block: 'summary' as const,
    },
  }
}

export function LearnerHome({
  apiHealth,
  courses,
  catalogCourses = [],
  progressByCourseId = {},
}: LearnerHomeProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<string>('')

  const enrolledCourses = [...courses].sort((a, b) => {
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

  const continueCourse = enrolledCourses[0] ?? null
  const continuePath = continueCourse ? buildResumePath(continueCourse) : null
  const continueFallbackPath = continueCourse
    ? buildDefaultCoursePath(continueCourse)
    : null
  const continueFinalPath = continuePath ?? continueFallbackPath
  const secondaryEnrolledCourses = continueFinalPath
    ? enrolledCourses.filter((course) => course.id !== continueCourse?.id)
    : enrolledCourses

  const continueProgress = continueCourse
    ? progressByCourseId[continueCourse.id]
    : undefined
  const continueProgressLabel = continueProgress
    ? t('learners.progress.courseSummary', {
        completed: continueProgress.completedExercises,
        total: continueProgress.totalExercises,
      })
    : null

  const locale = globalThis.navigator?.language ?? 'en'

  const handleStartQuiz = async () => {
    const attemptId = createAttemptId()
    await quizAttemptStore.save({
      attemptId,
      quizId: 'demo-quiz',
      answers: {},
      startedAt: new Date().toISOString(),
    })
    setStatus(t('learners.home.offlineSaved'))
  }

  return (
    <section>
      <div className="course-list" data-test="course-list">
        <div className="course-header">
          <div>
            <h2 style={{ marginTop: tokenVars.spacing.none }}>
              {t('learners.courses.title')}
            </h2>
            <p className="muted">{t('learners.courses.subtitle')}</p>
          </div>
        </div>

        {continueCourse && continueFinalPath ? (
          <Surface>
            <div className="course-card" data-test="continue-learning-card">
              <div>
                <p className="muted">{t('learners.resume.primaryLabel')}</p>
                <h3 style={{ marginTop: tokenVars.spacing.none }}>
                  {continueCourse.title}
                </h3>
                {continueProgressLabel ? (
                  <p className="muted" data-test="continue-learning-progress">
                    {continueProgressLabel}
                  </p>
                ) : null}
                {continueCourse.resumePosition?.visitedAt ? (
                  <p
                    className="muted"
                    data-test="continue-learning-last-access"
                  >
                    {formatRelativeAccessTime(
                      continueCourse.resumePosition.visitedAt,
                      locale,
                      t,
                    )}
                  </p>
                ) : null}
              </div>
              <Link
                to={continueFinalPath.to}
                params={continueFinalPath.params}
                search={continueFinalPath.search}
                className="course-link"
                data-test="continue-learning-link"
                aria-label={t('learners.resume.cta')}
              >
                {t('learners.resume.cta')}
              </Link>
            </div>
          </Surface>
        ) : null}

        <div className="course-grid">
          {enrolledCourses.length === 0 ? (
            <Surface>
              <p className="muted">{t('learners.resume.noEnrollments')}</p>
              <Link to="/courses" className="course-link">
                {t('learners.resume.browseCatalog')}
              </Link>
            </Surface>
          ) : null}
          {secondaryEnrolledCourses.map((course) => {
            const resumePath = buildResumePath(course)
            const lessonPath = resumePath ?? buildDefaultCoursePath(course)
            const progress = progressByCourseId[course.id]
            const progressLabel = progress
              ? t('learners.progress.courseSummary', {
                  completed: progress.completedExercises,
                  total: progress.totalExercises,
                })
              : null
            const lastAccessLabel = course.resumePosition?.visitedAt
              ? formatRelativeAccessTime(
                  course.resumePosition.visitedAt,
                  locale,
                  t,
                )
              : null

            return (
              <Surface key={course.id} data-test="course-card">
                <div className="course-card">
                  <div>
                    <h3 style={{ marginTop: tokenVars.spacing.none }}>
                      {course.title}
                    </h3>
                    <p className="muted">{course.description}</p>
                    {progressLabel ? (
                      <p className="muted" data-test="course-card-progress">
                        {progressLabel}
                      </p>
                    ) : null}
                    {lastAccessLabel ? (
                      <p className="muted" data-test="course-card-last-access">
                        {lastAccessLabel}
                      </p>
                    ) : null}
                  </div>
                  {lessonPath ? (
                    <Link
                      to={lessonPath.to}
                      params={lessonPath.params}
                      search={lessonPath.search}
                      className="course-link"
                      aria-label={t('learners.courses.start')}
                    >
                      {t('learners.courses.start')}
                    </Link>
                  ) : null}
                </div>
              </Surface>
            )
          })}
        </div>

        {continueCourse && secondaryEnrolledCourses.length > 0 ? (
          <p className="muted" data-test="continue-learning-secondary-label">
            {t('learners.resume.otherCourses')}
          </p>
        ) : null}

        {enrolledCourses.length === 0 && catalogCourses.length > 0 ? (
          <div className="course-grid" data-test="catalog-fallback-grid">
            {catalogCourses.map((course) => (
              <Surface key={course.id}>
                <div className="course-card">
                  <div>
                    <h3 style={{ marginTop: tokenVars.spacing.none }}>
                      {course.title}
                    </h3>
                    <p className="muted">{course.description}</p>
                  </div>
                  <Link to={`/courses/${course.slug}`} className="course-link">
                    {t('catalog.open')}
                  </Link>
                </div>
              </Surface>
            ))}
          </div>
        ) : null}
      </div>
      <div className="hero">
        <div>
          <h1
            style={{
              fontSize: tokenVars.font.size.xl,
              margin: tokenVars.spacing.none,
            }}
          >
            {t('learners.home.title')}
          </h1>
          <p className="muted" style={{ fontSize: tokenVars.font.size.md }}>
            {t('learners.home.subtitle')}
          </p>
          <PrimaryButton
            onClick={handleStartQuiz}
            aria-label={t('learners.home.cta')}
          >
            {t('learners.home.cta')}
          </PrimaryButton>
          <p
            className="muted"
            data-test="api-health"
            data-status={apiHealth}
            style={{ marginTop: tokenVars.spacing.sm }}
          >
            {t('learners.home.apiStatus', { status: apiHealth })}
          </p>
          {status ? (
            <p className="muted" style={{ marginTop: tokenVars.spacing.sm }}>
              {status}
            </p>
          ) : null}
          <p className="muted" style={{ marginTop: tokenVars.spacing.sm }}>
            {t('learners.home.offlineHint')}
          </p>
        </div>
        <Surface>
          <h2 style={{ marginTop: tokenVars.spacing.none }}>
            {t('learners.home.formatsTitle')}
          </h2>
          <ul
            style={{
              paddingLeft: tokenVars.spacing.lg,
              margin: tokenVars.spacing.none,
            }}
          >
            {quizFormatKeys.map((formatKey) => (
              <li
                key={formatKey}
                style={{ marginBottom: tokenVars.spacing.sm }}
              >
                {t(formatKey)}
              </li>
            ))}
          </ul>
        </Surface>
      </div>
      <div className="card-grid" style={{ marginTop: tokenVars.spacing.xl }}>
        <Surface>
          <h3 style={{ marginTop: tokenVars.spacing.none }}>
            {t('learners.home.pathwaysTitle')}
          </h3>
          <p className="muted">{t('learners.home.pathwaysBody')}</p>
        </Surface>
        <Surface>
          <h3 style={{ marginTop: tokenVars.spacing.none }}>
            {t('learners.home.insightsTitle')}
          </h3>
          <p className="muted">{t('learners.home.insightsBody')}</p>
        </Surface>
        <Surface>
          <h3 style={{ marginTop: tokenVars.spacing.none }}>
            {t('learners.home.offlineTitle')}
          </h3>
          <p className="muted">{t('learners.home.offlineBody')}</p>
        </Surface>
      </div>
    </section>
  )
}
