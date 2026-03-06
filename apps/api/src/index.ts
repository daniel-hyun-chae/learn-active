import { createServer } from 'node:http'
import 'reflect-metadata'
import { createYoga } from 'graphql-yoga'
import { createSchema } from './graphql/schema.js'
import { createContext } from './graphql/context.js'

const schema = await createSchema()
const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: '/graphql',
})

const server = createServer(yoga)
const port = Number(process.env.PORT ?? 4000)

server.listen(port, () => {
  console.log(`[api] GraphQL server running on http://localhost:${port}/graphql`)
})
