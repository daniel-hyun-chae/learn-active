import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { tokens } from '@app/shared-tokens'
import type { ReorderingExercise as ReorderingExerciseType } from '../types'

type ReorderingExerciseProps = {
  exercise: ReorderingExerciseType
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

export function ReorderingExercise({ exercise }: ReorderingExerciseProps) {
  const { t } = useTranslation()
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

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

  const selectedIndex = selectedItemId
    ? orderedIds.findIndex((id) => id === selectedItemId)
    : -1

  const isCorrect = useMemo(() => {
    if (!submitted) {
      return false
    }

    const expectedSequence = [...itemById.values()]
      .sort((a, b) => a.order - b.order)
      .filter((item) => !item.isDistractor)
      .map((item) => item.id)

    const learnerSequence = orderedIds.filter(
      (id) => !itemById.get(id)?.isDistractor,
    )

    if (expectedSequence.length !== learnerSequence.length) {
      return false
    }

    return learnerSequence.every((id, index) => id === expectedSequence[index])
  }, [submitted, orderedIds, itemById])

  function moveSelected(delta: -1 | 1) {
    if (selectedIndex < 0) {
      return
    }
    const nextIndex = selectedIndex + delta
    if (nextIndex < 0 || nextIndex >= orderedIds.length) {
      return
    }
    setSubmitted(false)
    setOrderedIds((previous) => moveItem(previous, selectedIndex, nextIndex))
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exercise.title}</Text>
      <Text style={styles.prompt}>{exercise.reordering.prompt}</Text>
      <Text style={styles.hint}>
        {t('learners.exercise.reordering.helper')}
      </Text>

      <View style={styles.list}>
        {orderedItems.map((item, index) => {
          if (!item) {
            return null
          }
          const selected = selectedItemId === item.id
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => {
                setSubmitted(false)
                setSelectedItemId(item.id)
              }}
              style={[styles.item, selected && styles.itemSelected]}
            >
              <Text
                style={styles.itemText}
              >{`${index + 1}. ${item.text}`}</Text>
              {item.isDistractor ? (
                <Text style={styles.itemMeta}>
                  {t('learners.exercise.reordering.distractorBadge')}
                </Text>
              ) : null}
            </Pressable>
          )
        })}
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => moveSelected(-1)}
          disabled={selectedIndex <= 0}
          style={[
            styles.secondaryButton,
            selectedIndex <= 0 && styles.secondaryButtonDisabled,
          ]}
        >
          <Text style={styles.secondaryButtonLabel}>
            {t('publishers.actions.moveUp')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => moveSelected(1)}
          disabled={
            selectedIndex < 0 || selectedIndex >= orderedItems.length - 1
          }
          style={[
            styles.secondaryButton,
            (selectedIndex < 0 || selectedIndex >= orderedItems.length - 1) &&
              styles.secondaryButtonDisabled,
          ]}
        >
          <Text style={styles.secondaryButtonLabel}>
            {t('publishers.actions.moveDown')}
          </Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setSubmitted(true)}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonLabel}>
          {t('learners.exercise.reordering.submit')}
        </Text>
      </Pressable>

      {submitted ? (
        <Text
          style={isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}
        >
          {isCorrect
            ? t('learners.exercise.reordering.correct')
            : t('learners.exercise.reordering.incorrect')}
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
  prompt: {
    color: tokens.color.text,
    fontSize: tokens.font.size.md,
  },
  hint: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  list: {
    gap: tokens.spacing.sm,
  },
  item: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    gap: tokens.spacing.xs,
  },
  itemSelected: {
    borderColor: tokens.color.accent,
  },
  itemText: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
  },
  itemMeta: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  secondaryButton: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.color.surface,
  },
  secondaryButtonDisabled: {
    opacity: tokens.opacity.disabled,
  },
  secondaryButtonLabel: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.color.primary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.sm,
  },
  primaryButtonLabel: {
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
