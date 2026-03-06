import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tokenVars } from '@app/shared-tokens'
import { Surface } from '@app/shared-ui'
import type { Lesson } from './types'
import { FillInBlankExercise } from './exercises/FillInBlankExercise'

type LessonViewProps = {
  lesson: Lesson
}

export function LessonView({ lesson }: LessonViewProps) {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<'content' | 'exercise'>(
    'content',
  )

  const fillInBlank = useMemo(
    () =>
      lesson.exercises.find(
        (exercise) => exercise.type === 'FILL_IN_THE_BLANK',
      ),
    [lesson.exercises],
  )

  return (
    <section className="lesson-view" data-test="lesson-view">
      <div className="lesson-header">
        <div>
          <p className="muted">{t('learners.lesson.subtitle')}</p>
          <h2>{lesson.title}</h2>
        </div>
        <div className="lesson-tabs">
          <button
            type="button"
            className={activeSection === 'content' ? 'tab active' : 'tab'}
            onClick={() => setActiveSection('content')}
          >
            {t('learners.lesson.contentTab')}
          </button>
          <button
            type="button"
            className={activeSection === 'exercise' ? 'tab active' : 'tab'}
            onClick={() => setActiveSection('exercise')}
            disabled={!fillInBlank}
          >
            {t('learners.lesson.exerciseTab')}
          </button>
        </div>
      </div>

      {activeSection === 'content' ? (
        <div className="lesson-content" data-test="lesson-content">
          {lesson.contents.map((content) => (
            <Surface key={content.id} className="lesson-content-block">
              {content.type === 'TEXT' ? (
                <p className="lesson-text">{content.text}</p>
              ) : (
                <img
                  src={content.imageUrl}
                  alt={content.imageAlt ?? ''}
                  className="lesson-image"
                />
              )}
            </Surface>
          ))}
          {fillInBlank ? (
            <div className="lesson-next">
              <button
                type="button"
                className="lesson-next-button"
                data-test="lesson-start-exercise"
                onClick={() => setActiveSection('exercise')}
              >
                {t('learners.lesson.startExercise')}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeSection === 'exercise' && fillInBlank ? (
        <FillInBlankExercise exercise={fillInBlank} />
      ) : null}

      {!fillInBlank && activeSection === 'exercise' ? (
        <p className="muted">{t('learners.lesson.noExercise')}</p>
      ) : null}

      <p className="muted" style={{ marginTop: tokenVars.spacing.lg }}>
        {t('learners.lesson.resumeHint')}
      </p>
    </section>
  )
}
