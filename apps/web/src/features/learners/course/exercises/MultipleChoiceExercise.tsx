import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from '@app/shared-ui'
import type { MultipleChoiceExercise as MultipleChoiceExerciseType } from '../types'

type MultipleChoiceExerciseProps = {
  exercise: MultipleChoiceExerciseType
  onSubmitAttempt?: (args: {
    exerciseId: string
    answers: Record<string, string>
  }) => Promise<{ isCorrect: boolean } | void> | { isCorrect: boolean } | void
}

export function MultipleChoiceExercise({
  exercise,
  onSubmitAttempt,
}: MultipleChoiceExerciseProps) {
  const { t } = useTranslation()
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submissionCorrect, setSubmissionCorrect] = useState<boolean | null>(
    null,
  )

  const multipleChoice = exercise.multipleChoice
  const choices = useMemo(
    () => [...multipleChoice.choices].sort((a, b) => a.order - b.order),
    [multipleChoice.choices],
  )

  const isMulti = multipleChoice.allowsMultiple
  const selectedSet = useMemo(
    () => new Set(selectedChoiceIds),
    [selectedChoiceIds],
  )
  const correctSet = useMemo(
    () =>
      new Set(
        choices.filter((choice) => choice.isCorrect).map((choice) => choice.id),
      ),
    [choices],
  )

  const isSelectionCorrect = useMemo(() => {
    if (selectedSet.size !== correctSet.size) {
      return false
    }
    for (const id of selectedSet) {
      if (!correctSet.has(id)) {
        return false
      }
    }
    return true
  }, [selectedSet, correctSet])

  function toggleChoice(choiceId: string) {
    setSubmitted(false)
    setSubmissionError(null)
    setSubmissionCorrect(null)
    if (isMulti) {
      setSelectedChoiceIds((previous) =>
        previous.includes(choiceId)
          ? previous.filter((id) => id !== choiceId)
          : [...previous, choiceId],
      )
      return
    }

    setSelectedChoiceIds((previous) =>
      previous[0] === choiceId ? [] : [choiceId],
    )
  }

  async function handleSubmit() {
    if (selectedChoiceIds.length === 0 || submitting) {
      return
    }

    setSubmitted(false)
    setSubmissionError(null)
    setSubmissionCorrect(null)
    setSubmitting(true)
    const answerPayload = Object.fromEntries(
      selectedChoiceIds.map((choiceId) => [choiceId, 'true']),
    )

    try {
      const result = await onSubmitAttempt?.({
        exerciseId: exercise.id,
        answers: answerPayload,
      })
      setSubmitted(true)
      setSubmissionCorrect(
        typeof result?.isCorrect === 'boolean'
          ? result.isCorrect
          : isSelectionCorrect,
      )
    } catch {
      setSubmitted(false)
      setSubmissionError(t('learners.exercise.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="exercise-card" data-test="multiple-choice-exercise">
      <div className="exercise-header">
        <h3>{exercise.title}</h3>
        <p className="exercise-prompt">{multipleChoice.question}</p>
      </div>

      <p className="muted">
        {isMulti
          ? t('learners.exercise.multipleChoice.selectMany')
          : t('learners.exercise.multipleChoice.selectOne')}
      </p>

      <div className="exercise-options-grid">
        {choices.map((choice) => {
          const selected = selectedSet.has(choice.id)
          return (
            <button
              key={choice.id}
              type="button"
              className={
                selected ? 'exercise-option active' : 'exercise-option'
              }
              data-test="multiple-choice-option"
              onClick={() => toggleChoice(choice.id)}
            >
              {choice.text}
            </button>
          )
        })}
      </div>

      <div className="exercise-actions">
        <PrimaryButton
          onClick={() => {
            void handleSubmit()
          }}
          disabled={selectedChoiceIds.length === 0 || submitting}
          aria-label={t('learners.exercise.multipleChoice.submit')}
        >
          {submitting
            ? t('learners.exercise.submitting')
            : t('learners.exercise.multipleChoice.submit')}
        </PrimaryButton>
      </div>

      {submissionError ? (
        <p className="status-error" data-test="multiple-choice-submit-error">
          {submissionError}
        </p>
      ) : null}

      {submitted && !submissionError && submissionCorrect !== null ? (
        <p
          className={submissionCorrect ? 'status-success' : 'status-error'}
          data-test="multiple-choice-feedback"
        >
          {submissionCorrect
            ? t('learners.exercise.multipleChoice.correct')
            : t('learners.exercise.multipleChoice.incorrect')}
        </p>
      ) : null}
    </div>
  )
}
