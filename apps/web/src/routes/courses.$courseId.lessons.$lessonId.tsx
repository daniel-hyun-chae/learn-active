import { createFileRoute } from '@tanstack/react-router'
import { fetchGraphQL } from '../shared/api/graphql'
import type { Lesson } from '../features/learners/course/types'
import { useTranslation } from 'react-i18next'
import { LessonView } from '../features/learners/course/LessonView'

type LoaderData = {
  lesson: Lesson | null
}

export const Route = createFileRoute('/courses/$courseId/lessons/$lessonId')({
  loader: async ({ params }) => {
    const { courseId, lessonId } = params as {
      courseId: string
      lessonId: string
    }
    const data = await fetchGraphQL<{
      course: {
        modules: Array<{
          lessons: Lesson[]
        }>
      } | null
    }>(
      `query CourseLesson($id: String!) {
        course(id: $id) {
          modules {
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

    const lessons =
      data.course?.modules.flatMap((module) => module.lessons) ?? []
    const lesson = lessons.find((item) => item.id === lessonId) ?? null
    return { lesson }
  },
  component: LessonRoute,
})

function LessonRoute() {
  const { t } = useTranslation()
  const { lesson } = Route.useLoaderData() as LoaderData
  if (!lesson) {
    return <p className="muted">{t('learners.lesson.notFound')}</p>
  }

  return <LessonView lesson={lesson} />
}
