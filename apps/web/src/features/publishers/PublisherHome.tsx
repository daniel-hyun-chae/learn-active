import { useEffect, useMemo, useState } from 'react'
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
  LessonDraft,
  ModuleDraft,
} from './types'
import { RichTextEditor } from './components/RichTextEditor'
import {
  BLANK_TOKEN,
  blankTemplateToSegments,
  createId,
  emptyCourse,
  normalizeDraft,
  normalizeBlankOptions,
  parseBlankOptions,
  reindexLessons,
  reindexModules,
  segmentsToBlankTemplate,
  syncBlanks,
} from './publisher-utils'
import type { Exercise, Lesson } from '../learners/course/types'
import { LessonView } from '../learners/course/LessonView'
import { FillInBlankExercise } from '../learners/course/exercises/FillInBlankExercise'

type PublisherHomeProps = {
  courses: CourseDraft[]
}

type Status = { type: 'idle' | 'saving' | 'saved' | 'error'; message?: string }

type Selection =
  | { type: 'course' }
  | { type: 'module'; moduleId: string }
  | { type: 'lesson'; moduleId: string; lessonId: string }
  | {
      type: 'exercise'
      moduleId: string
      lessonId: string
      exerciseId: string
    }

type PreviewMode = 'edit' | 'preview'
type PreviewScope = 'course' | 'selection'

type DragState =
  | { type: 'module'; moduleId: string }
  | { type: 'lesson'; moduleId: string; lessonId: string }
  | { type: 'exercise'; moduleId: string; lessonId: string; exerciseId: string }

function reorderById<T extends { id?: string }>(
  items: T[],
  fromId: string,
  toId: string,
) {
  const fromIndex = items.findIndex((item) => item.id === fromId)
  const toIndex = items.findIndex((item) => item.id === toId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

function toLearnerExercise(exercise: ExerciseDraft): Exercise {
  return {
    id: exercise.id ?? createId('exercise'),
    type: 'FILL_IN_THE_BLANK',
    title: exercise.title,
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
    exercises: lesson.exercises.map(toLearnerExercise),
  }
}

export function PublisherHome({ courses }: PublisherHomeProps) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string | undefined>(
    courses[0]?.id,
  )
  const [draft, setDraft] = useState<CourseDraft>(() =>
    normalizeDraft(courses[0] ?? emptyCourse(t)),
  )
  const [status, setStatus] = useState<Status>({ type: 'idle' })
  const [selection, setSelection] = useState<Selection>({ type: 'course' })
  const [previewMode, setPreviewMode] = useState<PreviewMode>('edit')
  const [previewScope, setPreviewScope] = useState<PreviewScope>('course')
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [moveTarget, setMoveTarget] = useState<{
    moduleId?: string
    lessonId?: string
  }>({})

  const courseOptions = useMemo<CourseDraft[]>(() => courses, [courses])

  useEffect(() => {
    if (selection.type === 'lesson') {
      setMoveTarget({ moduleId: selection.moduleId })
    }
    if (selection.type === 'exercise') {
      setMoveTarget({
        moduleId: selection.moduleId,
        lessonId: selection.lessonId,
      })
    }
    if (selection.type === 'course' || selection.type === 'module') {
      setMoveTarget({})
    }
  }, [selection])

  const selectedModule = useMemo(() => {
    if (selection.type === 'module') {
      return draft.modules.find(
        (module: ModuleDraft) => module.id === selection.moduleId,
      )
    }
    if (selection.type === 'lesson' || selection.type === 'exercise') {
      return draft.modules.find(
        (module: ModuleDraft) => module.id === selection.moduleId,
      )
    }
    return undefined
  }, [draft.modules, selection])

  const selectedLesson = useMemo(() => {
    if (selection.type === 'lesson' || selection.type === 'exercise') {
      return selectedModule?.lessons.find(
        (lesson: LessonDraft) => lesson.id === selection.lessonId,
      )
    }
    return undefined
  }, [selectedModule, selection])

  const selectedExercise = useMemo(() => {
    if (selection.type === 'exercise') {
      return selectedLesson?.exercises.find(
        (exercise: ExerciseDraft) => exercise.id === selection.exerciseId,
      )
    }
    return undefined
  }, [selectedLesson, selection])

  function selectCourse(courseId: string) {
    const course = courses.find((item) => item.id === courseId)
    if (course) {
      setSelectedId(courseId)
      setDraft(normalizeDraft(course))
      setSelection({ type: 'course' })
    }
  }

  function updateDraft(partial: Partial<CourseDraft>) {
    setDraft((prev: CourseDraft) => ({ ...prev, ...partial }))
  }

  function updateModules(updater: (modules: ModuleDraft[]) => ModuleDraft[]) {
    setDraft((prev: CourseDraft) => ({
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
        `mutation SeedSampleCourse { seedSampleCourse { id title description language modules { id title order lessons { id title order contents { id type text imageUrl imageAlt lexicalJson } exercises { id type title instructions steps { id order prompt threadId threadTitle segments { type text blankId } blanks { id correct variant options } } } } } } }`,
      )
      setDraft(normalizeDraft(data.seedSampleCourse))
      setSelectedId(data.seedSampleCourse.id)
      setSelection({ type: 'course' })
      setStatus({ type: 'saved', message: t('publishers.status.seeded') })
    } catch (error) {
      setStatus({ type: 'error', message: (error as Error).message })
    }
  }

  async function handleSave() {
    setStatus({ type: 'saving' })
    try {
      const normalized = normalizeDraft(draft)
      const input = {
        id: normalized.id,
        title: normalized.title,
        description: normalized.description,
        language: normalized.language,
        modules: normalized.modules.map((module: ModuleDraft) => ({
          id: module.id,
          title: module.title,
          order: module.order,
          lessons: module.lessons.map((lesson: LessonDraft) => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
            contents: lesson.contents.map((content: ContentDraft) => ({
              id: content.id,
              type: content.type,
              text: content.text,
              html: content.html,
              imageUrl: content.imageUrl,
              imageAlt: content.imageAlt,
              lexicalJson: content.lexicalJson,
            })),
            exercises: lesson.exercises.map((exercise: ExerciseDraft) => ({
              id: exercise.id,
              type: exercise.type,
              title: exercise.title,
              instructions: exercise.instructions,
              steps: exercise.steps.map((step: ExerciseStepDraft) => {
                const templateValue =
                  typeof step.template === 'string' ? step.template : undefined
                const safeTemplate =
                  templateValue ?? segmentsToBlankTemplate(step.segments) ?? ''
                const blanks = syncBlanks(safeTemplate, step.blanks)
                return {
                  id: step.id,
                  order: step.order,
                  prompt: step.prompt,
                  threadId: step.threadId,
                  threadTitle: step.threadTitle,
                  segments: blankTemplateToSegments(safeTemplate, blanks),
                  blanks: blanks.map((blank) => ({
                    id: blank.id,
                    correct: blank.correct,
                    variant: blank.variant,
                    options:
                      blank.variant === 'OPTIONS'
                        ? parseBlankOptions(blank.options)
                        : undefined,
                  })),
                }
              }),
            })),
          })),
        })),
      }

      const data = await fetchGraphQL<{ upsertCourse: CourseDraft }>(
        `mutation SaveCourse($input: CourseInput!) {
          upsertCourse(input: $input) {
            id
            title
            description
            language
            modules {
              id
              title
              order
              lessons {
                id
                title
                order
                contents { id type text imageUrl imageAlt lexicalJson }
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
      setSelectedId(data.upsertCourse.id)
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
          exercises: [],
        },
      ],
    }))
    setSelection({ type: 'lesson', moduleId, lessonId })
  }

  function addContent(
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
    if (selection.type === 'module' && selection.moduleId === moduleId) {
      setSelection({ type: 'course' })
    }
    if (
      (selection.type === 'lesson' || selection.type === 'exercise') &&
      selection.moduleId === moduleId
    ) {
      setSelection({ type: 'course' })
    }
  }

  function deleteLesson(moduleId: string, lessonId: string) {
    updateModuleById(moduleId, (module) => ({
      ...module,
      lessons: module.lessons.filter((lesson) => lesson.id !== lessonId),
    }))
    if (
      selection.type === 'lesson' &&
      selection.lessonId === lessonId &&
      selection.moduleId === moduleId
    ) {
      setSelection({ type: 'module', moduleId })
    }
    if (
      selection.type === 'exercise' &&
      selection.lessonId === lessonId &&
      selection.moduleId === moduleId
    ) {
      setSelection({ type: 'module', moduleId })
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
    if (selection.type === 'exercise' && selection.exerciseId === exerciseId) {
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

  function moveLesson(moduleId: string, lessonId: string, direction: -1 | 1) {
    updateModuleById(moduleId, (module) => {
      const index = module.lessons.findIndex((lesson) => lesson.id === lessonId)
      const nextIndex = index + direction
      if (index === -1 || nextIndex < 0 || nextIndex >= module.lessons.length) {
        return module
      }
      const lessons = [...module.lessons]
      const [moved] = lessons.splice(index, 1)
      lessons.splice(nextIndex, 0, moved)
      return { ...module, lessons }
    })
  }

  function moveExercise(
    moduleId: string,
    lessonId: string,
    exerciseId: string,
    direction: -1 | 1,
  ) {
    updateLessonById(moduleId, lessonId, (lesson) => {
      const index = lesson.exercises.findIndex(
        (exercise) => exercise.id === exerciseId,
      )
      const nextIndex = index + direction
      if (
        index === -1 ||
        nextIndex < 0 ||
        nextIndex >= lesson.exercises.length
      ) {
        return lesson
      }
      const exercises = [...lesson.exercises]
      const [moved] = exercises.splice(index, 1)
      exercises.splice(nextIndex, 0, moved)
      return { ...lesson, exercises }
    })
  }

  function moveLessonToModule(
    lessonId: string,
    fromModuleId: string,
    toModuleId: string,
  ) {
    if (fromModuleId === toModuleId) return
    let movingLesson: LessonDraft | undefined
    updateModules((modules) => {
      const withoutLesson = modules.map((module) => {
        if (module.id !== fromModuleId) return module
        const lessons = module.lessons.filter((lesson) => {
          if (lesson.id === lessonId) {
            movingLesson = lesson
            return false
          }
          return true
        })
        return { ...module, lessons }
      })
      if (!movingLesson) return modules
      return withoutLesson.map((module) => {
        if (module.id !== toModuleId) return module
        return {
          ...module,
          lessons: [...module.lessons, movingLesson as LessonDraft],
        }
      })
    })
    setSelection({ type: 'lesson', moduleId: toModuleId, lessonId })
  }

  function moveExerciseToLesson(
    exerciseId: string,
    fromModuleId: string,
    fromLessonId: string,
    toModuleId: string,
    toLessonId: string,
  ) {
    if (fromModuleId === toModuleId && fromLessonId === toLessonId) return
    let movingExercise: ExerciseDraft | undefined
    updateModules((modules) => {
      const stripped = modules.map((module) => {
        if (module.id !== fromModuleId) return module
        return {
          ...module,
          lessons: module.lessons.map((lesson) => {
            if (lesson.id !== fromLessonId) return lesson
            const exercises = lesson.exercises.filter((exercise) => {
              if (exercise.id === exerciseId) {
                movingExercise = exercise
                return false
              }
              return true
            })
            return { ...lesson, exercises }
          }),
        }
      })
      if (!movingExercise) return modules
      return stripped.map((module) => {
        if (module.id !== toModuleId) return module
        return {
          ...module,
          lessons: module.lessons.map((lesson) => {
            if (lesson.id !== toLessonId) return lesson
            return {
              ...lesson,
              exercises: [...lesson.exercises, movingExercise as ExerciseDraft],
            }
          }),
        }
      })
    })
    setSelection({
      type: 'exercise',
      moduleId: toModuleId,
      lessonId: toLessonId,
      exerciseId,
    })
  }

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
    return t('publishers.selection.exercise')
  }, [selection, t])

  function renderEditor() {
    if (selection.type === 'course') {
      return (
        <div className="publisher-grid">
          <label className="publisher-field">
            {t('publishers.course.title')}
            <input
              type="text"
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
            />
          </label>
          <label className="publisher-field">
            {t('publishers.course.language')}
            <input
              type="text"
              value={draft.language}
              onChange={(event) =>
                updateDraft({ language: event.target.value })
              }
            />
          </label>
          <label className="publisher-field publisher-full">
            {t('publishers.course.description')}
            <textarea
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
              onClick={() => addLesson(selection.moduleId)}
            >
              {t('publishers.lessons.add')}
            </button>
            <button
              type="button"
              className="ghost-button"
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
                onClick={() =>
                  addContent(selection.moduleId, selection.lessonId, 'TEXT')
                }
              >
                {t('publishers.content.addText')}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  addContent(selection.moduleId, selection.lessonId, 'IMAGE')
                }
              >
                {t('publishers.content.addImage')}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  addExercise(selection.moduleId, selection.lessonId)
                }
              >
                {t('publishers.exercise.add')}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  deleteLesson(selection.moduleId, selection.lessonId)
                }
              >
                {t('publishers.actions.delete')}
              </button>
            </div>
          </div>

          <div className="publisher-section">
            <h4>{t('publishers.content.title')}</h4>
            {selectedLesson.contents.length ? null : (
              <p className="muted">{t('publishers.content.empty')}</p>
            )}
            {selectedLesson.contents.map(
              (content: ContentDraft, contentIndex: number) => (
                <div key={content.id} className="publisher-content-block">
                  {content.type === 'TEXT' ? (
                    <RichTextEditor
                      initialText={content.text}
                      placeholder={t('publishers.content.textPlaceholder')}
                      onChange={(value) =>
                        updateLessonById(
                          selection.moduleId,
                          selection.lessonId,
                          (lesson) => {
                            const contents = [...lesson.contents]
                            contents[contentIndex] = {
                              ...contents[contentIndex],
                              lexicalJson: value.lexicalJson,
                              text: value.text,
                            }
                            return { ...lesson, contents }
                          },
                        )
                      }
                    />
                  ) : (
                    <div className="publisher-grid">
                      <label className="publisher-field">
                        {t('publishers.content.imageUrl')}
                        <input
                          type="text"
                          value={content.imageUrl ?? ''}
                          onChange={(event) =>
                            updateLessonById(
                              selection.moduleId,
                              selection.lessonId,
                              (lesson) => {
                                const contents = [...lesson.contents]
                                contents[contentIndex] = {
                                  ...contents[contentIndex],
                                  imageUrl: event.target.value,
                                }
                                return { ...lesson, contents }
                              },
                            )
                          }
                        />
                      </label>
                      <label className="publisher-field">
                        {t('publishers.content.imageAlt')}
                        <input
                          type="text"
                          value={content.imageAlt ?? ''}
                          onChange={(event) =>
                            updateLessonById(
                              selection.moduleId,
                              selection.lessonId,
                              (lesson) => {
                                const contents = [...lesson.contents]
                                contents[contentIndex] = {
                                  ...contents[contentIndex],
                                  imageAlt: event.target.value,
                                }
                                return { ...lesson, contents }
                              },
                            )
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          <div className="publisher-section">
            <h4>{t('publishers.exercise.title')}</h4>
            {selectedLesson.exercises.length ? null : (
              <p className="muted">{t('publishers.exercise.empty')}</p>
            )}
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
          </div>

          <div className="publisher-section">
            <h4>{t('publishers.move.title')}</h4>
            <label className="publisher-field">
              {t('publishers.move.module')}
              <select
                value={moveTarget.moduleId ?? selection.moduleId}
                onChange={(event) =>
                  setMoveTarget({ moduleId: event.target.value })
                }
              >
                {draft.modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.title || t('publishers.modules.untitled')}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                moveLessonToModule(
                  selection.lessonId,
                  selection.moduleId,
                  moveTarget.moduleId ?? selection.moduleId,
                )
              }
            >
              {t('publishers.actions.move')}
            </button>
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
                    value={step.template}
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

          <div className="publisher-section">
            <h4>{t('publishers.move.title')}</h4>
            <div className="publisher-grid">
              <label className="publisher-field">
                {t('publishers.move.module')}
                <select
                  value={moveTarget.moduleId ?? selection.moduleId}
                  onChange={(event) =>
                    setMoveTarget({
                      moduleId: event.target.value,
                      lessonId: moveTarget.lessonId ?? selection.lessonId,
                    })
                  }
                >
                  {draft.modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title || t('publishers.modules.untitled')}
                    </option>
                  ))}
                </select>
              </label>
              <label className="publisher-field">
                {t('publishers.move.lesson')}
                <select
                  value={moveTarget.lessonId ?? selection.lessonId}
                  onChange={(event) =>
                    setMoveTarget((prev) => ({
                      ...prev,
                      lessonId: event.target.value,
                    }))
                  }
                >
                  {(
                    draft.modules.find(
                      (module) =>
                        module.id ===
                        (moveTarget.moduleId ?? selection.moduleId),
                    )?.lessons ?? []
                  )
                    .sort((a, b) => a.order - b.order)
                    .map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title || t('publishers.lessons.untitled')}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                moveExerciseToLesson(
                  selection.exerciseId,
                  selection.moduleId,
                  selection.lessonId,
                  moveTarget.moduleId ?? selection.moduleId,
                  moveTarget.lessonId ?? selection.lessonId,
                )
              }
            >
              {t('publishers.actions.move')}
            </button>
          </div>
        </div>
      )
    }

    return <p className="muted">{t('publishers.selection.empty')}</p>
  }

  function renderPreview() {
    if (previewScope === 'course') {
      if (!previewLessons.length) {
        return <p className="muted">{t('publishers.preview.empty')}</p>
      }
      return (
        <div className="publisher-preview">
          {previewLessons.map((lesson) => (
            <div key={lesson.id} className="publisher-preview-item">
              <LessonView lesson={lesson} />
            </div>
          ))}
        </div>
      )
    }

    if (previewScope === 'selection') {
      if (selection.type === 'lesson' && selectedLesson) {
        return (
          <div className="publisher-preview">
            <LessonView lesson={toLearnerLesson(selectedLesson)} />
          </div>
        )
      }

      if (selection.type === 'module' && selectedModule) {
        const moduleLessons = selectedModule.lessons
          .sort((a, b) => a.order - b.order)
          .map(toLearnerLesson)
        if (!moduleLessons.length) {
          return <p className="muted">{t('publishers.preview.empty')}</p>
        }
        return (
          <div className="publisher-preview">
            {moduleLessons.map((lesson) => (
              <div key={lesson.id} className="publisher-preview-item">
                <LessonView lesson={lesson} />
              </div>
            ))}
          </div>
        )
      }

      if (selection.type === 'exercise' && selectedExercise) {
        return (
          <div className="publisher-preview">
            <FillInBlankExercise
              exercise={toLearnerExercise(selectedExercise)}
            />
          </div>
        )
      }

      return <p className="muted">{t('publishers.preview.selectionPrompt')}</p>
    }

    return null
  }

  return (
    <section className="publisher-home" data-test="publisher-home">
      <div className="publisher-header">
        <div>
          <h2>{t('publishers.home.title')}</h2>
          <p className="muted">{t('publishers.home.subtitle')}</p>
        </div>
        <div className="publisher-actions">
          <PrimaryButton
            onClick={handleSeed}
            aria-label={t('publishers.home.seed')}
          >
            {t('publishers.home.seed')}
          </PrimaryButton>
          <PrimaryButton
            onClick={handleSave}
            aria-label={t('publishers.home.save')}
          >
            {t('publishers.home.save')}
          </PrimaryButton>
        </div>
      </div>

      {status.type !== 'idle' ? (
        <p className={status.type === 'error' ? 'status-error' : 'muted'}>
          {status.message}
        </p>
      ) : null}

      <div className="publisher-layout">
        <aside className="publisher-nav">
          <Surface className="publisher-section">
            <div className="section-header">
              <h3>{t('publishers.course.select')}</h3>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setSelectedId(undefined)
                  setDraft(normalizeDraft(emptyCourse(t)))
                  setSelection({ type: 'course' })
                }}
              >
                {t('publishers.course.new')}
              </button>
            </div>
            <div className="publisher-grid">
              <label className="publisher-field publisher-full">
                {t('publishers.course.existing')}
                <select
                  value={selectedId ?? ''}
                  onChange={(event) => {
                    const value = event.target.value
                    if (!value) {
                      setSelectedId(undefined)
                      setDraft(normalizeDraft(emptyCourse(t)))
                      setSelection({ type: 'course' })
                      return
                    }
                    selectCourse(value)
                  }}
                >
                  <option value="">
                    {t('publishers.course.selectPlaceholder')}
                  </option>
                  {courseOptions.map((course: CourseDraft) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Surface>

          <Surface className="publisher-section">
            <div className="section-header">
              <h3>{t('publishers.structure.title')}</h3>
              <button
                type="button"
                className="ghost-button"
                onClick={addModule}
              >
                {t('publishers.modules.add')}
              </button>
            </div>
            <div className="publisher-tree">
              <button
                type="button"
                className={
                  selection.type === 'course'
                    ? 'publisher-node selected'
                    : 'publisher-node'
                }
                onClick={() => setSelection({ type: 'course' })}
              >
                <span>{draft.title || t('publishers.course.untitled')}</span>
                <span className="muted">
                  {t('publishers.structure.course')}
                </span>
              </button>

              {draft.modules.map((module: ModuleDraft) => (
                <div key={module.id} className="publisher-tree-group">
                  <div
                    className={
                      selection.type === 'module' &&
                      selection.moduleId === module.id
                        ? 'publisher-node selected'
                        : 'publisher-node'
                    }
                    draggable
                    onDragStart={() =>
                      setDragState({
                        type: 'module',
                        moduleId: module.id ?? '',
                      })
                    }
                    onDragEnd={() => setDragState(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!module.id) return
                      if (dragState?.type === 'module') {
                        updateModules((modules) =>
                          reorderById(
                            modules,
                            dragState.moduleId,
                            module.id ?? '',
                          ),
                        )
                        setDragState(null)
                        return
                      }
                      if (
                        dragState?.type === 'lesson' &&
                        dragState.moduleId !== module.id
                      ) {
                        moveLessonToModule(
                          dragState.lessonId,
                          dragState.moduleId,
                          module.id,
                        )
                        setDragState(null)
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="publisher-node-label"
                      onClick={() =>
                        setSelection({
                          type: 'module',
                          moduleId: module.id ?? '',
                        })
                      }
                    >
                      <span>{module.title}</span>
                      <span className="muted">
                        {t('publishers.structure.module')}
                      </span>
                    </button>
                    <div className="publisher-node-actions">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => moveModule(module.id ?? '', -1)}
                        aria-label={t('publishers.actions.moveUp')}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => moveModule(module.id ?? '', 1)}
                        aria-label={t('publishers.actions.moveDown')}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => addLesson(module.id ?? '')}
                      >
                        {t('publishers.lessons.add')}
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => deleteModule(module.id ?? '')}
                        aria-label={t('publishers.actions.delete')}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="publisher-tree-children">
                    {module.lessons.map((lesson: LessonDraft) => (
                      <div key={lesson.id} className="publisher-tree-lesson">
                        <div
                          className={
                            selection.type === 'lesson' &&
                            selection.lessonId === lesson.id
                              ? 'publisher-node selected'
                              : 'publisher-node'
                          }
                          draggable
                          onDragStart={() =>
                            setDragState({
                              type: 'lesson',
                              moduleId: module.id ?? '',
                              lessonId: lesson.id ?? '',
                            })
                          }
                          onDragEnd={() => setDragState(null)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (!lesson.id) return
                            if (
                              dragState?.type === 'lesson' &&
                              dragState.moduleId === module.id
                            ) {
                              updateModuleById(
                                module.id ?? '',
                                (moduleItem) => ({
                                  ...moduleItem,
                                  lessons: reorderById(
                                    moduleItem.lessons,
                                    dragState.lessonId,
                                    lesson.id ?? '',
                                  ),
                                }),
                              )
                              setDragState(null)
                              return
                            }
                            if (dragState?.type === 'exercise') {
                              moveExerciseToLesson(
                                dragState.exerciseId,
                                dragState.moduleId,
                                dragState.lessonId,
                                module.id ?? '',
                                lesson.id ?? '',
                              )
                              setDragState(null)
                            }
                          }}
                        >
                          <button
                            type="button"
                            className="publisher-node-label"
                            onClick={() =>
                              setSelection({
                                type: 'lesson',
                                moduleId: module.id ?? '',
                                lessonId: lesson.id ?? '',
                              })
                            }
                          >
                            <span>{lesson.title}</span>
                            <span className="muted">
                              {t('publishers.structure.lesson')}
                            </span>
                          </button>
                          <div className="publisher-node-actions">
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() =>
                                moveLesson(module.id ?? '', lesson.id ?? '', -1)
                              }
                              aria-label={t('publishers.actions.moveUp')}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() =>
                                moveLesson(module.id ?? '', lesson.id ?? '', 1)
                              }
                              aria-label={t('publishers.actions.moveDown')}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() =>
                                addExercise(module.id ?? '', lesson.id ?? '')
                              }
                            >
                              {t('publishers.exercise.add')}
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() =>
                                deleteLesson(module.id ?? '', lesson.id ?? '')
                              }
                              aria-label={t('publishers.actions.delete')}
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="publisher-tree-children publisher-tree-exercises">
                          {lesson.exercises.map((exercise: ExerciseDraft) => (
                            <div
                              key={exercise.id}
                              className={
                                selection.type === 'exercise' &&
                                selection.exerciseId === exercise.id
                                  ? 'publisher-node selected'
                                  : 'publisher-node'
                              }
                              draggable
                              onDragStart={() =>
                                setDragState({
                                  type: 'exercise',
                                  moduleId: module.id ?? '',
                                  lessonId: lesson.id ?? '',
                                  exerciseId: exercise.id ?? '',
                                })
                              }
                              onDragEnd={() => setDragState(null)}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={() => {
                                if (
                                  dragState?.type !== 'exercise' ||
                                  dragState.moduleId !== module.id ||
                                  dragState.lessonId !== lesson.id ||
                                  !exercise.id
                                )
                                  return
                                updateLessonById(
                                  module.id ?? '',
                                  lesson.id ?? '',
                                  (lessonItem) => ({
                                    ...lessonItem,
                                    exercises: reorderById(
                                      lessonItem.exercises,
                                      dragState.exerciseId,
                                      exercise.id ?? '',
                                    ),
                                  }),
                                )
                                setDragState(null)
                              }}
                            >
                              <button
                                type="button"
                                className="publisher-node-label"
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
                                <span className="muted">
                                  {t('publishers.structure.exercise')}
                                </span>
                              </button>
                              <div className="publisher-node-actions">
                                <button
                                  type="button"
                                  className="ghost-button"
                                  onClick={() =>
                                    moveExercise(
                                      module.id ?? '',
                                      lesson.id ?? '',
                                      exercise.id ?? '',
                                      -1,
                                    )
                                  }
                                  aria-label={t('publishers.actions.moveUp')}
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  className="ghost-button"
                                  onClick={() =>
                                    moveExercise(
                                      module.id ?? '',
                                      lesson.id ?? '',
                                      exercise.id ?? '',
                                      1,
                                    )
                                  }
                                  aria-label={t('publishers.actions.moveDown')}
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  className="ghost-button"
                                  onClick={() =>
                                    deleteExercise(
                                      module.id ?? '',
                                      lesson.id ?? '',
                                      exercise.id ?? '',
                                    )
                                  }
                                  aria-label={t('publishers.actions.delete')}
                                >
                                  ✕
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
        </aside>

        <main className="publisher-workspace">
          <Surface className="publisher-section publisher-panel">
            <div className="publisher-toolbar">
              <div>
                <p className="muted">
                  {t('publishers.editor.selection', {
                    selection: selectionLabel,
                  })}
                </p>
              </div>
              <div className="publisher-toolbar-actions">
                <div className="publisher-toggle" role="tablist">
                  <button
                    type="button"
                    className={previewMode === 'edit' ? 'active' : ''}
                    onClick={() => setPreviewMode('edit')}
                  >
                    {t('publishers.mode.edit')}
                  </button>
                  <button
                    type="button"
                    className={previewMode === 'preview' ? 'active' : ''}
                    onClick={() => setPreviewMode('preview')}
                  >
                    {t('publishers.mode.preview')}
                  </button>
                </div>
                {previewMode === 'preview' ? (
                  <div className="publisher-toggle" role="tablist">
                    <button
                      type="button"
                      className={previewScope === 'course' ? 'active' : ''}
                      onClick={() => setPreviewScope('course')}
                    >
                      {t('publishers.preview.course')}
                    </button>
                    <button
                      type="button"
                      className={previewScope === 'selection' ? 'active' : ''}
                      onClick={() => setPreviewScope('selection')}
                    >
                      {t('publishers.preview.selection')}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {previewMode === 'edit' ? renderEditor() : renderPreview()}
          </Surface>
        </main>
      </div>

      <p className="muted" style={{ marginTop: tokenVars.spacing.lg }}>
        {t('publishers.preview.helper')}
      </p>
    </section>
  )
}
