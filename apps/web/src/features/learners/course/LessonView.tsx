import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { tokenVars } from '@app/shared-tokens'
import { Surface } from '@app/shared-ui'
import type { ContentBlock, Lesson } from './types'
import { FillInBlankExercise } from './exercises/FillInBlankExercise'

export type LessonViewSelection =
  | { type: 'summary' }
  | { type: 'contentPage'; contentPageId: string }
  | { type: 'exercise'; exerciseId: string }

type LessonViewProps = {
  lesson: Lesson
  selection?: LessonViewSelection
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
        <FillInBlankExercise exercise={selectedExercise} />
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
