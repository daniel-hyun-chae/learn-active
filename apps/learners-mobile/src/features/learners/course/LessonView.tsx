import { useMemo, useState } from 'react'
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
import type { Exercise, Lesson } from './types'
import { FillInBlankExercise } from './exercises/FillInBlankExercise'

type LessonViewProps = {
  lesson: Lesson
  onBack: () => void
}

type Section = 'content' | 'exercise'

function getFillInBlankExercise(exercises: Exercise[]) {
  return exercises.find((exercise) => exercise.type === 'FILL_IN_THE_BLANK')
}

export function LessonView({ lesson, onBack }: LessonViewProps) {
  const { t } = useTranslation()
  const [section, setSection] = useState<Section>('content')

  const fillInBlank = useMemo(
    () => getFillInBlankExercise(lesson.exercises),
    [lesson.exercises],
  )

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text style={styles.backLabel}>{t('mobile.learners.back')}</Text>
        </Pressable>
        <Text style={styles.subtitle}>{t('learners.lesson.subtitle')}</Text>
        <Text style={styles.title}>{lesson.title}</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setSection('content')}
          style={[styles.tab, section === 'content' && styles.tabActive]}
        >
          <Text style={styles.tabLabel}>{t('learners.lesson.contentTab')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!fillInBlank}
          onPress={() => setSection('exercise')}
          style={[
            styles.tab,
            section === 'exercise' && styles.tabActive,
            !fillInBlank && styles.tabDisabled,
          ]}
        >
          <Text style={styles.tabLabel}>
            {t('learners.lesson.exerciseTab')}
          </Text>
        </Pressable>
      </View>

      {section === 'content' ? (
        <View style={styles.contentSection}>
          {lesson.contents.map((content) => (
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
          {fillInBlank ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSection('exercise')}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryLabel}>
                {t('learners.lesson.startExercise')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.exerciseSection}>
          {fillInBlank ? (
            <FillInBlankExercise exercise={fillInBlank} />
          ) : (
            <Text style={styles.noExerciseText}>
              {t('learners.lesson.noExercise')}
            </Text>
          )}
        </View>
      )}

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
  tabs: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  tab: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.sm,
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
  },
  tabActive: {
    borderColor: tokens.color.accent,
  },
  tabDisabled: {
    opacity: tokens.opacity.disabled,
  },
  tabLabel: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  contentSection: {
    gap: tokens.spacing.md,
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
  primaryLabel: {
    color: tokens.color.text,
    fontSize: tokens.font.size.sm,
    fontWeight: String(tokens.font.weight.medium) as '500',
  },
  exerciseSection: {
    borderWidth: tokens.border.width.sm,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    padding: tokens.spacing.md,
  },
  noExerciseText: {
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
