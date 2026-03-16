import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { tokens } from '@app/shared-tokens'
import type { MultipleChoiceExercise as MultipleChoiceExerciseType } from '../types'

type MultipleChoiceExerciseProps = {
  exercise: MultipleChoiceExerciseType
}

export function MultipleChoiceExercise({
  exercise,
}: MultipleChoiceExerciseProps) {
  const { t } = useTranslation()
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const multipleChoice = exercise.multipleChoice
  const choices = useMemo(
    () => [...multipleChoice.choices].sort((a, b) => a.order - b.order),
    [multipleChoice.choices],
  )

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

  const isCorrect = useMemo(() => {
    if (!submitted) {
      return false
    }
    if (selectedSet.size !== correctSet.size) {
      return false
    }
    for (const id of selectedSet) {
      if (!correctSet.has(id)) {
        return false
      }
    }
    return true
  }, [submitted, selectedSet, correctSet])

  function toggleChoice(choiceId: string) {
    setSubmitted(false)
    if (multipleChoice.allowsMultiple) {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exercise.title}</Text>
      <Text style={styles.question}>{multipleChoice.question}</Text>
      <Text style={styles.hint}>
        {multipleChoice.allowsMultiple
          ? t('learners.exercise.multipleChoice.selectMany')
          : t('learners.exercise.multipleChoice.selectOne')}
      </Text>

      <View style={styles.optionsGrid}>
        {choices.map((choice) => {
          const selected = selectedSet.has(choice.id)
          return (
            <Pressable
              key={choice.id}
              accessibilityRole="button"
              onPress={() => toggleChoice(choice.id)}
              style={[
                styles.option,
                selected ? styles.optionSelected : undefined,
              ]}
            >
              <Text style={styles.optionText}>{choice.text}</Text>
            </Pressable>
          )
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={selectedChoiceIds.length === 0}
        onPress={() => setSubmitted(true)}
        style={[
          styles.submit,
          selectedChoiceIds.length === 0 ? styles.submitDisabled : undefined,
        ]}
      >
        <Text style={styles.submitLabel}>
          {t('learners.exercise.multipleChoice.submit')}
        </Text>
      </Pressable>

      {submitted ? (
        <Text
          style={isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}
        >
          {isCorrect
            ? t('learners.exercise.multipleChoice.correct')
            : t('learners.exercise.multipleChoice.incorrect')}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.sm,
  },
  title: {
    color: tokens.color.text,
    fontSize: tokens.font.size.lg,
    fontWeight: String(tokens.font.weight.bold) as '700',
  },
  question: {
    color: tokens.color.text,
    fontSize: tokens.font.size.md,
  },
  hint: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  optionsGrid: {
    gap: tokens.spacing.sm,
  },
  option: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
  },
  optionSelected: {
    borderColor: tokens.color.accent,
  },
  optionText: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
  },
  submit: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.primary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
  },
  submitDisabled: {
    opacity: tokens.opacity.disabled,
  },
  submitLabel: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  feedbackCorrect: {
    color: tokens.color.accent,
    fontSize: tokens.font.size.sm,
  },
  feedbackIncorrect: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
  },
})
