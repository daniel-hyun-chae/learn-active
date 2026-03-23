import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LessonView } from '../features/learners/course/LessonView'
import type {
  CourseProgress,
  Lesson,
  LessonProgress,
  ModuleProgress,
} from '../features/learners/course/types'
import { requireWebSession } from '../features/auth/route-guard'
import { fetchGraphQL } from '../shared/api/graphql'

type LessonSearch = {
  block?: 'summary' | 'contentPage' | 'exercise'
  contentPageId?: string
  exerciseId?: string
  review?: 'mistakes'
}

type AttemptHistoryEntry = {
  id: string
  isCorrect: boolean
  attemptedAt: string
  answers: Array<{ key: string; value: string }>
}

type StructureContentPage = {
  id: string
  title: string
}

type StructureExercise = {
  id: string
  title: string
}

type StructureLesson = {
  id: string
  title: string
  order: number
  contentPages: StructureContentPage[]
  exercises: StructureExercise[]
}

type StructureModule = {
  id: string
  title: string
  order: number
  lessons: StructureLesson[]
}

type LoaderData = {
  lesson: Lesson | null
  modules: StructureModule[]
  courseVersionId: string | null
  progress: CourseProgress | null
  courseId: string
}

type CourseLessonQueryData = {
  learnerCourse: {
    versionId: string
    modules: Array<{
      id: string
      title: string
      order: number
      lessons: Lesson[]
    }>
  } | null
  learnerCourseProgress: CourseProgress | null
}

function normalizeSearch(search: Record<string, unknown>): LessonSearch {
  const blockValue = typeof search.block === 'string' ? search.block : undefined
  const block =
    blockValue === 'summary' ||
    blockValue === 'contentPage' ||
    blockValue === 'exercise'
      ? blockValue
      : 'summary'

  const contentPageId =
    typeof search.contentPageId === 'string' && search.contentPageId.length
      ? search.contentPageId
      : undefined

  const exerciseId =
    typeof search.exerciseId === 'string' && search.exerciseId.length
      ? search.exerciseId
      : undefined

  const review = search.review === 'mistakes' ? 'mistakes' : undefined

  if (block === 'contentPage') {
    return { block, contentPageId, review }
  }
  if (block === 'exercise') {
    return { block, exerciseId, review }
  }
  return { block: 'summary', review }
}

export const Route = createFileRoute('/courses/$courseId/lessons/$lessonId')({
  beforeLoad: async ({ location }) => {
    await requireWebSession(location.pathname)
  },
  validateSearch: normalizeSearch,
  loader: async ({ params }) => {
    const { courseId, lessonId } = params as {
      courseId: string
      lessonId: string
    }

    const data = await fetchGraphQL<CourseLessonQueryData>(
      `query CourseLesson($id: String!) {
        learnerCourse(id: $id) {
          versionId
          modules {
            id
            title
            order
            lessons {
              id
              title
              order
              contents {
                id
                type
                text
                imageUrl
                imageAlt
              }
              contentPages {
                id
                title
                order
                contents {
                  id
                  type
                  text
                  imageUrl
                  imageAlt
                }
              }
              exercises {
                id
                type
                title
                instructions
                fillInBlank {
                  steps {
                    id
                    order
                    prompt
                    threadId
                    threadTitle
                    segments {
                      type
                      text
                      blankId
                    }
                    blanks {
                      id
                      correct
                      variant
                      options
                    }
                  }
                }
                multipleChoice {
                  question
                  allowsMultiple
                  choices {
                    id
                    order
                    text
                    isCorrect
                  }
                }
                reordering {
                  prompt
                  items {
                    id
                    order
                    text
                    isDistractor
                  }
                }
              }
            }
          }
        }
        learnerCourseProgress(courseId: $id) {
          courseId
          courseVersionId
          completedExercises
          totalExercises
          percentComplete
          modules {
            moduleId
            completedExercises
            totalExercises
            percentComplete
            lessons {
              lessonId
              completedExercises
              totalExercises
              percentComplete
              exerciseAttempts {
                exerciseId
                attempted
                isCorrect
                attemptedAt
              }
            }
          }
        }
      }`,
      { id: courseId },
    )

    const sourceModules = data.learnerCourse?.modules ?? []

    const modules = sourceModules
      .map((module) => ({
        id: module.id,
        title: module.title,
        order: module.order,
        lessons: [...module.lessons]
          .sort((a, b) => a.order - b.order)
          .map((moduleLesson) => ({
            id: moduleLesson.id,
            title: moduleLesson.title,
            order: moduleLesson.order,
            contentPages: [...(moduleLesson.contentPages ?? [])]
              .sort((a, b) => a.order - b.order)
              .map((page) => ({
                id: page.id,
                title: page.title,
              })),
            exercises: moduleLesson.exercises.map((exercise) => ({
              id: exercise.id,
              title: exercise.title,
            })),
          })),
      }))
      .sort((a, b) => a.order - b.order)

    const lesson =
      sourceModules
        .flatMap((module) => module.lessons)
        .find((item) => item.id === lessonId) ?? null

    return {
      lesson,
      modules,
      courseId,
      courseVersionId: data.learnerCourse?.versionId ?? null,
      progress: data.learnerCourseProgress ?? null,
    }
  },
  component: LessonRoute,
})

function LessonRoute() {
  const { t } = useTranslation()
  const router = useRouter()
  const { lesson, modules, courseId, courseVersionId, progress } =
    Route.useLoaderData() as LoaderData
  const { lessonId } = Route.useParams() as { lessonId: string }
  const { block, contentPageId, exerciseId, review } =
    Route.useSearch() as LessonSearch
  const [isStructureOpen, setIsStructureOpen] = useState(true)
  const [historyTarget, setHistoryTarget] = useState<{
    lessonId: string
    exerciseId: string
    title: string
  } | null>(null)
  const [historyEntries, setHistoryEntries] = useState<AttemptHistoryEntry[]>(
    [],
  )
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const lastResumeMutationKeyRef = useRef<string>('')

  const reviewModeEnabled = review === 'mistakes'

  if (!lesson) {
    return <p className="muted">{t('learners.lesson.notFound')}</p>
  }

  useEffect(() => {
    const normalizedBlock: 'summary' | 'contentPage' | 'exercise' =
      block === 'contentPage'
        ? 'contentPage'
        : block === 'exercise'
          ? 'exercise'
          : 'summary'

    const normalizedContentPageId =
      normalizedBlock === 'contentPage' ? (contentPageId ?? null) : null
    const normalizedExerciseId =
      normalizedBlock === 'exercise' ? (exerciseId ?? null) : null

    if (normalizedBlock === 'contentPage' && !normalizedContentPageId) {
      return
    }
    if (normalizedBlock === 'exercise' && !normalizedExerciseId) {
      return
    }

    const mutationKey = [
      courseId,
      lessonId,
      normalizedBlock,
      normalizedContentPageId ?? '',
      normalizedExerciseId ?? '',
    ].join('|')

    if (lastResumeMutationKeyRef.current === mutationKey) {
      return
    }
    lastResumeMutationKeyRef.current = mutationKey

    void fetchGraphQL<{
      upsertLearnerResumePosition: {
        courseId: string
        lessonId: string
      }
    }>(
      `mutation UpsertLearnerResumePosition($input: LearnerResumePositionInput!) {
        upsertLearnerResumePosition(input: $input) {
          courseId
          lessonId
        }
      }`,
      {
        input: {
          courseId,
          lessonId,
          block: normalizedBlock,
          contentPageId: normalizedContentPageId,
          exerciseId: normalizedExerciseId,
        },
      },
    ).catch(() => {
      lastResumeMutationKeyRef.current = ''
    })
  }, [courseId, lessonId, block, contentPageId, exerciseId])

  useEffect(() => {
    return () => {
      lastResumeMutationKeyRef.current = ''
    }
  }, [courseId, lessonId])

  const lessonProgress =
    progress?.modules
      .flatMap((module: ModuleProgress) => module.lessons)
      .find((entry: LessonProgress) => entry.lessonId === lessonId) ?? null

  const moduleProgressById = new Map(
    (progress?.modules ?? []).map((module) => [module.moduleId, module]),
  )

  const wrongExercisesByLessonId = new Map<string, Set<string>>()
  for (const module of progress?.modules ?? []) {
    for (const entry of module.lessons) {
      for (const attempt of entry.exerciseAttempts) {
        if (attempt.attempted && attempt.isCorrect === false) {
          const set = wrongExercisesByLessonId.get(entry.lessonId) ?? new Set()
          set.add(attempt.exerciseId)
          wrongExercisesByLessonId.set(entry.lessonId, set)
        }
      }
    }
  }

  const pendingMistakeCount = Array.from(
    wrongExercisesByLessonId.values(),
  ).reduce((sum, set) => sum + set.size, 0)

  const overallProgressLabel = progress
    ? t('learners.progress.courseSummary', {
        completed: progress.completedExercises,
        total: progress.totalExercises,
      })
    : undefined

  const lessonProgressLabel = lessonProgress
    ? t('learners.progress.lessonSummary', {
        completed: lessonProgress.completedExercises,
        total: lessonProgress.totalExercises,
      })
    : undefined

  async function submitAttempt(args: {
    exerciseId: string
    answers: Record<string, string>
  }) {
    if (!courseVersionId) {
      throw new Error(t('learners.exercise.submitError'))
    }

    const response = await fetchGraphQL<{
      upsertLearnerExerciseAttempt: { id: string; isCorrect: boolean }
    }>(
      `mutation UpsertLearnerAttempt($input: LearnerExerciseAttemptInput!) {
        upsertLearnerExerciseAttempt(input: $input) {
          id
          isCorrect
        }
      }`,
      {
        input: {
          courseId,
          courseVersionId,
          lessonId,
          exerciseId: args.exerciseId,
          answers: Object.entries(args.answers).map(([key, value]) => ({
            key,
            value,
          })),
        },
      },
    )

    await router.invalidate()

    return { isCorrect: response.upsertLearnerExerciseAttempt.isCorrect }
  }

  async function openAttemptHistory(args: {
    lessonId: string
    exerciseId: string
    title: string
  }) {
    if (!courseVersionId) {
      return
    }

    setHistoryTarget(args)
    setHistoryOpen(true)
    setHistoryLoading(true)
    setHistoryError(null)

    try {
      const response = await fetchGraphQL<{
        learnerExerciseAttemptHistory: AttemptHistoryEntry[]
      }>(
        `query LearnerExerciseAttemptHistory(
          $courseId: String!
          $courseVersionId: String!
          $lessonId: String!
          $exerciseId: String!
        ) {
          learnerExerciseAttemptHistory(
            courseId: $courseId
            courseVersionId: $courseVersionId
            lessonId: $lessonId
            exerciseId: $exerciseId
          ) {
            id
            isCorrect
            attemptedAt
            answers {
              key
              value
            }
          }
        }`,
        {
          courseId,
          courseVersionId,
          lessonId: args.lessonId,
          exerciseId: args.exerciseId,
        },
      )

      setHistoryEntries(response.learnerExerciseAttemptHistory)
    } catch (error) {
      setHistoryEntries([])
      setHistoryError(
        error instanceof Error
          ? error.message
          : t('learners.review.historyError'),
      )
    } finally {
      setHistoryLoading(false)
    }
  }

  function closeHistory() {
    setHistoryOpen(false)
    setHistoryTarget(null)
    setHistoryEntries([])
    setHistoryError(null)
  }

  function buildSearch(base: Omit<LessonSearch, 'review'>): LessonSearch {
    return reviewModeEnabled ? { ...base, review: 'mistakes' } : base
  }

  function toggleReviewMode() {
    void router.navigate({
      to: '/courses/$courseId/lessons/$lessonId',
      params: { courseId, lessonId },
      search: {
        block,
        contentPageId,
        exerciseId,
        review: reviewModeEnabled ? undefined : 'mistakes',
      },
      replace: true,
    })
  }

  const visibleModules = reviewModeEnabled
    ? modules
        .map((module) => ({
          ...module,
          lessons: module.lessons
            .map((moduleLesson) => {
              const wrongSet = wrongExercisesByLessonId.get(moduleLesson.id)
              const wrongExercises = moduleLesson.exercises.filter((exercise) =>
                Boolean(wrongSet?.has(exercise.id)),
              )

              return {
                ...moduleLesson,
                contentPages: [] as StructureContentPage[],
                exercises: wrongExercises,
              }
            })
            .filter((moduleLesson) => moduleLesson.exercises.length > 0),
        }))
        .filter((module) => module.lessons.length > 0)
    : modules

  const lessonSelection =
    block === 'contentPage' && contentPageId
      ? { type: 'contentPage' as const, contentPageId }
      : block === 'exercise' && exerciseId
        ? { type: 'exercise' as const, exerciseId }
        : ({ type: 'summary' } as const)

  useEffect(() => {
    if (!lesson) {
      return
    }

    if (lessonSelection.type === 'contentPage') {
      const exists = lesson.contentPages.some(
        (page) => page.id === lessonSelection.contentPageId,
      )
      if (!exists) {
        void router.navigate({
          to: '/courses/$courseId/lessons/$lessonId',
          params: { courseId, lessonId },
          search: buildSearch({ block: 'summary' }),
          replace: true,
        })
      }
      return
    }

    if (lessonSelection.type === 'exercise') {
      const exists = lesson.exercises.some(
        (exercise) => exercise.id === lessonSelection.exerciseId,
      )
      if (!exists) {
        void router.navigate({
          to: '/courses/$courseId/lessons/$lessonId',
          params: { courseId, lessonId },
          search: buildSearch({ block: 'summary' }),
          replace: true,
        })
      }
    }
  }, [lesson, lessonSelection, router, courseId, lessonId, reviewModeEnabled])

  return (
    <section
      className={
        isStructureOpen
          ? 'learning-layout'
          : 'learning-layout structure-collapsed'
      }
      data-test="learning-layout"
    >
      <button
        type="button"
        className="ghost-button learning-structure-toggle"
        data-test="learning-structure-toggle"
        aria-expanded={isStructureOpen}
        onClick={() => setIsStructureOpen((prev) => !prev)}
      >
        {isStructureOpen
          ? t('learners.structure.hide')
          : t('learners.structure.show')}
      </button>

      <aside
        className={
          isStructureOpen
            ? 'learning-structure-panel'
            : 'learning-structure-panel collapsed'
        }
      >
        <div className="section-header">
          <h3>{t('learners.structure.title')}</h3>
          <div className="learning-structure-summary">
            {overallProgressLabel ? (
              <span className="muted" data-test="course-progress-label">
                {overallProgressLabel}
              </span>
            ) : null}
            <span className="muted" data-test="review-pending-count">
              {t('learners.review.pendingCount', {
                count: pendingMistakeCount,
              })}
            </span>
            <button
              type="button"
              className={
                reviewModeEnabled
                  ? 'ghost-button review-toggle active'
                  : 'ghost-button review-toggle'
              }
              data-test="review-mode-toggle"
              aria-pressed={reviewModeEnabled}
              onClick={toggleReviewMode}
            >
              {reviewModeEnabled
                ? t('learners.review.disable')
                : t('learners.review.enable')}
            </button>
          </div>
        </div>

        <div
          className="learning-structure-tree"
          data-test="learning-structure-tree"
        >
          {visibleModules.map((module) => {
            const firstLessonId = module.lessons[0]?.id
            const moduleActive = module.lessons.some(
              (moduleLesson) => moduleLesson.id === lessonId,
            )
            const moduleProgress = moduleProgressById.get(module.id)

            return (
              <div key={module.id} className="learning-structure-module">
                {reviewModeEnabled ? (
                  <div
                    className={
                      moduleActive
                        ? 'learning-structure-row active learning-structure-group'
                        : 'learning-structure-row learning-structure-group'
                    }
                    data-test="learning-structure-module"
                  >
                    <span>{module.title}</span>
                    <span className="muted">
                      {t('learners.structure.module')}
                    </span>
                  </div>
                ) : (
                  <Link
                    to="/courses/$courseId/lessons/$lessonId"
                    params={{
                      courseId,
                      lessonId: firstLessonId ?? lessonId,
                    }}
                    search={buildSearch({ block: 'summary' })}
                    className={
                      moduleActive
                        ? 'learning-structure-row active'
                        : 'learning-structure-row'
                    }
                    data-test="learning-structure-module"
                  >
                    <span>{module.title}</span>
                    <span className="muted">
                      {moduleProgress
                        ? t('learners.progress.modulePercent', {
                            percent: moduleProgress.percentComplete,
                          })
                        : t('learners.structure.module')}
                    </span>
                  </Link>
                )}

                <div className="learning-structure-children">
                  {module.lessons.map((moduleLesson) => {
                    const lessonActive = moduleLesson.id === lessonId
                    const summaryActive =
                      lessonActive &&
                      block !== 'contentPage' &&
                      block !== 'exercise'

                    return (
                      <div
                        key={moduleLesson.id}
                        className="learning-structure-lesson"
                      >
                        {reviewModeEnabled ? (
                          <div
                            className={
                              lessonActive
                                ? 'learning-structure-row active learning-structure-group'
                                : 'learning-structure-row learning-structure-group'
                            }
                            data-test="learning-structure-lesson"
                          >
                            <span>{moduleLesson.title}</span>
                            <span className="muted">
                              {t('learners.structure.lesson')}
                            </span>
                          </div>
                        ) : (
                          <Link
                            to="/courses/$courseId/lessons/$lessonId"
                            params={{ courseId, lessonId: moduleLesson.id }}
                            search={buildSearch({ block: 'summary' })}
                            className={
                              summaryActive
                                ? 'learning-structure-row active'
                                : 'learning-structure-row'
                            }
                            data-test="learning-structure-lesson"
                          >
                            <span>{moduleLesson.title}</span>
                            <span className="muted">
                              {t('learners.structure.summary')}
                            </span>
                          </Link>
                        )}

                        {(!reviewModeEnabled &&
                          moduleLesson.contentPages.length) ||
                        moduleLesson.exercises.length ? (
                          <div className="learning-structure-children exercises">
                            {!reviewModeEnabled
                              ? moduleLesson.contentPages.map((page) => {
                                  const contentPageActive =
                                    lessonActive &&
                                    block === 'contentPage' &&
                                    contentPageId === page.id

                                  return (
                                    <Link
                                      key={page.id}
                                      to="/courses/$courseId/lessons/$lessonId"
                                      params={{
                                        courseId,
                                        lessonId: moduleLesson.id,
                                      }}
                                      search={buildSearch({
                                        block: 'contentPage',
                                        contentPageId: page.id,
                                      })}
                                      className={
                                        contentPageActive
                                          ? 'learning-structure-row active'
                                          : 'learning-structure-row'
                                      }
                                      data-test="learning-structure-content-page"
                                    >
                                      <span>{page.title}</span>
                                      <span className="muted">
                                        {t('learners.structure.contentPage')}
                                      </span>
                                    </Link>
                                  )
                                })
                              : null}

                            {moduleLesson.exercises.map((exercise) => {
                              const exerciseActive =
                                lessonActive &&
                                block === 'exercise' &&
                                exerciseId === exercise.id

                              const isWrongExercise = Boolean(
                                wrongExercisesByLessonId
                                  .get(moduleLesson.id)
                                  ?.has(exercise.id),
                              )

                              const exerciseAttempt = moduleProgress?.lessons
                                .find(
                                  (entry) => entry.lessonId === moduleLesson.id,
                                )
                                ?.exerciseAttempts.find(
                                  (entry) => entry.exerciseId === exercise.id,
                                )

                              const exerciseStatusLabel =
                                exerciseAttempt?.attempted
                                  ? exerciseAttempt.isCorrect
                                    ? t(
                                        'learners.progress.exerciseStatusCorrect',
                                      )
                                    : t(
                                        'learners.progress.exerciseStatusAttempted',
                                      )
                                  : t('learners.structure.exercise')

                              return (
                                <div
                                  key={exercise.id}
                                  className="learning-structure-exercise-row"
                                >
                                  <Link
                                    to="/courses/$courseId/lessons/$lessonId"
                                    params={{
                                      courseId,
                                      lessonId: moduleLesson.id,
                                    }}
                                    search={buildSearch({
                                      block: 'exercise',
                                      exerciseId: exercise.id,
                                    })}
                                    className={
                                      exerciseActive
                                        ? isWrongExercise
                                          ? 'learning-structure-row active wrong'
                                          : 'learning-structure-row active'
                                        : isWrongExercise
                                          ? 'learning-structure-row wrong'
                                          : 'learning-structure-row'
                                    }
                                    data-test="learning-structure-exercise"
                                  >
                                    <span>{exercise.title}</span>
                                    <span className="muted">
                                      {exerciseStatusLabel}
                                    </span>
                                  </Link>
                                  <button
                                    type="button"
                                    className="ghost-button learning-history-trigger"
                                    data-test="learning-structure-exercise-history"
                                    onClick={() =>
                                      void openAttemptHistory({
                                        lessonId: moduleLesson.id,
                                        exerciseId: exercise.id,
                                        title: exercise.title,
                                      })
                                    }
                                    aria-label={t(
                                      'learners.review.historyOpenAria',
                                      {
                                        title: exercise.title,
                                      },
                                    )}
                                  >
                                    {t('learners.review.historyButton')}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      <div className="learning-content-column">
        <LessonView
          lesson={lesson}
          selection={lessonSelection}
          lessonProgressLabel={lessonProgressLabel}
          onSubmitAttempt={submitAttempt}
        />
        {historyOpen ? (
          <section
            className="attempt-history-panel"
            data-test="attempt-history-panel"
          >
            <div className="attempt-history-header">
              <h3>{t('learners.review.historyTitle')}</h3>
              <button
                type="button"
                className="ghost-button"
                onClick={closeHistory}
              >
                {t('learners.review.closeHistory')}
              </button>
            </div>

            {historyTarget ? (
              <p className="muted">
                {t('learners.review.historyForExercise', {
                  title: historyTarget.title,
                })}
              </p>
            ) : null}

            {historyLoading ? (
              <p className="muted">{t('learners.review.historyLoading')}</p>
            ) : historyError ? (
              <p className="status-error">{historyError}</p>
            ) : historyEntries.length === 0 ? (
              <p className="muted">{t('learners.review.historyEmpty')}</p>
            ) : (
              <ol className="attempt-history-list">
                {historyEntries.map((entry) => (
                  <li key={entry.id} className="attempt-history-item">
                    <div className="attempt-history-item-header">
                      <strong>
                        {entry.isCorrect
                          ? t('learners.review.historyStatusCorrect')
                          : t('learners.review.historyStatusIncorrect')}
                      </strong>
                      <span className="muted">
                        {new Date(entry.attemptedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="attempt-history-answers muted">
                      {entry.answers.length > 0
                        ? entry.answers
                            .map((answer) => `${answer.key}: ${answer.value}`)
                            .join(', ')
                        : t('learners.review.historyNoAnswers')}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ) : null}
      </div>
    </section>
  )
}
