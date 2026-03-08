import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { tokenVars } from '@app/shared-tokens'
import { PrimaryButton, Surface } from '@app/shared-ui'
import { fetchGraphQL } from '../../shared/api/graphql'
import type {
  ContentDraft,
  CourseDraft,
  ExerciseBlankDraft,
  ExerciseDraft,
  ExerciseStepDraft,
  LessonContentPageDraft,
  LessonDraft,
  ModuleDraft,
} from './types'
import { RichTextEditor } from './components/RichTextEditor'
import {
  BLANK_TOKEN,
  blankTemplateToSegments,
  createId,
  normalizeBlankOptions,
  normalizeDraft,
  parseBlankOptions,
  reindexContentPages,
  reindexLessons,
  reindexModules,
  segmentsToBlankTemplate,
  syncBlanks,
  toCourseInput,
} from './publisher-utils'
import type { Exercise, Lesson } from '../learners/course/types'
import { LessonView } from '../learners/course/LessonView'
import { FillInBlankExercise } from '../learners/course/exercises/FillInBlankExercise'

type PublisherHomeProps = {
  course: CourseDraft
}

type Status = { type: 'idle' | 'saving' | 'saved' | 'error'; message?: string }

type Selection =
  | { type: 'course' }
  | { type: 'module'; moduleId: string }
  | { type: 'lesson'; moduleId: string; lessonId: string }
  | {
      type: 'contentPage'
      moduleId: string
      lessonId: string
      pageId: string
    }
  | {
      type: 'exercise'
      moduleId: string
      lessonId: string
      exerciseId: string
    }

type PanelKey = 'structure' | 'designer' | 'preview'

function toLearnerExercise(exercise: ExerciseDraft): Exercise {
  return {
    id: exercise.id ?? createId('exercise'),
    type: 'FILL_IN_THE_BLANK',
    title: exercise.title,
    instructions: exercise.instructions,
    steps: exercise.steps.map((step) => {
      const templateValue =
        typeof step.template === 'string' ? step.template : undefined
      const safeTemplate =
        templateValue ?? segmentsToBlankTemplate(step.segments) ?? ''
      const blanks = syncBlanks(safeTemplate, step.blanks)
      return {
        id: step.id ?? createId('step'),
        order: step.order,
        prompt: step.prompt,
        threadId: step.threadId,
        threadTitle: step.threadTitle,
        segments: blankTemplateToSegments(safeTemplate, blanks),
        blanks: blanks.map((blank) => ({
          id: blank.id ?? createId('blank'),
          correct: blank.correct,
          variant: blank.variant,
          options:
            blank.variant === 'OPTIONS'
              ? parseBlankOptions(blank.options)
              : undefined,
        })),
      }
    }),
  }
}

function toLearnerLesson(lesson: LessonDraft): Lesson {
  return {
    id: lesson.id ?? createId('lesson'),
    title: lesson.title,
    order: lesson.order,
    contents: lesson.contents.map((content) => ({
      id: content.id ?? createId('content'),
      type: content.type,
      text: content.text ?? '',
      imageUrl: content.imageUrl,
      imageAlt: content.imageAlt,
    })),
    contentPages: (lesson.contentPages ?? [])
      .sort((a, b) => a.order - b.order)
      .map((page) => ({
        id: page.id ?? createId('content-page'),
        title: page.title,
        order: page.order,
        contents: page.contents.map((content) => ({
          id: content.id ?? createId('content'),
          type: content.type,
          text: content.text ?? '',
          imageUrl: content.imageUrl,
          imageAlt: content.imageAlt,
        })),
      })),
    exercises: lesson.exercises.map(toLearnerExercise),
  }
}

export function PublisherHome({ course }: PublisherHomeProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<CourseDraft>(() => normalizeDraft(course))
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [selection, setSelection] = useState<Selection>({ type: 'course' })
  const [collapsedPanels, setCollapsedPanels] = useState<
    Record<PanelKey, boolean>
  >({
    structure: false,
    designer: false,
    preview: false,
  })

  useEffect(() => {
    setDraft(normalizeDraft(course))
    setSelection({ type: 'course' })
    setStatus({ type: 'idle' })
  }, [course])

  const selectedModule = useMemo(() => {
    if (selection.type === 'module') {
      return draft.modules.find((module) => module.id === selection.moduleId)
    }
    if (
      selection.type === 'lesson' ||
      selection.type === 'contentPage' ||
      selection.type === 'exercise'
    ) {
      return draft.modules.find((module) => module.id === selection.moduleId)
    }
    return undefined
  }, [draft.modules, selection])

  const selectedLesson = useMemo(() => {
    if (
      selection.type === 'lesson' ||
      selection.type === 'contentPage' ||
      selection.type === 'exercise'
    ) {
      return selectedModule?.lessons.find(
        (lesson) => lesson.id === selection.lessonId,
      )
    }
    return undefined
  }, [selectedModule, selection])

  const selectedContentPage = useMemo(() => {
    if (selection.type !== 'contentPage') return undefined
    return selectedLesson?.contentPages.find(
      (page) => page.id === selection.pageId,
    )
  }, [selection, selectedLesson])

  const selectedExercise = useMemo(() => {
    if (selection.type !== 'exercise') return undefined
    return selectedLesson?.exercises.find(
      (exercise) => exercise.id === selection.exerciseId,
    )
  }, [selection, selectedLesson])

  const previewLessons = useMemo(() => {
    const orderedModules = [...draft.modules].sort((a, b) => a.order - b.order)
    return orderedModules.flatMap((module) =>
      [...module.lessons]
        .sort((a, b) => a.order - b.order)
        .map(toLearnerLesson),
    )
  }, [draft.modules])

  const selectionLabel = useMemo(() => {
    if (selection.type === 'course') return t('publishers.selection.course')
    if (selection.type === 'module') return t('publishers.selection.module')
    if (selection.type === 'lesson') return t('publishers.selection.lesson')
    if (selection.type === 'contentPage') {
      return t('publishers.selection.contentPage')
    }
    return t('publishers.selection.exercise')
  }, [selection, t])

  const layoutClassName = useMemo(() => {
    const classes = ['publisher-layout', 'publisher-layout-parallel']
    if (collapsedPanels.structure) {
      classes.push('publisher-layout-structure-collapsed')
    }
    if (collapsedPanels.designer) {
      classes.push('publisher-layout-designer-collapsed')
    }
    if (collapsedPanels.preview) {
      classes.push('publisher-layout-preview-collapsed')
    }
    return classes.join(' ')
  }, [collapsedPanels])

  function togglePanel(panel: PanelKey) {
    setCollapsedPanels((prev) => ({
      ...prev,
      [panel]: !prev[panel],
    }))
  }

  function updateDraft(partial: Partial<CourseDraft>) {
    setDraft((prev) => ({ ...prev, ...partial }))
  }

  function updateModules(updater: (modules: ModuleDraft[]) => ModuleDraft[]) {
    setDraft((prev) => ({
      ...prev,
      modules: reindexModules(updater(prev.modules)),
    }))
  }

  function updateModuleById(
    moduleId: string,
    updater: (module: ModuleDraft) => ModuleDraft,
  ) {
    updateModules((modules) =>
      modules.map((module) =>
        module.id === moduleId ? updater(module) : module,
      ),
    )
  }

  function updateLessonById(
    moduleId: string,
    lessonId: string,
    updater: (lesson: LessonDraft) => LessonDraft,
  ) {
    updateModules((modules) =>
      modules.map((module) => {
        if (module.id !== moduleId) return module
        const lessons = module.lessons.map((lesson) =>
          lesson.id === lessonId ? updater(lesson) : lesson,
        )
        return { ...module, lessons: reindexLessons(lessons) }
      }),
    )
  }

  function updateContentPageById(
    moduleId: string,
    lessonId: string,
    pageId: string,
    updater: (page: LessonContentPageDraft) => LessonContentPageDraft,
  ) {
    updateLessonById(moduleId, lessonId, (lesson) => {
      const contentPages = reindexContentPages(
        (lesson.contentPages ?? []).map((page) =>
          page.id === pageId ? updater(page) : page,
        ),
      )
      return { ...lesson, contentPages }
    })
  }

  function updateExerciseById(
    moduleId: string,
    lessonId: string,
    exerciseId: string,
    updater: (exercise: ExerciseDraft) => ExerciseDraft,
  ) {
    updateLessonById(moduleId, lessonId, (lesson) => {
      const exercises = lesson.exercises.map((exercise) =>
        exercise.id === exerciseId ? updater(exercise) : exercise,
      )
      return { ...lesson, exercises }
    })
  }

  async function handleSeed() {
    setStatus({ type: 'saving' })
    try {
      const data = await fetchGraphQL<{ seedSampleCourse: CourseDraft }>(
        `mutation SeedSampleCourse {
          seedSampleCourse {
            id
            title
            description
            modules {
              id
              title
              order
              lessons {
                id
                title
                order
                contents { id type text imageUrl imageAlt lexicalJson }
                contentPages {
                  id
                  title
                  order
                  contents { id type text imageUrl imageAlt lexicalJson }
                }
                exercises {
                  id
                  type
                  title
                  instructions
                  steps {
                    id
                    order
                    prompt
                    threadId
                    threadTitle
                    segments { type text blankId }
                    blanks { id correct variant options }
                  }
                }
              }
            }
          }
        }`,
      )
      setDraft(normalizeDraft(data.seedSampleCourse))
      setSelection({ type: 'course' })
      setStatus({ type: 'saved', message: t('publishers.status.seeded') })
    } catch (error) {
      setStatus({ type: 'error', message: (error as Error).message })
    }
  }

  async function handleSave() {
    setStatus({ type: 'saving' })
    try {
      const input = toCourseInput(draft)
      const data = await fetchGraphQL<{ upsertCourse: CourseDraft }>(
        `mutation SaveCourse($input: CourseInput!) {
          upsertCourse(input: $input) {
            id
            title
            description
            modules {
              id
              title
              order
              lessons {
                id
                title
                order
                contents { id type text imageUrl imageAlt lexicalJson }
                contentPages {
                  id
                  title
                  order
                  contents { id type text imageUrl imageAlt lexicalJson }
                }
                exercises {
                  id
                  type
                  title
                  instructions
                  steps {
                    id
                    order
                    prompt
                    threadId
                    threadTitle
                    segments { type text blankId }
                    blanks { id correct variant options }
                  }
                }
              }
            }
          }
        }`,
        { input },
      )
      setDraft(normalizeDraft(data.upsertCourse))
      setStatus({ type: 'saved', message: t('publishers.status.saved') })
    } catch (error) {
      setStatus({ type: 'error', message: (error as Error).message })
    }
  }

  function addModule() {
    const moduleId = createId('module')
    updateModules((modules) => [
      ...modules,
      {
        id: moduleId,
        title: t('publishers.module.newTitle'),
        order: modules.length + 1,
        lessons: [],
      },
    ])
    setSelection({ type: 'module', moduleId })
  }

  function addLesson(moduleId: string) {
    const lessonId = createId('lesson')
    updateModuleById(moduleId, (module) => ({
      ...module,
      lessons: [
        ...module.lessons,
        {
          id: lessonId,
          title: t('publishers.lesson.newTitle'),
          order: module.lessons.length + 1,
          contents: [],
          contentPages: [],
          exercises: [],
        },
      ],
    }))
    setSelection({ type: 'lesson', moduleId, lessonId })
  }

  function addSummaryContent(
    moduleId: string,
    lessonId: string,
    type: 'TEXT' | 'IMAGE',
  ) {
    updateLessonById(moduleId, lessonId, (lesson) => ({
      ...lesson,
      contents: [
        ...lesson.contents,
        {
          id: createId('content'),
          type,
          text: type === 'TEXT' ? '' : undefined,
          lexicalJson: type === 'TEXT' ? '' : undefined,
          imageUrl: type === 'IMAGE' ? '' : undefined,
          imageAlt: type === 'IMAGE' ? '' : undefined,
        },
      ],
    }))
  }

  function addContentPage(moduleId: string, lessonId: string) {
    const pageId = createId('content-page')
    updateLessonById(moduleId, lessonId, (lesson) => ({
      ...lesson,
      contentPages: [
        ...lesson.contentPages,
        {
          id: pageId,
          title: t('publishers.contentPage.newTitle'),
          order: lesson.contentPages.length + 1,
          contents: [],
        },
      ],
    }))
    setSelection({ type: 'contentPage', moduleId, lessonId, pageId })
  }

  function addContentPageContent(
    moduleId: string,
    lessonId: string,
    pageId: string,
    type: 'TEXT' | 'IMAGE',
  ) {
    updateContentPageById(moduleId, lessonId, pageId, (page) => ({
      ...page,
      contents: [
        ...page.contents,
        {
          id: createId('content-page-item'),
          type,
          text: type === 'TEXT' ? '' : undefined,
          lexicalJson: type === 'TEXT' ? '' : undefined,
          imageUrl: type === 'IMAGE' ? '' : undefined,
          imageAlt: type === 'IMAGE' ? '' : undefined,
        },
      ],
    }))
  }

  function addExercise(moduleId: string, lessonId: string) {
    const exerciseId = createId('exercise')
    updateLessonById(moduleId, lessonId, (lesson) => ({
      ...lesson,
      exercises: [
        ...lesson.exercises,
        {
          id: exerciseId,
          type: 'FILL_IN_THE_BLANK',
          title: t('publishers.exercise.newTitle'),
          instructions: '',
          steps: [
            {
              id: createId('step'),
              order: 1,
              prompt: t('publishers.exercise.promptPlaceholder'),
              threadId: 'thread-1',
              threadTitle: t('publishers.exercise.threadTitle'),
              template: BLANK_TOKEN,
              blanks: syncBlanks(BLANK_TOKEN, []),
            },
          ],
        },
      ],
    }))
    setSelection({ type: 'exercise', moduleId, lessonId, exerciseId })
  }

  function deleteModule(moduleId: string) {
    updateModules((modules) =>
      modules.filter((module) => module.id !== moduleId),
    )
    if (
      selection.type !== 'course' &&
      selection.type !== 'module' &&
      selection.moduleId === moduleId
    ) {
      setSelection({ type: 'course' })
      return
    }
    if (selection.type === 'module' && selection.moduleId === moduleId) {
      setSelection({ type: 'course' })
    }
  }

  function deleteLesson(moduleId: string, lessonId: string) {
    updateModuleById(moduleId, (module) => ({
      ...module,
      lessons: module.lessons.filter((lesson) => lesson.id !== lessonId),
    }))
    if (
      (selection.type === 'lesson' ||
        selection.type === 'contentPage' ||
        selection.type === 'exercise') &&
      selection.moduleId === moduleId &&
      selection.lessonId === lessonId
    ) {
      setSelection({ type: 'module', moduleId })
    }
  }

  function deleteContentPage(
    moduleId: string,
    lessonId: string,
    pageId: string,
  ) {
    updateLessonById(moduleId, lessonId, (lesson) => ({
      ...lesson,
      contentPages: lesson.contentPages.filter((page) => page.id !== pageId),
    }))
    if (
      selection.type === 'contentPage' &&
      selection.moduleId === moduleId &&
      selection.lessonId === lessonId &&
      selection.pageId === pageId
    ) {
      setSelection({ type: 'lesson', moduleId, lessonId })
    }
  }

  function deleteExercise(
    moduleId: string,
    lessonId: string,
    exerciseId: string,
  ) {
    updateLessonById(moduleId, lessonId, (lesson) => ({
      ...lesson,
      exercises: lesson.exercises.filter(
        (exercise) => exercise.id !== exerciseId,
      ),
    }))
    if (
      selection.type === 'exercise' &&
      selection.moduleId === moduleId &&
      selection.lessonId === lessonId &&
      selection.exerciseId === exerciseId
    ) {
      setSelection({ type: 'lesson', moduleId, lessonId })
    }
  }

  function moveModule(moduleId: string, direction: -1 | 1) {
    updateModules((modules) => {
      const index = modules.findIndex((module) => module.id === moduleId)
      const nextIndex = index + direction
      if (index === -1 || nextIndex < 0 || nextIndex >= modules.length) {
        return modules
      }
      const next = [...modules]
      const [moved] = next.splice(index, 1)
      next.splice(nextIndex, 0, moved)
      return next
    })
  }

  function moveContentPage(
    moduleId: string,
    lessonId: string,
    pageId: string,
    direction: -1 | 1,
  ) {
    updateLessonById(moduleId, lessonId, (lesson) => {
      const index = lesson.contentPages.findIndex((page) => page.id === pageId)
      const nextIndex = index + direction
      if (
        index === -1 ||
        nextIndex < 0 ||
        nextIndex >= lesson.contentPages.length
      ) {
        return lesson
      }
      const contentPages = [...lesson.contentPages]
      const [moved] = contentPages.splice(index, 1)
      contentPages.splice(nextIndex, 0, moved)
      return { ...lesson, contentPages }
    })
  }

  function moveLesson(moduleId: string, lessonId: string, direction: -1 | 1) {
    let movedToModuleId: string | undefined

    updateModules((modules) => {
      const next = modules.map((module) => ({
        ...module,
        lessons: [...module.lessons],
      }))

      const moduleIndex = next.findIndex((module) => module.id === moduleId)
      if (moduleIndex === -1) return modules
      const lessonIndex = next[moduleIndex].lessons.findIndex(
        (lesson) => lesson.id === lessonId,
      )
      if (lessonIndex === -1) return modules

      const [movedLesson] = next[moduleIndex].lessons.splice(lessonIndex, 1)
      if (!movedLesson) return modules

      if (direction === -1) {
        if (lessonIndex > 0) {
          next[moduleIndex].lessons.splice(lessonIndex - 1, 0, movedLesson)
          movedToModuleId = next[moduleIndex].id
          return next
        }

        let previousModuleIndex = moduleIndex - 1
        while (
          previousModuleIndex >= 0 &&
          next[previousModuleIndex].lessons.length === 0
        ) {
          previousModuleIndex -= 1
        }

        if (previousModuleIndex < 0) {
          next[moduleIndex].lessons.splice(lessonIndex, 0, movedLesson)
          return modules
        }

        next[previousModuleIndex].lessons.push(movedLesson)
        movedToModuleId = next[previousModuleIndex].id
        return next
      }

      if (lessonIndex < next[moduleIndex].lessons.length) {
        next[moduleIndex].lessons.splice(lessonIndex + 1, 0, movedLesson)
        movedToModuleId = next[moduleIndex].id
        return next
      }

      let nextModuleIndex = moduleIndex + 1
      while (
        nextModuleIndex < next.length &&
        next[nextModuleIndex].lessons.length === 0
      ) {
        nextModuleIndex += 1
      }

      if (nextModuleIndex >= next.length) {
        next[moduleIndex].lessons.splice(lessonIndex, 0, movedLesson)
        return modules
      }

      next[nextModuleIndex].lessons.unshift(movedLesson)
      movedToModuleId = next[nextModuleIndex].id
      return next
    })

    if (!movedToModuleId) return

    if (selection.type === 'lesson' && selection.lessonId === lessonId) {
      setSelection({
        type: 'lesson',
        moduleId: movedToModuleId,
        lessonId,
      })
      return
    }

    if (selection.type === 'contentPage' && selection.lessonId === lessonId) {
      setSelection({
        ...selection,
        moduleId: movedToModuleId,
      })
      return
    }

    if (selection.type === 'exercise' && selection.lessonId === lessonId) {
      setSelection({
        ...selection,
        moduleId: movedToModuleId,
      })
    }
  }

  function moveExercise(
    moduleId: string,
    lessonId: string,
    exerciseId: string,
    direction: -1 | 1,
  ) {
    let targetModuleId: string | undefined
    let targetLessonId: string | undefined

    updateModules((modules) => {
      const next = modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          exercises: [...lesson.exercises],
        })),
      }))

      const sourceModuleIndex = next.findIndex(
        (module) => module.id === moduleId,
      )
      if (sourceModuleIndex === -1) return modules
      const sourceLessonIndex = next[sourceModuleIndex].lessons.findIndex(
        (lesson) => lesson.id === lessonId,
      )
      if (sourceLessonIndex === -1) return modules

      const sourceLesson = next[sourceModuleIndex].lessons[sourceLessonIndex]
      const sourceExerciseIndex = sourceLesson.exercises.findIndex(
        (exercise) => exercise.id === exerciseId,
      )
      if (sourceExerciseIndex === -1) return modules

      const [movedExercise] = sourceLesson.exercises.splice(
        sourceExerciseIndex,
        1,
      )
      if (!movedExercise) return modules

      if (direction === -1) {
        if (sourceExerciseIndex > 0) {
          sourceLesson.exercises.splice(
            sourceExerciseIndex - 1,
            0,
            movedExercise,
          )
          targetModuleId = next[sourceModuleIndex].id
          targetLessonId = sourceLesson.id
          return next
        }

        let targetModuleIndex = sourceModuleIndex
        let targetLessonIndex = sourceLessonIndex - 1
        while (targetModuleIndex >= 0) {
          if (targetLessonIndex >= 0) break
          targetModuleIndex -= 1
          if (targetModuleIndex >= 0) {
            targetLessonIndex = next[targetModuleIndex].lessons.length - 1
          }
        }

        if (targetModuleIndex < 0 || targetLessonIndex < 0) {
          sourceLesson.exercises.splice(sourceExerciseIndex, 0, movedExercise)
          return modules
        }

        const targetLesson = next[targetModuleIndex].lessons[targetLessonIndex]
        targetLesson.exercises.push(movedExercise)
        targetModuleId = next[targetModuleIndex].id
        targetLessonId = targetLesson.id
        return next
      }

      if (sourceExerciseIndex < sourceLesson.exercises.length) {
        sourceLesson.exercises.splice(sourceExerciseIndex + 1, 0, movedExercise)
        targetModuleId = next[sourceModuleIndex].id
        targetLessonId = sourceLesson.id
        return next
      }

      let targetModuleIndex = sourceModuleIndex
      let targetLessonIndex = sourceLessonIndex + 1
      while (targetModuleIndex < next.length) {
        if (targetLessonIndex < next[targetModuleIndex].lessons.length) break
        targetModuleIndex += 1
        targetLessonIndex = 0
      }

      if (targetModuleIndex >= next.length) {
        sourceLesson.exercises.splice(sourceExerciseIndex, 0, movedExercise)
        return modules
      }

      const targetLesson = next[targetModuleIndex].lessons[targetLessonIndex]
      targetLesson.exercises.unshift(movedExercise)
      targetModuleId = next[targetModuleIndex].id
      targetLessonId = targetLesson.id
      return next
    })

    if (selection.type === 'exercise' && selection.exerciseId === exerciseId) {
      setSelection({
        type: 'exercise',
        moduleId: targetModuleId ?? moduleId,
        lessonId: targetLessonId ?? lessonId,
        exerciseId,
      })
    }
  }

  function renderContentEditor(
    contents: ContentDraft[],
    updateContent: (index: number, partial: Partial<ContentDraft>) => void,
    baseTestId: string,
  ) {
    if (contents.length === 0) {
      return <p className="muted">{t('publishers.content.empty')}</p>
    }

    return contents.map((content, contentIndex) => (
      <div key={content.id} className="publisher-content-block">
        {content.type === 'TEXT' ? (
          <RichTextEditor
            initialText={content.text}
            placeholder={t('publishers.content.textPlaceholder')}
            onChange={(value) =>
              updateContent(contentIndex, {
                lexicalJson: value.lexicalJson,
                text: value.text,
              })
            }
          />
        ) : (
          <div className="publisher-grid">
            <label className="publisher-field">
              {t('publishers.content.imageUrl')}
              <input
                type="text"
                data-test={`${baseTestId}-image-url`}
                value={content.imageUrl ?? ''}
                onChange={(event) =>
                  updateContent(contentIndex, {
                    imageUrl: event.target.value,
                  })
                }
              />
            </label>
            <label className="publisher-field">
              {t('publishers.content.imageAlt')}
              <input
                type="text"
                data-test={`${baseTestId}-image-alt`}
                value={content.imageAlt ?? ''}
                onChange={(event) =>
                  updateContent(contentIndex, {
                    imageAlt: event.target.value,
                  })
                }
              />
            </label>
          </div>
        )}
      </div>
    ))
  }

  function renderEditor() {
    if (selection.type === 'course') {
      return (
        <div className="publisher-grid">
          <label className="publisher-field">
            {t('publishers.course.title')}
            <input
              type="text"
              data-test="publisher-course-title"
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
            />
          </label>
          <label className="publisher-field publisher-full">
            {t('publishers.course.description')}
            <textarea
              data-test="publisher-course-description"
              value={draft.description}
              onChange={(event) =>
                updateDraft({ description: event.target.value })
              }
            />
          </label>
        </div>
      )
    }

    if (selection.type === 'module' && selectedModule) {
      return (
        <div className="publisher-grid">
          <label className="publisher-field publisher-full">
            {t('publishers.modules.name')}
            <input
              type="text"
              data-test="publisher-module-title"
              value={selectedModule.title}
              onChange={(event) =>
                updateModuleById(selection.moduleId, (module) => ({
                  ...module,
                  title: event.target.value,
                }))
              }
            />
          </label>
          <div className="publisher-inline-actions publisher-full">
            <button
              type="button"
              className="ghost-button"
              data-test="publisher-module-add-lesson"
              onClick={() => addLesson(selection.moduleId)}
            >
              {t('publishers.lessons.add')}
            </button>
            <button
              type="button"
              className="ghost-button"
              data-test="publisher-module-delete"
              onClick={() => deleteModule(selection.moduleId)}
            >
              {t('publishers.actions.delete')}
            </button>
          </div>
        </div>
      )
    }

    if (selection.type === 'lesson' && selectedLesson) {
      return (
        <div className="publisher-stack">
          <div className="publisher-grid">
            <label className="publisher-field publisher-full">
              {t('publishers.lessons.name')}
              <input
                type="text"
                data-test="publisher-lesson-title"
                value={selectedLesson.title}
                onChange={(event) =>
                  updateLessonById(
                    selection.moduleId,
                    selection.lessonId,
                    (lesson) => ({
                      ...lesson,
                      title: event.target.value,
                    }),
                  )
                }
              />
            </label>
            <div className="publisher-inline-actions publisher-full">
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-lesson-add-text"
                onClick={() =>
                  addSummaryContent(
                    selection.moduleId,
                    selection.lessonId,
                    'TEXT',
                  )
                }
              >
                {t('publishers.content.addText')}
              </button>
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-lesson-add-image"
                onClick={() =>
                  addSummaryContent(
                    selection.moduleId,
                    selection.lessonId,
                    'IMAGE',
                  )
                }
              >
                {t('publishers.content.addImage')}
              </button>
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-lesson-add-content-page"
                onClick={() =>
                  addContentPage(selection.moduleId, selection.lessonId)
                }
              >
                {t('publishers.contentPages.add')}
              </button>
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-lesson-add-exercise"
                onClick={() =>
                  addExercise(selection.moduleId, selection.lessonId)
                }
              >
                {t('publishers.exercise.add')}
              </button>
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-lesson-delete"
                onClick={() =>
                  deleteLesson(selection.moduleId, selection.lessonId)
                }
              >
                {t('publishers.actions.delete')}
              </button>
            </div>
          </div>

          <div className="publisher-section">
            <h4>{t('publishers.summary.title')}</h4>
            {renderContentEditor(
              selectedLesson.contents,
              (contentIndex, partial) => {
                updateLessonById(
                  selection.moduleId,
                  selection.lessonId,
                  (lesson) => {
                    const contents = [...lesson.contents]
                    contents[contentIndex] = {
                      ...contents[contentIndex],
                      ...partial,
                    }
                    return { ...lesson, contents }
                  },
                )
              },
              'publisher-summary-content',
            )}
          </div>

          <div className="publisher-section">
            <h4>{t('publishers.contentPages.title')}</h4>
            {(selectedLesson.contentPages ?? []).map((page) => (
              <button
                key={page.id}
                type="button"
                className={
                  selection.type === 'contentPage' &&
                  selection.pageId === page.id
                    ? 'publisher-node selected'
                    : 'publisher-node'
                }
                onClick={() =>
                  setSelection({
                    type: 'contentPage',
                    moduleId: selection.moduleId,
                    lessonId: selection.lessonId,
                    pageId: page.id ?? '',
                  })
                }
              >
                <span>{page.title}</span>
                <span className="muted">
                  {t('publishers.structure.contentPage')}
                </span>
              </button>
            ))}
            {(selectedLesson.contentPages ?? []).length === 0 ? (
              <p className="muted">{t('publishers.contentPages.empty')}</p>
            ) : null}
          </div>

          <div className="publisher-section">
            <h4>{t('publishers.exercise.title')}</h4>
            {selectedLesson.exercises.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                className={
                  selection.type === 'exercise' &&
                  selection.exerciseId === exercise.id
                    ? 'publisher-node selected'
                    : 'publisher-node'
                }
                onClick={() =>
                  setSelection({
                    type: 'exercise',
                    moduleId: selection.moduleId,
                    lessonId: selection.lessonId,
                    exerciseId: exercise.id ?? '',
                  })
                }
              >
                <span>{exercise.title}</span>
                <span className="muted">{exercise.type}</span>
              </button>
            ))}
            {selectedLesson.exercises.length === 0 ? (
              <p className="muted">{t('publishers.exercise.empty')}</p>
            ) : null}
          </div>
        </div>
      )
    }

    if (
      selection.type === 'contentPage' &&
      selectedLesson &&
      selectedContentPage
    ) {
      return (
        <div className="publisher-stack">
          <div className="publisher-grid">
            <label className="publisher-field publisher-full">
              {t('publishers.contentPage.title')}
              <input
                type="text"
                data-test="publisher-content-page-title"
                value={selectedContentPage.title}
                onChange={(event) =>
                  updateContentPageById(
                    selection.moduleId,
                    selection.lessonId,
                    selection.pageId,
                    (page) => ({
                      ...page,
                      title: event.target.value,
                    }),
                  )
                }
              />
            </label>
            <div className="publisher-inline-actions publisher-full">
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-content-page-add-text"
                onClick={() =>
                  addContentPageContent(
                    selection.moduleId,
                    selection.lessonId,
                    selection.pageId,
                    'TEXT',
                  )
                }
              >
                {t('publishers.content.addText')}
              </button>
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-content-page-add-image"
                onClick={() =>
                  addContentPageContent(
                    selection.moduleId,
                    selection.lessonId,
                    selection.pageId,
                    'IMAGE',
                  )
                }
              >
                {t('publishers.content.addImage')}
              </button>
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-content-page-delete"
                onClick={() =>
                  deleteContentPage(
                    selection.moduleId,
                    selection.lessonId,
                    selection.pageId,
                  )
                }
              >
                {t('publishers.actions.delete')}
              </button>
            </div>
          </div>

          <div className="publisher-section">
            <h4>{t('publishers.content.title')}</h4>
            {renderContentEditor(
              selectedContentPage.contents,
              (contentIndex, partial) => {
                updateContentPageById(
                  selection.moduleId,
                  selection.lessonId,
                  selection.pageId,
                  (page) => {
                    const contents = [...page.contents]
                    contents[contentIndex] = {
                      ...contents[contentIndex],
                      ...partial,
                    }
                    return { ...page, contents }
                  },
                )
              },
              'publisher-content-page-content',
            )}
          </div>
        </div>
      )
    }

    if (selection.type === 'exercise' && selectedExercise && selectedLesson) {
      return (
        <div className="publisher-stack">
          <div className="publisher-grid">
            <label className="publisher-field publisher-full">
              {t('publishers.exercise.name')}
              <input
                type="text"
                data-test="publisher-exercise-title"
                value={selectedExercise.title}
                onChange={(event) =>
                  updateExerciseById(
                    selection.moduleId,
                    selection.lessonId,
                    selection.exerciseId,
                    (exercise) => ({
                      ...exercise,
                      title: event.target.value,
                    }),
                  )
                }
              />
            </label>
            <label className="publisher-field publisher-full">
              {t('publishers.exercise.instructions')}
              <textarea
                data-test="publisher-exercise-instructions"
                value={selectedExercise.instructions ?? ''}
                onChange={(event) =>
                  updateExerciseById(
                    selection.moduleId,
                    selection.lessonId,
                    selection.exerciseId,
                    (exercise) => ({
                      ...exercise,
                      instructions: event.target.value,
                    }),
                  )
                }
              />
            </label>
            <div className="publisher-inline-actions publisher-full">
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-exercise-delete"
                onClick={() =>
                  deleteExercise(
                    selection.moduleId,
                    selection.lessonId,
                    selection.exerciseId,
                  )
                }
              >
                {t('publishers.actions.delete')}
              </button>
            </div>
          </div>

          {selectedExercise.steps.map(
            (step: ExerciseStepDraft, stepIndex: number) => (
              <div key={step.id} className="publisher-step">
                <label className="publisher-field">
                  {t('publishers.exercise.prompt')}
                  <input
                    type="text"
                    data-test="publisher-step-prompt"
                    value={step.prompt}
                    onChange={(event) =>
                      updateExerciseById(
                        selection.moduleId,
                        selection.lessonId,
                        selection.exerciseId,
                        (exercise) => {
                          const steps = [...exercise.steps]
                          steps[stepIndex] = {
                            ...steps[stepIndex],
                            prompt: event.target.value,
                          }
                          return { ...exercise, steps }
                        },
                      )
                    }
                  />
                </label>
                <div className="publisher-grid">
                  <label className="publisher-field">
                    {t('publishers.exercise.threadId')}
                    <input
                      type="text"
                      data-test="publisher-step-thread-id"
                      value={step.threadId}
                      onChange={(event) =>
                        updateExerciseById(
                          selection.moduleId,
                          selection.lessonId,
                          selection.exerciseId,
                          (exercise) => {
                            const steps = [...exercise.steps]
                            steps[stepIndex] = {
                              ...steps[stepIndex],
                              threadId: event.target.value,
                            }
                            return { ...exercise, steps }
                          },
                        )
                      }
                    />
                  </label>
                  <label className="publisher-field">
                    {t('publishers.exercise.threadTitle')}
                    <input
                      type="text"
                      data-test="publisher-step-thread-title"
                      value={step.threadTitle ?? ''}
                      onChange={(event) =>
                        updateExerciseById(
                          selection.moduleId,
                          selection.lessonId,
                          selection.exerciseId,
                          (exercise) => {
                            const steps = [...exercise.steps]
                            steps[stepIndex] = {
                              ...steps[stepIndex],
                              threadTitle: event.target.value,
                            }
                            return { ...exercise, steps }
                          },
                        )
                      }
                    />
                  </label>
                </div>
                <label className="publisher-field">
                  {t('publishers.exercise.template')}
                  <textarea
                    data-test="publisher-step-template"
                    value={step.template ?? ''}
                    onChange={(event) =>
                      updateExerciseById(
                        selection.moduleId,
                        selection.lessonId,
                        selection.exerciseId,
                        (exercise) => {
                          const steps = [...exercise.steps]
                          steps[stepIndex] = {
                            ...steps[stepIndex],
                            template: event.target.value,
                            blanks: syncBlanks(
                              event.target.value,
                              steps[stepIndex].blanks,
                            ),
                          }
                          return { ...exercise, steps }
                        },
                      )
                    }
                  />
                </label>
                {step.blanks.map(
                  (blank: ExerciseBlankDraft, blankIndex: number) => (
                    <div key={blank.id} className="publisher-blank">
                      <div className="publisher-grid">
                        <label className="publisher-field">
                          {t('publishers.exercise.blankVariant')}
                          <select
                            data-test="publisher-blank-variant"
                            value={blank.variant}
                            onChange={(event) =>
                              updateExerciseById(
                                selection.moduleId,
                                selection.lessonId,
                                selection.exerciseId,
                                (exercise) => {
                                  const steps = [...exercise.steps]
                                  const blanks = [...steps[stepIndex].blanks]
                                  blanks[blankIndex] = {
                                    ...blanks[blankIndex],
                                    variant: event.target
                                      .value as ExerciseBlankDraft['variant'],
                                  }
                                  steps[stepIndex] = {
                                    ...steps[stepIndex],
                                    blanks,
                                  }
                                  return { ...exercise, steps }
                                },
                              )
                            }
                          >
                            <option value="OPTIONS">
                              {t('publishers.exercise.variantOptions')}
                            </option>
                            <option value="TYPING">
                              {t('publishers.exercise.variantTyping')}
                            </option>
                          </select>
                        </label>
                        <label className="publisher-field">
                          {t('publishers.exercise.correct')}
                          <input
                            type="text"
                            data-test="publisher-blank-correct"
                            value={blank.correct}
                            onChange={(event) =>
                              updateExerciseById(
                                selection.moduleId,
                                selection.lessonId,
                                selection.exerciseId,
                                (exercise) => {
                                  const steps = [...exercise.steps]
                                  const blanks = [...steps[stepIndex].blanks]
                                  blanks[blankIndex] = {
                                    ...blanks[blankIndex],
                                    correct: event.target.value,
                                  }
                                  steps[stepIndex] = {
                                    ...steps[stepIndex],
                                    blanks,
                                  }
                                  return { ...exercise, steps }
                                },
                              )
                            }
                          />
                        </label>
                        {blank.variant === 'OPTIONS' ? (
                          <label className="publisher-field publisher-full">
                            {t('publishers.exercise.options')}
                            <input
                              type="text"
                              data-test="publisher-blank-options"
                              value={normalizeBlankOptions(blank.options)}
                              onChange={(event) =>
                                updateExerciseById(
                                  selection.moduleId,
                                  selection.lessonId,
                                  selection.exerciseId,
                                  (exercise) => {
                                    const steps = [...exercise.steps]
                                    const blanks = [...steps[stepIndex].blanks]
                                    blanks[blankIndex] = {
                                      ...blanks[blankIndex],
                                      options: event.target.value,
                                    }
                                    steps[stepIndex] = {
                                      ...steps[stepIndex],
                                      blanks,
                                    }
                                    return { ...exercise, steps }
                                  },
                                )
                              }
                            />
                          </label>
                        ) : null}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ),
          )}
        </div>
      )
    }

    return <p className="muted">{t('publishers.selection.empty')}</p>
  }

  function renderPreview() {
    if (selection.type === 'course') {
      if (!previewLessons.length) {
        return <p className="muted">{t('publishers.preview.empty')}</p>
      }
      return (
        <div className="publisher-preview" data-test="publisher-preview-root">
          {previewLessons.map((lesson) => (
            <div key={lesson.id} className="publisher-preview-item">
              <LessonView lesson={lesson} selection={{ type: 'summary' }} />
            </div>
          ))}
        </div>
      )
    }

    if (selection.type === 'module' && selectedModule) {
      const lessons = [...selectedModule.lessons]
        .sort((a, b) => a.order - b.order)
        .map(toLearnerLesson)
      if (!lessons.length) {
        return <p className="muted">{t('publishers.preview.empty')}</p>
      }
      return (
        <div className="publisher-preview" data-test="publisher-preview-root">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="publisher-preview-item">
              <LessonView lesson={lesson} selection={{ type: 'summary' }} />
            </div>
          ))}
        </div>
      )
    }

    if (selection.type === 'lesson' && selectedLesson) {
      return (
        <div className="publisher-preview" data-test="publisher-preview-root">
          <LessonView
            lesson={toLearnerLesson(selectedLesson)}
            selection={{ type: 'summary' }}
          />
        </div>
      )
    }

    if (
      selection.type === 'contentPage' &&
      selectedLesson &&
      selectedContentPage
    ) {
      return (
        <div className="publisher-preview" data-test="publisher-preview-root">
          <LessonView
            lesson={toLearnerLesson(selectedLesson)}
            selection={{
              type: 'contentPage',
              contentPageId: selectedContentPage.id,
            }}
          />
        </div>
      )
    }

    if (selection.type === 'exercise' && selectedExercise) {
      return (
        <div className="publisher-preview" data-test="publisher-preview-root">
          <FillInBlankExercise exercise={toLearnerExercise(selectedExercise)} />
        </div>
      )
    }

    return <p className="muted">{t('publishers.preview.selectionPrompt')}</p>
  }

  return (
    <section className="publisher-home" data-test="publisher-home">
      <div className="publisher-header">
        <div>
          <h2>{t('publishers.home.title')}</h2>
          <p className="muted">{t('publishers.home.subtitle')}</p>
        </div>
        <div className="publisher-actions">
          <Link
            to="/publish"
            className="ghost-button"
            data-test="publisher-back"
          >
            {t('publishers.home.backToCourses')}
          </Link>
          <PrimaryButton
            onClick={handleSeed}
            aria-label={t('publishers.home.seed')}
            data-test="publisher-seed"
          >
            {t('publishers.home.seed')}
          </PrimaryButton>
          <PrimaryButton
            onClick={handleSave}
            aria-label={t('publishers.home.save')}
            data-test="publisher-save"
          >
            {t('publishers.home.save')}
          </PrimaryButton>
        </div>
      </div>

      {status.type !== 'idle' ? (
        <p
          className={status.type === 'error' ? 'status-error' : 'muted'}
          data-test="publisher-status"
          data-status={status.type}
        >
          {status.message}
        </p>
      ) : null}

      <div className={layoutClassName}>
        <aside
          className={
            collapsedPanels.structure
              ? 'publisher-column publisher-column-structure collapsed'
              : 'publisher-column publisher-column-structure'
          }
        >
          <div className="publisher-column-header">
            <div className="section-header">
              <h3>{t('publishers.columns.structure')}</h3>
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-column-structure-toggle"
                aria-expanded={!collapsedPanels.structure}
                onClick={() => togglePanel('structure')}
              >
                {collapsedPanels.structure
                  ? t('publishers.actions.expand')
                  : t('publishers.actions.collapse')}
              </button>
            </div>
          </div>

          {!collapsedPanels.structure ? (
            <div className="publisher-column-body">
              <Surface className="publisher-section">
                <div className="section-header">
                  <h3>{t('publishers.structure.title')}</h3>
                  <button
                    type="button"
                    className="ghost-button"
                    data-test="publisher-add-module"
                    onClick={addModule}
                  >
                    {t('publishers.modules.add')}
                  </button>
                </div>

                <div className="publisher-tree">
                  <button
                    type="button"
                    data-test="publisher-course-node"
                    className={
                      selection.type === 'course'
                        ? 'publisher-node selected'
                        : 'publisher-node'
                    }
                    onClick={() => setSelection({ type: 'course' })}
                  >
                    <span>
                      {draft.title || t('publishers.course.untitled')}
                    </span>
                    <span className="publisher-node-kind">
                      {t('publishers.structure.course')}
                    </span>
                  </button>

                  {draft.modules.map((module) => (
                    <div key={module.id} className="publisher-tree-group">
                      <div
                        className={
                          selection.type === 'module' &&
                          selection.moduleId === module.id
                            ? 'publisher-node selected'
                            : 'publisher-node'
                        }
                        data-test="publisher-module-node"
                        data-id={module.id}
                      >
                        <button
                          type="button"
                          className="publisher-node-label"
                          data-test="publisher-module-select"
                          data-id={module.id}
                          onClick={() =>
                            setSelection({
                              type: 'module',
                              moduleId: module.id ?? '',
                            })
                          }
                        >
                          <span>
                            {module.title || t('publishers.modules.untitled')}
                          </span>
                          <span className="publisher-node-kind">
                            {t('publishers.structure.module')}
                          </span>
                        </button>
                        <div className="publisher-node-actions">
                          <button
                            type="button"
                            className="ghost-button"
                            data-test="publisher-module-move-up"
                            data-id={module.id}
                            onClick={() => moveModule(module.id ?? '', -1)}
                          >
                            {t('publishers.actions.moveUp')}
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            data-test="publisher-module-move-down"
                            data-id={module.id}
                            onClick={() => moveModule(module.id ?? '', 1)}
                          >
                            {t('publishers.actions.moveDown')}
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            data-test="publisher-module-add-lesson"
                            data-id={module.id}
                            onClick={() => addLesson(module.id ?? '')}
                          >
                            +L
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            data-test="publisher-module-delete"
                            data-id={module.id}
                            onClick={() => deleteModule(module.id ?? '')}
                          >
                            x
                          </button>
                        </div>
                      </div>

                      <div className="publisher-tree-children">
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="publisher-tree-lesson"
                          >
                            <div
                              className={
                                selection.type === 'lesson' &&
                                selection.lessonId === lesson.id
                                  ? 'publisher-node selected'
                                  : 'publisher-node'
                              }
                              data-test="publisher-lesson-node"
                              data-id={lesson.id}
                              data-module-id={module.id}
                            >
                              <button
                                type="button"
                                className="publisher-node-label"
                                data-test="publisher-lesson-select"
                                data-id={lesson.id}
                                data-module-id={module.id}
                                onClick={() =>
                                  setSelection({
                                    type: 'lesson',
                                    moduleId: module.id ?? '',
                                    lessonId: lesson.id ?? '',
                                  })
                                }
                              >
                                <span>
                                  {lesson.title ||
                                    t('publishers.lessons.untitled')}
                                </span>
                                <span className="publisher-node-kind">
                                  {t('publishers.structure.lesson')}
                                </span>
                              </button>
                              <div className="publisher-node-actions">
                                <button
                                  type="button"
                                  className="ghost-button"
                                  data-test="publisher-lesson-move-up"
                                  data-id={lesson.id}
                                  data-module-id={module.id}
                                  onClick={() =>
                                    moveLesson(
                                      module.id ?? '',
                                      lesson.id ?? '',
                                      -1,
                                    )
                                  }
                                >
                                  {t('publishers.actions.moveUp')}
                                </button>
                                <button
                                  type="button"
                                  className="ghost-button"
                                  data-test="publisher-lesson-move-down"
                                  data-id={lesson.id}
                                  data-module-id={module.id}
                                  onClick={() =>
                                    moveLesson(
                                      module.id ?? '',
                                      lesson.id ?? '',
                                      1,
                                    )
                                  }
                                >
                                  {t('publishers.actions.moveDown')}
                                </button>
                                <button
                                  type="button"
                                  className="ghost-button"
                                  data-test="publisher-lesson-add-content-page"
                                  data-id={lesson.id}
                                  data-module-id={module.id}
                                  onClick={() =>
                                    addContentPage(
                                      module.id ?? '',
                                      lesson.id ?? '',
                                    )
                                  }
                                >
                                  +P
                                </button>
                                <button
                                  type="button"
                                  className="ghost-button"
                                  data-test="publisher-lesson-add-exercise-tree"
                                  data-id={lesson.id}
                                  data-module-id={module.id}
                                  onClick={() =>
                                    addExercise(
                                      module.id ?? '',
                                      lesson.id ?? '',
                                    )
                                  }
                                >
                                  +E
                                </button>
                                <button
                                  type="button"
                                  className="ghost-button"
                                  data-test="publisher-lesson-delete"
                                  data-id={lesson.id}
                                  data-module-id={module.id}
                                  onClick={() =>
                                    deleteLesson(
                                      module.id ?? '',
                                      lesson.id ?? '',
                                    )
                                  }
                                >
                                  x
                                </button>
                              </div>
                            </div>

                            <div className="publisher-tree-children publisher-tree-content-pages">
                              {(lesson.contentPages ?? []).map((page) => (
                                <div
                                  key={page.id}
                                  className={
                                    selection.type === 'contentPage' &&
                                    selection.pageId === page.id
                                      ? 'publisher-node selected'
                                      : 'publisher-node'
                                  }
                                  data-test="publisher-content-page-node"
                                  data-id={page.id}
                                  data-module-id={module.id}
                                  data-lesson-id={lesson.id}
                                >
                                  <button
                                    type="button"
                                    className="publisher-node-label"
                                    data-test="publisher-content-page-select"
                                    data-id={page.id}
                                    data-module-id={module.id}
                                    data-lesson-id={lesson.id}
                                    onClick={() =>
                                      setSelection({
                                        type: 'contentPage',
                                        moduleId: module.id ?? '',
                                        lessonId: lesson.id ?? '',
                                        pageId: page.id ?? '',
                                      })
                                    }
                                  >
                                    <span>{page.title}</span>
                                    <span className="publisher-node-kind">
                                      {t('publishers.structure.contentPage')}
                                    </span>
                                  </button>
                                  <div className="publisher-node-actions">
                                    <button
                                      type="button"
                                      className="ghost-button"
                                      data-test="publisher-content-page-move-up"
                                      data-id={page.id}
                                      onClick={() =>
                                        moveContentPage(
                                          module.id ?? '',
                                          lesson.id ?? '',
                                          page.id ?? '',
                                          -1,
                                        )
                                      }
                                    >
                                      {t('publishers.actions.moveUp')}
                                    </button>
                                    <button
                                      type="button"
                                      className="ghost-button"
                                      data-test="publisher-content-page-move-down"
                                      data-id={page.id}
                                      onClick={() =>
                                        moveContentPage(
                                          module.id ?? '',
                                          lesson.id ?? '',
                                          page.id ?? '',
                                          1,
                                        )
                                      }
                                    >
                                      {t('publishers.actions.moveDown')}
                                    </button>
                                    <button
                                      type="button"
                                      className="ghost-button"
                                      data-test="publisher-content-page-delete-tree"
                                      data-id={page.id}
                                      onClick={() =>
                                        deleteContentPage(
                                          module.id ?? '',
                                          lesson.id ?? '',
                                          page.id ?? '',
                                        )
                                      }
                                    >
                                      x
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="publisher-tree-children publisher-tree-exercises">
                              {lesson.exercises.map((exercise) => (
                                <div
                                  key={exercise.id}
                                  className={
                                    selection.type === 'exercise' &&
                                    selection.exerciseId === exercise.id
                                      ? 'publisher-node selected'
                                      : 'publisher-node'
                                  }
                                  data-test="publisher-exercise-node"
                                  data-id={exercise.id}
                                  data-module-id={module.id}
                                  data-lesson-id={lesson.id}
                                >
                                  <button
                                    type="button"
                                    className="publisher-node-label"
                                    data-test="publisher-exercise-select-tree"
                                    data-id={exercise.id}
                                    data-module-id={module.id}
                                    data-lesson-id={lesson.id}
                                    onClick={() =>
                                      setSelection({
                                        type: 'exercise',
                                        moduleId: module.id ?? '',
                                        lessonId: lesson.id ?? '',
                                        exerciseId: exercise.id ?? '',
                                      })
                                    }
                                  >
                                    <span>{exercise.title}</span>
                                    <span className="publisher-node-kind">
                                      {t('publishers.structure.exercise')}
                                    </span>
                                  </button>
                                  <div className="publisher-node-actions">
                                    <button
                                      type="button"
                                      className="ghost-button"
                                      data-test="publisher-exercise-move-up"
                                      data-id={exercise.id}
                                      data-module-id={module.id}
                                      data-lesson-id={lesson.id}
                                      onClick={() =>
                                        moveExercise(
                                          module.id ?? '',
                                          lesson.id ?? '',
                                          exercise.id ?? '',
                                          -1,
                                        )
                                      }
                                    >
                                      {t('publishers.actions.moveUp')}
                                    </button>
                                    <button
                                      type="button"
                                      className="ghost-button"
                                      data-test="publisher-exercise-move-down"
                                      data-id={exercise.id}
                                      data-module-id={module.id}
                                      data-lesson-id={lesson.id}
                                      onClick={() =>
                                        moveExercise(
                                          module.id ?? '',
                                          lesson.id ?? '',
                                          exercise.id ?? '',
                                          1,
                                        )
                                      }
                                    >
                                      {t('publishers.actions.moveDown')}
                                    </button>
                                    <button
                                      type="button"
                                      className="ghost-button"
                                      data-test="publisher-exercise-delete-tree"
                                      data-id={exercise.id}
                                      data-module-id={module.id}
                                      data-lesson-id={lesson.id}
                                      onClick={() =>
                                        deleteExercise(
                                          module.id ?? '',
                                          lesson.id ?? '',
                                          exercise.id ?? '',
                                        )
                                      }
                                    >
                                      x
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          ) : null}
        </aside>

        <main
          className={
            collapsedPanels.designer
              ? 'publisher-column publisher-workspace collapsed'
              : 'publisher-column publisher-workspace'
          }
        >
          <div className="publisher-column-header">
            <div className="section-header">
              <h3>{t('publishers.columns.designer')}</h3>
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-column-designer-toggle"
                aria-expanded={!collapsedPanels.designer}
                onClick={() => togglePanel('designer')}
              >
                {collapsedPanels.designer
                  ? t('publishers.actions.expand')
                  : t('publishers.actions.collapse')}
              </button>
            </div>
            <p className="muted">
              {t('publishers.editor.selection', { selection: selectionLabel })}
            </p>
          </div>

          {!collapsedPanels.designer ? (
            <Surface className="publisher-section">{renderEditor()}</Surface>
          ) : null}
        </main>

        <aside
          className={
            collapsedPanels.preview
              ? 'publisher-column publisher-column-preview collapsed'
              : 'publisher-column publisher-column-preview'
          }
        >
          <div className="publisher-column-header">
            <div className="section-header">
              <h3>{t('publishers.columns.preview')}</h3>
              <button
                type="button"
                className="ghost-button"
                data-test="publisher-column-preview-toggle"
                aria-expanded={!collapsedPanels.preview}
                onClick={() => togglePanel('preview')}
              >
                {collapsedPanels.preview
                  ? t('publishers.actions.expand')
                  : t('publishers.actions.collapse')}
              </button>
            </div>
            <p className="muted">{t('publishers.preview.helper')}</p>
          </div>

          {!collapsedPanels.preview ? (
            <Surface className="publisher-section">{renderPreview()}</Surface>
          ) : null}
        </aside>
      </div>

      <p className="muted" style={{ marginTop: tokenVars.spacing.md }}>
        {t('publishers.preview.helper')}
      </p>
    </section>
  )
}
