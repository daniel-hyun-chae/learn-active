import { useEffect, useMemo, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { tokens } from '@app/shared-tokens'
import type { Lesson } from './types'
import { FillInBlankExercise } from './exercises/FillInBlankExercise'
import { MultipleChoiceExercise } from './exercises/MultipleChoiceExercise'
import { ReorderingExercise } from './exercises/ReorderingExercise'

type LessonViewProps = {
  lesson: Lesson
  onBack: () => void
  initialSelection?: BlockSelection
  onSelectionChange?: (selection: BlockSelection) => void
}

type BlockSelection =
  | { type: 'summary' }
  | { type: 'contentPage'; contentPageId: string }
  | { type: 'exercise'; exerciseId: string }

function normalizeSelection(
  selection: BlockSelection | undefined,
  lesson: Lesson,
): BlockSelection {
  if (!selection) {
    return { type: 'summary' }
  }

  if (selection.type === 'contentPage') {
    const exists = lesson.contentPages.some(
      (contentPage) => contentPage.id === selection.contentPageId,
    )
    return exists ? selection : { type: 'summary' }
  }

  if (selection.type === 'exercise') {
    const exists = lesson.exercises.some(
      (exercise) => exercise.id === selection.exerciseId,
    )
    return exists ? selection : { type: 'summary' }
  }

  return selection
}

export function LessonView({
  lesson,
  onBack,
  initialSelection,
  onSelectionChange,
}: LessonViewProps) {
  const { t } = useTranslation()
  const [selection, setSelection] = useState<BlockSelection>(
    normalizeSelection(initialSelection, lesson),
  )

  useEffect(() => {
    setSelection(normalizeSelection(initialSelection, lesson))
  }, [lesson.id, initialSelection])

  useEffect(() => {
    onSelectionChange?.(selection)
  }, [onSelectionChange, selection])

  const contentPages = useMemo(
    () => [...lesson.contentPages].sort((a, b) => a.order - b.order),
    [lesson.contentPages],
  )

  const selectedContentPage = useMemo(() => {
    if (selection.type !== 'contentPage') {
      return undefined
    }
    return lesson.contentPages.find(
      (contentPage) => contentPage.id === selection.contentPageId,
    )
  }, [lesson.contentPages, selection])

  const selectedExercise = useMemo(() => {
    if (selection.type !== 'exercise') {
      return undefined
    }
    return lesson.exercises.find(
      (exercise) => exercise.id === selection.exerciseId,
    )
  }, [lesson.exercises, selection])

  function renderContentBlocks(contents: Lesson['contents']) {
    if (contents.length === 0) {
      return (
        <Text style={styles.missingText}>{t('learners.lesson.noContent')}</Text>
      )
    }

    return (
      <View style={styles.contentSection}>
        {contents.map((content) => (
          <View key={content.id} style={styles.contentCard}>
            {content.type === 'TEXT' ? (
              <Text style={styles.contentText}>{content.text}</Text>
            ) : null}
            {content.type === 'IMAGE' && content.imageUrl ? (
              <Image
                accessibilityLabel={
                  content.imageAlt ?? t('learners.lesson.imageAlt')
                }
                source={{ uri: content.imageUrl }}
                style={styles.contentImage}
              />
            ) : null}
          </View>
        ))}
      </View>
    )
  }

  function renderSelectedBlock() {
    if (selection.type === 'summary') {
      return renderContentBlocks(lesson.contents)
    }

    if (selection.type === 'contentPage') {
      if (!selectedContentPage) {
        return (
          <Text style={styles.missingText}>
            {t('learners.lesson.contentPageMissing')}
          </Text>
        )
      }

      return (
        <View style={styles.blockSection}>
          <Text style={styles.blockTitle}>{selectedContentPage.title}</Text>
          {renderContentBlocks(selectedContentPage.contents)}
        </View>
      )
    }

    if (!selectedExercise) {
      return (
        <Text style={styles.missingText}>
          {t('learners.lesson.noExercise')}
        </Text>
      )
    }

    return (
      <View style={styles.blockSection}>
        {selectedExercise.type === 'MULTIPLE_CHOICE' ? (
          <MultipleChoiceExercise
            exercise={
              selectedExercise as Extract<
                Lesson['exercises'][number],
                { type: 'MULTIPLE_CHOICE' }
              >
            }
          />
        ) : selectedExercise.type === 'REORDERING' ? (
          <ReorderingExercise
            exercise={
              selectedExercise as Extract<
                Lesson['exercises'][number],
                { type: 'REORDERING' }
              >
            }
          />
        ) : (
          <FillInBlankExercise
            exercise={
              selectedExercise as Extract<
                Lesson['exercises'][number],
                { type: 'FILL_IN_THE_BLANK' }
              >
            }
          />
        )}
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text style={styles.backLabel}>{t('mobile.learners.back')}</Text>
        </Pressable>
        <Text style={styles.subtitle}>{t('learners.lesson.subtitle')}</Text>
        <Text style={styles.title}>{lesson.title}</Text>
      </View>

      <View style={styles.navigatorCard}>
        <Text style={styles.navigatorTitle}>
          {t('learners.structure.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setSelection({ type: 'summary' })}
          style={[
            styles.navigatorItem,
            selection.type === 'summary' && styles.navigatorItemActive,
          ]}
        >
          <View>
            <Text style={styles.navigatorLabel}>
              {t('learners.structure.summary')}
            </Text>
            <Text style={styles.navigatorMeta}>
              {t('learners.structure.lesson')}
            </Text>
          </View>
        </Pressable>

        {contentPages.map((contentPage) => (
          <Pressable
            key={contentPage.id}
            accessibilityRole="button"
            onPress={() =>
              setSelection({
                type: 'contentPage',
                contentPageId: contentPage.id,
              })
            }
            style={[
              styles.navigatorItem,
              selection.type === 'contentPage' &&
                selection.contentPageId === contentPage.id &&
                styles.navigatorItemActive,
            ]}
          >
            <View>
              <Text style={styles.navigatorLabel}>{contentPage.title}</Text>
              <Text style={styles.navigatorMeta}>
                {t('learners.structure.contentPage')}
              </Text>
            </View>
          </Pressable>
        ))}

        {lesson.exercises.map((exercise) => (
          <Pressable
            key={exercise.id}
            accessibilityRole="button"
            onPress={() =>
              setSelection({
                type: 'exercise',
                exerciseId: exercise.id,
              })
            }
            style={[
              styles.navigatorItem,
              selection.type === 'exercise' &&
                selection.exerciseId === exercise.id &&
                styles.navigatorItemActive,
            ]}
          >
            <View>
              <Text style={styles.navigatorLabel}>{exercise.title}</Text>
              <Text style={styles.navigatorMeta}>
                {t('learners.structure.exercise')}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {renderSelectedBlock()}

      <Text style={styles.resumeHint}>{t('learners.lesson.resumeHint')}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.lg,
    backgroundColor: tokens.color.background,
  },
  header: {
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  backLabel: {
    color: tokens.color.accent,
    fontSize: tokens.font.size.sm,
    marginBottom: tokens.spacing.sm,
  },
  subtitle: {
    fontSize: tokens.font.size.sm,
    color: tokens.color.muted,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: tokens.font.size.xl,
    fontWeight: String(tokens.font.weight.bold) as '700',
    color: tokens.color.text,
  },
  navigatorCard: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    padding: tokens.spacing.sm,
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  navigatorTitle: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  navigatorItem: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.background,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
  },
  navigatorItemActive: {
    borderColor: tokens.color.accent,
  },
  navigatorLabel: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  navigatorMeta: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  contentSection: {
    gap: tokens.spacing.md,
  },
  blockSection: {
    gap: tokens.spacing.sm,
  },
  blockTitle: {
    color: tokens.color.text,
    fontSize: tokens.font.size.lg,
    fontWeight: String(tokens.font.weight.bold) as '700',
  },
  contentCard: {
    padding: tokens.spacing.md,
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
  },
  contentText: {
    color: tokens.color.text,
    fontSize: tokens.font.size.md,
    lineHeight: tokens.font.size.lg,
  },
  contentImage: {
    width: '100%',
    height: tokens.size.cardMin,
    borderRadius: tokens.radius.sm,
  },
  missingText: {
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
  },
  resumeHint: {
    marginTop: tokens.spacing.lg,
    color: tokens.color.muted,
    fontSize: tokens.font.size.sm,
    textAlign: 'center',
  },
})
