import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@app/shared-ui'
import type { ReorderingExercise as ReorderingExerciseType } from '../types'

type ReorderingExerciseProps = {
  exercise: ReorderingExerciseType
  onSubmitAttempt?: (args: {
    exerciseId: string
    answers: Record<string, string>
  }) => Promise<{ isCorrect: boolean } | void> | { isCorrect: boolean } | void
}

function shuffleIds(ids: string[]) {
  const next = [...ids]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = current
  }
  return next
}

function moveItem(ids: string[], fromIndex: number, toIndex: number) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= ids.length ||
    toIndex >= ids.length ||
    fromIndex === toIndex
  ) {
    return ids
  }

  const next = [...ids]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

function isOrderingCorrect(
  orderedIds: string[],
  itemById: Map<string, ReorderingExerciseType['reordering']['items'][number]>,
) {
  const submittedNonDistractorIds = orderedIds.filter(
    (id) => !itemById.get(id)?.isDistractor,
  )
  const expectedNonDistractorIds = [...itemById.values()]
    .sort((a, b) => a.order - b.order)
    .filter((item) => !item.isDistractor)
    .map((item) => item.id)

  if (submittedNonDistractorIds.length !== expectedNonDistractorIds.length) {
    return false
  }

  return submittedNonDistractorIds.every(
    (id, index) => id === expectedNonDistractorIds[index],
  )
}

export function ReorderingExercise({
  exercise,
  onSubmitAttempt,
}: ReorderingExerciseProps) {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submissionCorrect, setSubmissionCorrect] = useState<boolean | null>(
    null,
  )
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)

  const items = useMemo(
    () => [...exercise.reordering.items].sort((a, b) => a.order - b.order),
    [exercise.reordering.items],
  )
  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  )
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    shuffleIds(items.map((item) => item.id)),
  )

  const orderedItems = useMemo(
    () => orderedIds.map((id) => itemById.get(id)).filter(Boolean),
    [orderedIds, itemById],
  )

  function resetSubmissionState() {
    setSubmitted(false)
    setSubmissionError(null)
    setSubmissionCorrect(null)
  }

  function moveByDelta(itemId: string, delta: -1 | 1) {
    const currentIndex = orderedIds.findIndex((id) => id === itemId)
    const nextIndex = currentIndex + delta
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedIds.length) {
      return
    }
    resetSubmissionState()
    setOrderedIds((previous) => moveItem(previous, currentIndex, nextIndex))
  }

  async function handleSubmit() {
    if (submitting || orderedIds.length === 0) {
      return
    }

    resetSubmissionState()
    setSubmitting(true)
    const answers = Object.fromEntries(
      orderedIds.map((id, index) => [id, String(index + 1)]),
    )

    try {
      const result = await onSubmitAttempt?.({
        exerciseId: exercise.id,
        answers,
      })
      setSubmitted(true)
      setSubmissionCorrect(
        typeof result?.isCorrect === 'boolean'
          ? result.isCorrect
          : isOrderingCorrect(orderedIds, itemById),
      )
    } catch {
      setSubmissionError(t('learners.exercise.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="exercise-card" data-test="reordering-exercise">
      <div className="exercise-header">
        <h3>{exercise.title}</h3>
        <p className="exercise-prompt">{exercise.reordering.prompt}</p>
      </div>

      <p className="muted">{t('learners.exercise.reordering.helper')}</p>

      <div className="reordering-list" data-test="reordering-list">
        {orderedItems.map((item, index) => {
          if (!item) {
            return null
          }

          return (
            <div
              key={item.id}
              className="reordering-item"
              data-test="reordering-item"
              draggable
              tabIndex={0}
              onDragStart={() => setDraggedItemId(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const fromIndex = orderedIds.findIndex(
                  (id) => id === draggedItemId,
                )
                if (fromIndex < 0) {
                  return
                }
                resetSubmissionState()
                setOrderedIds((previous) =>
                  moveItem(previous, fromIndex, index),
                )
                setDraggedItemId(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  moveByDelta(item.id, -1)
                }
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  moveByDelta(item.id, 1)
                }
              }}
            >
              <span>
                {index + 1}. {item.text}
              </span>
              {item.isDistractor ? (
                <span className="muted" data-test="reordering-item-distractor">
                  {t('learners.exercise.reordering.distractorBadge')}
                </span>
              ) : null}
              <div className="reordering-item-actions">
                <button
                  type="button"
                  className="ghost-button"
                  data-test="reordering-move-up"
                  onClick={() => moveByDelta(item.id, -1)}
                  disabled={index === 0}
                >
                  {t('publishers.actions.moveUp')}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  data-test="reordering-move-down"
                  onClick={() => moveByDelta(item.id, 1)}
                  disabled={index >= orderedItems.length - 1}
                >
                  {t('publishers.actions.moveDown')}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="exercise-actions">
        <PrimaryButton
          onClick={() => {
            void handleSubmit()
          }}
          disabled={orderedIds.length === 0 || submitting}
          aria-label={t('learners.exercise.reordering.submit')}
        >
          {submitting
            ? t('learners.exercise.submitting')
            : t('learners.exercise.reordering.submit')}
        </PrimaryButton>
      </div>

      {submissionError ? (
        <p className="status-error" data-test="reordering-submit-error">
          {submissionError}
        </p>
      ) : null}

      {submitted && !submissionError && submissionCorrect !== null ? (
        <p
          className={submissionCorrect ? 'status-success' : 'status-error'}
          data-test="reordering-feedback"
        >
          {submissionCorrect
            ? t('learners.exercise.reordering.correct')
            : t('learners.exercise.reordering.incorrect')}
        </p>
      ) : null}
    </div>
  )
}
