import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tokenVars } from '@app/shared-tokens'
import { PrimaryButton } from '@app/shared-ui'
import type {
  FillInBlankExercise as FillInBlankExerciseType,
  ExerciseBlank,
  ExerciseStep,
  SentenceSegment,
} from '../types'

type FillInBlankExerciseProps = {
  exercise: FillInBlankExerciseType
  onSubmitAttempt?: (args: {
    exerciseId: string
    answers: Record<string, string>
  }) => Promise<void> | void
}

type StepAnswers = Record<string, string>

function buildSentence(step: ExerciseStep, answers: StepAnswers) {
  return step.segments.map((segment: SentenceSegment, index: number) => {
    if (segment.type === 'TEXT') {
      return <span key={`${step.id}-text-${index}`}>{segment.text}</span>
    }

    const blankAnswer = segment.blankId ? answers[segment.blankId] : ''
    return (
      <span
        key={`${step.id}-blank-${segment.blankId ?? index}`}
        className="exercise-blank-inline"
      >
        {blankAnswer || '____'}
      </span>
    )
  })
}

export function FillInBlankExercise({
  exercise,
  onSubmitAttempt,
}: FillInBlankExerciseProps) {
  const { t } = useTranslation()
  const exerciseSteps = exercise.fillInBlank?.steps ?? []
  const steps = useMemo(
    () =>
      [...exerciseSteps].sort(
        (a: ExerciseStep, b: ExerciseStep) => a.order - b.order,
      ),
    [exerciseSteps],
  )

  if (steps.length === 0) {
    return <p className="muted">{t('learners.lesson.noExercise')}</p>
  }
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answersByStep, setAnswersByStep] = useState<
    Record<string, StepAnswers>
  >({})
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null)

  const currentStep = steps[currentIndex]
  const currentAnswers = answersByStep[currentStep.id] ?? {}
  const blanksById = useMemo(() => {
    const map = new Map<string, ExerciseBlank>()
    currentStep.blanks.forEach((blank: ExerciseBlank) =>
      map.set(blank.id, blank),
    )
    return map
  }, [currentStep])

  const optionsBlank = useMemo(
    () =>
      currentStep.blanks.find(
        (blank: ExerciseBlank) => blank.variant === 'OPTIONS',
      ),
    [currentStep.blanks],
  )

  const isComplete = currentStep.blanks.every(
    (blank: ExerciseBlank) => currentAnswers[blank.id],
  )

  useEffect(() => {
    const firstBlank = currentStep.blanks[0]
    setActiveBlankId(firstBlank?.id ?? null)
  }, [currentStep])

  function setAnswer(blankId: string, value: string) {
    setAnswersByStep((previous: Record<string, StepAnswers>) => ({
      ...previous,
      [currentStep.id]: {
        ...previous[currentStep.id],
        [blankId]: value,
      },
    }))
  }

  function handleOptionSelect(option: string) {
    const targetBlankId = activeBlankId ?? currentStep.blanks[0]?.id
    if (!targetBlankId) {
      return
    }
    const nextAnswers = {
      ...currentAnswers,
      [targetBlankId]: option,
    }
    setAnswer(targetBlankId, option)

    const nextBlank = currentStep.blanks.find(
      (blank: ExerciseBlank) => !nextAnswers[blank.id],
    )
    if (nextBlank) {
      setActiveBlankId(nextBlank.id)
    }
  }

  function handleContinue() {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((index: number) => index + 1)
      return
    }

    const mergedAnswers = steps.reduce<Record<string, string>>((acc, step) => {
      const stepAnswers = answersByStep[step.id] ?? {}
      for (const [key, value] of Object.entries(stepAnswers)) {
        acc[key] = value
      }
      return acc
    }, {})
    void onSubmitAttempt?.({
      exerciseId: exercise.id,
      answers: mergedAnswers,
    })
  }

  const previousSteps = steps.slice(0, currentIndex)
  const nextStepLabel =
    currentIndex < steps.length - 1
      ? t('learners.exercise.next')
      : t('learners.exercise.complete')

  return (
    <div className="exercise-flow" data-test="exercise-flow">
      <div className="exercise-context">
        <div className="exercise-context-header">
          <strong>{t('learners.exercise.contextTitle')}</strong>
        </div>
        <div className="exercise-context-body">
          {previousSteps.length === 0 ? (
            <p className="muted">{t('learners.exercise.contextEmpty')}</p>
          ) : null}
          {previousSteps.map((step: ExerciseStep, index: number) => {
            const isNewThread =
              index === 0 || previousSteps[index - 1].threadId !== step.threadId
            return (
              <div key={step.id} className="exercise-context-step">
                {isNewThread ? (
                  <p className="exercise-thread-title">
                    {step.threadTitle ?? t('learners.exercise.thread')}
                  </p>
                ) : null}
                <p className="exercise-context-line">
                  {buildSentence(step, answersByStep[step.id] ?? {})}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="exercise-card">
        <div className="exercise-header">
          <p className="muted">
            {t('learners.exercise.step', {
              current: currentIndex + 1,
              total: steps.length,
            })}
          </p>
          <h3>{exercise.title}</h3>
          <p className="exercise-prompt">{currentStep.prompt}</p>
        </div>

        <div className="exercise-sentence">
          {currentStep.segments.map(
            (segment: SentenceSegment, index: number) => {
              if (segment.type === 'TEXT') {
                return (
                  <span key={`${currentStep.id}-text-${index}`}>
                    {segment.text}
                  </span>
                )
              }

              if (!segment.blankId) {
                return null
              }

              const blank = blanksById.get(segment.blankId)
              if (!blank) {
                return null
              }

              const value = currentAnswers[blank.id] ?? ''
              if (blank.variant === 'TYPING') {
                return (
                  <input
                    key={`${currentStep.id}-blank-${blank.id}`}
                    className="exercise-input"
                    type="text"
                    value={value}
                    onFocus={() => setActiveBlankId(blank.id)}
                    onChange={(event) =>
                      setAnswer(blank.id, event.target.value)
                    }
                    aria-label={t('learners.exercise.inputAria', {
                      blank: blank.id,
                    })}
                  />
                )
              }

              return (
                <button
                  key={`${currentStep.id}-blank-${blank.id}`}
                  type="button"
                  className={
                    activeBlankId === blank.id
                      ? 'exercise-blank active'
                      : 'exercise-blank'
                  }
                  onClick={() => setActiveBlankId(blank.id)}
                >
                  {value || t('learners.exercise.blankPlaceholder')}
                </button>
              )
            },
          )}
        </div>

        {currentStep.blanks.some(
          (blank: ExerciseBlank) => blank.variant === 'OPTIONS',
        ) ? (
          <div className="exercise-options">
            <p className="muted">{t('learners.exercise.optionsLabel')}</p>
            <div className="exercise-options-grid">
              {(activeBlankId &&
              blanksById.get(activeBlankId)?.variant === 'OPTIONS'
                ? blanksById.get(activeBlankId)?.options
                : optionsBlank?.options
              )?.map((option: string) => (
                <button
                  key={option}
                  type="button"
                  className="exercise-option"
                  onClick={() => handleOptionSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted">{t('learners.exercise.typingHint')}</p>
        )}

        <div className="exercise-actions">
          <PrimaryButton
            onClick={handleContinue}
            aria-label={nextStepLabel}
            disabled={!isComplete}
          >
            {nextStepLabel}
          </PrimaryButton>
          {!isComplete ? (
            <p className="muted" style={{ marginTop: tokenVars.spacing.sm }}>
              {t('learners.exercise.fillAll')}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
