import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { tokenVars } from '@app/shared-tokens'
import { Surface } from '@app/shared-ui'
import type { ContentBlock, Lesson } from './types'
import { FillInBlankExercise } from './exercises/FillInBlankExercise'
import { MultipleChoiceExercise } from './exercises/MultipleChoiceExercise'
import { ReorderingExercise } from './exercises/ReorderingExercise'

export type LessonViewSelection =
  | { type: 'summary' }
  | { type: 'contentPage'; contentPageId: string }
  | { type: 'exercise'; exerciseId: string }

type LessonViewProps = {
  lesson: Lesson
  selection?: LessonViewSelection
  lessonProgressLabel?: string
  onSubmitAttempt?: (args: {
    exerciseId: string
    answers: Record<string, string>
  }) => Promise<{ isCorrect: boolean } | void> | { isCorrect: boolean } | void
}

function renderContentBlocks(contents: ContentBlock[], testId: string) {
  return (
    <div className="lesson-content" data-test={testId}>
      {contents.map((content) => (
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
    </div>
  )
}

export function LessonView({
  lesson,
  selection = { type: 'summary' },
  lessonProgressLabel,
  onSubmitAttempt,
}: LessonViewProps) {
  const { t } = useTranslation()

  const selectedContentPage = useMemo(() => {
    if (selection.type !== 'contentPage') return undefined
    return lesson.contentPages.find(
      (page) => page.id === selection.contentPageId,
    )
  }, [lesson.contentPages, selection])

  const selectedExercise = useMemo(() => {
    if (selection.type !== 'exercise') return undefined
    return lesson.exercises.find(
      (exercise) => exercise.id === selection.exerciseId,
    )
  }, [lesson.exercises, selection])

  return (
    <section className="lesson-view" data-test="lesson-view">
      <div className="lesson-header">
        <div>
          <p className="muted">{t('learners.lesson.subtitle')}</p>
          <h2>{lesson.title}</h2>
          {lessonProgressLabel ? (
            <p className="muted" data-test="lesson-progress-label">
              {lessonProgressLabel}
            </p>
          ) : null}
        </div>
      </div>

      {selection.type === 'summary'
        ? renderContentBlocks(lesson.contents, 'lesson-summary')
        : null}

      {selection.type === 'contentPage' && selectedContentPage ? (
        <div data-test="lesson-content-page">
          <h3>{selectedContentPage.title}</h3>
          {renderContentBlocks(
            selectedContentPage.contents,
            'lesson-content-page-body',
          )}
        </div>
      ) : null}

      {selection.type === 'contentPage' && !selectedContentPage ? (
        <p className="muted">{t('learners.lesson.contentPageMissing')}</p>
      ) : null}

      {selection.type === 'exercise' && selectedExercise ? (
        selectedExercise.type === 'MULTIPLE_CHOICE' ? (
          <MultipleChoiceExercise
            exercise={
              selectedExercise as Extract<
                Lesson['exercises'][number],
                { type: 'MULTIPLE_CHOICE' }
              >
            }
            onSubmitAttempt={onSubmitAttempt}
          />
        ) : selectedExercise.type === 'REORDERING' ? (
          <ReorderingExercise
            exercise={
              selectedExercise as Extract<
                Lesson['exercises'][number],
                { type: 'REORDERING' }
              >
            }
            onSubmitAttempt={onSubmitAttempt}
          />
        ) : (
          <FillInBlankExercise
            exercise={
              selectedExercise as Extract<
                Lesson['exercises'][number],
                { type: 'FILL_IN_THE_BLANK' }
              >
            }
            onSubmitAttempt={onSubmitAttempt}
          />
        )
      ) : null}

      {selection.type === 'exercise' && !selectedExercise ? (
        <p className="muted">{t('learners.lesson.noExercise')}</p>
      ) : null}

      <p className="muted" style={{ marginTop: tokenVars.spacing.lg }}>
        {t('learners.lesson.resumeHint')}
      </p>
    </section>
  )
}
