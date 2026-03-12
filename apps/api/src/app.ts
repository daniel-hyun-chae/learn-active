import 'reflect-metadata'
import { createYoga } from 'graphql-yoga'
import { createSchema } from './graphql/schema.js'
import { createContextFactory } from './graphql/context.js'
import type { RuntimeServices } from './runtime/services.js'

export async function createApiApp(services: RuntimeServices) {
  const schema = await createSchema()

  return createYoga({
    schema,
    context: createContextFactory(services),
    graphqlEndpoint: services.env.graphqlEndpoint,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  })
}
