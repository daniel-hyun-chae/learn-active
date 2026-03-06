import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { tokens } from '@app/shared-tokens'
import type {
  Exercise,
  ExerciseBlank,
  ExerciseStep,
  SentenceSegment,
} from '../types'

type FillInBlankExerciseProps = {
  exercise: Exercise
}

type StepAnswers = Record<string, string>

function buildSentence(segments: SentenceSegment[], answers: StepAnswers) {
  return segments
    .map((segment) => {
      if (segment.type === 'TEXT') return segment.text ?? ''
      const blankId = segment.blankId
      if (!blankId) return '____'
      return answers[blankId] ?? '____'
    })
    .join('')
}

function sortSteps(steps: ExerciseStep[]) {
  return [...steps].sort((a, b) => a.order - b.order)
}

export function FillInBlankExercise({ exercise }: FillInBlankExerciseProps) {
  const { t } = useTranslation()
  const steps = useMemo(() => sortSteps(exercise.steps), [exercise.steps])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answersByStep, setAnswersByStep] = useState<
    Record<string, StepAnswers>
  >({})
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null)

  const currentStep = steps[currentIndex]
  const currentAnswers = answersByStep[currentStep.id] ?? {}
  const blanksById = useMemo(
    () => new Map(currentStep.blanks.map((blank) => [blank.id, blank])),
    [currentStep.blanks],
  )
  const blankOrder = useMemo(() => {
    const map = new Map<string, number>()
    currentStep.blanks.forEach((blank, index) => {
      map.set(blank.id, index + 1)
    })
    return map
  }, [currentStep.blanks])
  const optionsBlank = currentStep.blanks.find(
    (blank) => blank.variant === 'OPTIONS',
  )
  const isComplete = currentStep.blanks.every(
    (blank) => currentAnswers[blank.id],
  )

  useEffect(() => {
    setActiveBlankId(currentStep.blanks[0]?.id ?? null)
  }, [currentStep])

  function setAnswer(blankId: string, value: string) {
    setAnswersByStep((prev) => ({
      ...prev,
      [currentStep.id]: {
        ...prev[currentStep.id],
        [blankId]: value,
      },
    }))
  }

  function handleOptionSelect(option: string) {
    const targetBlankId = activeBlankId ?? currentStep.blanks[0]?.id
    if (!targetBlankId) return
    const nextAnswers = {
      ...currentAnswers,
      [targetBlankId]: option,
    }
    setAnswer(targetBlankId, option)

    const nextBlank = currentStep.blanks.find((blank) => !nextAnswers[blank.id])
    if (nextBlank) {
      setActiveBlankId(nextBlank.id)
    }
  }

  function handleContinue() {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const previousSteps = steps.slice(0, currentIndex)
  const nextLabel =
    currentIndex === steps.length - 1
      ? t('learners.exercise.complete')
      : t('learners.exercise.next')

  const activeBlank = activeBlankId ? blanksById.get(activeBlankId) : undefined
  const optionsSource: ExerciseBlank | undefined =
    activeBlank?.variant === 'OPTIONS' ? activeBlank : optionsBlank

  return (
    <View style={styles.container}>
      <View style={styles.contextCard}>
        <Text style={styles.contextTitle}>
          {t('learners.exercise.contextTitle')}
        </Text>
        {previousSteps.length === 0 ? (
          <Text style={styles.contextEmpty}>
            {t('learners.exercise.contextEmpty')}
          </Text>
        ) : (
          previousSteps.map((step, index) => {
            const previous = previousSteps[index - 1]
            const showThread = previous?.threadId !== step.threadId
            return (
              <View key={step.id} style={styles.contextStep}>
                {showThread ? (
                  <Text style={styles.contextThread}>
                    {t('learners.exercise.thread')}:{' '}
                    {step.threadTitle ?? step.threadId}
                  </Text>
                ) : null}
                <Text style={styles.contextSentence}>
                  {buildSentence(step.segments, answersByStep[step.id] ?? {})}
                </Text>
              </View>
            )
          })
        )}
      </View>

      <View style={styles.exerciseCard}>
        <Text style={styles.stepCounter}>
          {t('learners.exercise.step', {
            current: currentIndex + 1,
            total: steps.length,
          })}
        </Text>
        <Text style={styles.exerciseTitle}>{exercise.title}</Text>
        <Text style={styles.exercisePrompt}>{currentStep.prompt}</Text>

        <View style={styles.sentenceRow}>
          {currentStep.segments.map((segment, index) => {
            if (segment.type === 'TEXT') {
              return (
                <Text
                  key={`${segment.text ?? 'text'}-${index}`}
                  style={styles.sentenceText}
                >
                  {segment.text ?? ''}
                </Text>
              )
            }

            const blankId = segment.blankId
            if (!blankId) return null

            const blank = blanksById.get(blankId)
            if (!blank) return null
            const isActive = blankId === activeBlankId
            const blankValue = currentAnswers[blankId] ?? ''
            const blankIndex = blankOrder.get(blankId) ?? 1

            if (blank.variant === 'TYPING') {
              return (
                <TextInput
                  key={blankId}
                  value={blankValue}
                  onFocus={() => setActiveBlankId(blankId)}
                  onChangeText={(value) => setAnswer(blankId, value)}
                  style={[styles.blankInput, isActive && styles.blankActive]}
                  placeholder={t('learners.exercise.blankPlaceholder')}
                  placeholderTextColor={tokens.color.muted}
                  accessibilityLabel={t('learners.exercise.inputAria', {
                    blank: blankIndex,
                  })}
                />
              )
            }

            return (
              <Pressable
                key={blankId}
                accessibilityRole="button"
                onPress={() => setActiveBlankId(blankId)}
                style={[styles.blankButton, isActive && styles.blankActive]}
              >
                <Text style={styles.blankLabel}>
                  {blankValue || t('learners.exercise.blankPlaceholder')}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.optionsSection}>
          {optionsSource?.variant === 'OPTIONS' &&
          optionsSource.options?.length ? (
            <>
              <Text style={styles.optionsLabel}>
                {t('learners.exercise.optionsLabel')}
              </Text>
              <View style={styles.optionsGrid}>
                {optionsSource.options.map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    onPress={() => handleOptionSelect(option)}
                    style={({ pressed }) => [
                      styles.optionButton,
                      pressed && styles.optionButtonPressed,
                    ]}
                  >
                    <Text style={styles.optionLabel}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.typingHint}>
              {t('learners.exercise.typingHint')}
            </Text>
          )}
        </View>

        {!isComplete ? (
          <Text style={styles.fillHint}>{t('learners.exercise.fillAll')}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={!isComplete}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            !isComplete && styles.primaryButtonDisabled,
          ]}
        >
          <Text style={styles.primaryLabel}>{nextLabel}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.md,
  },
  contextCard: {
    padding: tokens.spacing.md,
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    gap: tokens.spacing.sm,
  },
  contextTitle: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  contextEmpty: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  contextStep: {
    gap: tokens.spacing.xs,
  },
  contextThread: {
    color: tokens.color.accent,
    fontSize: tokens.font.size.sm,
  },
  contextSentence: {
    color: tokens.color.text,
    fontSize: tokens.font.size.md,
  },
  exerciseCard: {
    padding: tokens.spacing.md,
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    gap: tokens.spacing.sm,
  },
  stepCounter: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
    textTransform: 'uppercase',
  },
  exerciseTitle: {
    color: tokens.color.text,
    fontSize: tokens.font.size.lg,
    fontWeight: String(tokens.font.weight.bold) as '700',
  },
  exercisePrompt: {
    color: tokens.color.text,
    fontSize: tokens.font.size.md,
  },
  sentenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  sentenceText: {
    color: tokens.color.text,
    fontSize: tokens.font.size.md,
  },
  blankInput: {
    minWidth: tokens.size.cardMin / 3,
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    color: tokens.color.text,
  },
  blankButton: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
  },
  blankActive: {
    borderColor: tokens.color.accent,
  },
  blankLabel: {
    color: tokens.color.text,
    fontSize: tokens.font.size.md,
  },
  optionsSection: {
    gap: tokens.spacing.sm,
  },
  optionsLabel: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  optionButton: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
  },
  optionButtonPressed: {
    opacity: tokens.opacity.pressed,
  },
  optionLabel: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
  },
  typingHint: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  fillHint: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.primary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
  },
  primaryButtonPressed: {
    opacity: tokens.opacity.pressed,
  },
  primaryButtonDisabled: {
    opacity: tokens.opacity.disabled,
  },
  primaryLabel: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
})
