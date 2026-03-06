import { createFileRoute } from '@tanstack/react-router'
import { fetchGraphQL } from '../shared/api/graphql'
import { PublisherHome } from '../features/publishers/PublisherHome'
import type { CourseDraft } from '../features/publishers/types'

type LoaderData = {
  courses: CourseDraft[]
}

export const Route = createFileRoute('/publish')({
  loader: async () => {
    const data = await fetchGraphQL<{
      courses: CourseDraft[]
    }>(
      `query PublisherCourses {
        courses {
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
              contents {
                id
                type
                text
                imageUrl
                imageAlt
                lexicalJson
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
    )

    return { courses: data.courses }
  },
  component: PublisherRoute,
})

function PublisherRoute() {
  const data = Route.useLoaderData() as LoaderData
  return <PublisherHome courses={data.courses} />
}
