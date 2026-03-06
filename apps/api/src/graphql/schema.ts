import { buildSchema } from 'type-graphql'
import { HealthResolver } from '../features/health/resolver.js'
import { QuizResolver } from '../features/quiz/resolver.js'
import { CourseResolver } from '../features/course/resolver.js'

export async function createSchema() {
  return buildSchema({
    resolvers: [HealthResolver, QuizResolver, CourseResolver],
    validate: false,
  })
}
