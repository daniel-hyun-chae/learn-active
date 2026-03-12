import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LessonView } from '../features/learners/course/LessonView'
import type { Lesson } from '../features/learners/course/types'
import { requireWebSession } from '../features/auth/route-guard'
import { fetchGraphQL } from '../shared/api/graphql'

type LessonSearch = {
  block?: 'summary' | 'contentPage' | 'exercise'
  contentPageId?: string
  exerciseId?: string
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
  courseId: string
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

  if (block === 'contentPage') {
    return { block, contentPageId }
  }
  if (block === 'exercise') {
    return { block, exerciseId }
  }
  return { block: 'summary' }
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

    const data = await fetchGraphQL<{
      learnerCourse: {
        modules: Array<{
          id: string
          title: string
          order: number
          lessons: Lesson[]
        }>
      } | null
    }>(
      `query CourseLesson($id: String!) {
        learnerCourse(id: $id) {
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

    return { lesson, modules, courseId }
  },
  component: LessonRoute,
})

function LessonRoute() {
  const { t } = useTranslation()
  const { lesson, modules, courseId } = Route.useLoaderData() as LoaderData
  const { lessonId } = Route.useParams() as { lessonId: string }
  const { block, contentPageId, exerciseId } = Route.useSearch() as LessonSearch
  const [isStructureOpen, setIsStructureOpen] = useState(true)

  if (!lesson) {
    return <p className="muted">{t('learners.lesson.notFound')}</p>
  }

  const lessonSelection =
    block === 'contentPage' && contentPageId
      ? { type: 'contentPage' as const, contentPageId }
      : block === 'exercise' && exerciseId
        ? { type: 'exercise' as const, exerciseId }
        : ({ type: 'summary' } as const)

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
        </div>

        <div
          className="learning-structure-tree"
          data-test="learning-structure-tree"
        >
          {modules.map((module) => {
            const firstLessonId = module.lessons[0]?.id
            const moduleActive = module.lessons.some(
              (moduleLesson) => moduleLesson.id === lessonId,
            )

            return (
              <div key={module.id} className="learning-structure-module">
                <Link
                  to="/courses/$courseId/lessons/$lessonId"
                  params={{
                    courseId,
                    lessonId: firstLessonId ?? lessonId,
                  }}
                  search={{ block: 'summary' }}
                  className={
                    moduleActive
                      ? 'learning-structure-row active'
                      : 'learning-structure-row'
                  }
                  data-test="learning-structure-module"
                >
                  <span>{module.title}</span>
                  <span className="muted">
                    {t('learners.structure.module')}
                  </span>
                </Link>

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
                        <Link
                          to="/courses/$courseId/lessons/$lessonId"
                          params={{ courseId, lessonId: moduleLesson.id }}
                          search={{ block: 'summary' }}
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

                        {moduleLesson.contentPages.length ||
                        moduleLesson.exercises.length ? (
                          <div className="learning-structure-children exercises">
                            {moduleLesson.contentPages.map((page) => {
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
                                  search={{
                                    block: 'contentPage',
                                    contentPageId: page.id,
                                  }}
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
                            })}

                            {moduleLesson.exercises.map((exercise) => {
                              const exerciseActive =
                                lessonActive &&
                                block === 'exercise' &&
                                exerciseId === exercise.id

                              return (
                                <Link
                                  key={exercise.id}
                                  to="/courses/$courseId/lessons/$lessonId"
                                  params={{
                                    courseId,
                                    lessonId: moduleLesson.id,
                                  }}
                                  search={{
                                    block: 'exercise',
                                    exerciseId: exercise.id,
                                  }}
                                  className={
                                    exerciseActive
                                      ? 'learning-structure-row active'
                                      : 'learning-structure-row'
                                  }
                                  data-test="learning-structure-exercise"
                                >
                                  <span>{exercise.title}</span>
                                  <span className="muted">
                                    {t('learners.structure.exercise')}
                                  </span>
                                </Link>
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
        <LessonView lesson={lesson} selection={lessonSelection} />
      </div>
    </section>
  )
}
