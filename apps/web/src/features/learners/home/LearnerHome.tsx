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
  modules: Array<{
    id: string
    lessons: Array<{ id: string }>
  }>
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
  progressByCourseId?: CourseProgressByCourseId
}

export function LearnerHome({
  apiHealth,
  courses,
  progressByCourseId = {},
}: LearnerHomeProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<string>('')

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
        <div className="course-grid">
          {courses.length === 0 ? (
            <Surface>
              <p className="muted">{t('learners.courses.empty')}</p>
            </Surface>
          ) : null}
          {courses.map((course) => {
            const firstModule = course.modules[0]
            const firstLesson = firstModule?.lessons[0]
            const lessonPath = firstLesson
              ? `/courses/${course.id}/lessons/${firstLesson.id}`
              : undefined
            const progress = progressByCourseId[course.id]
            const progressLabel = progress
              ? t('learners.progress.courseSummary', {
                  completed: progress.completedExercises,
                  total: progress.totalExercises,
                })
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
                  </div>
                  {lessonPath ? (
                    <Link
                      to={lessonPath}
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
