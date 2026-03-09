import { createServer } from 'node:http'
import { createApiApp } from './app.js'
import { loadNodeRuntimeEnv } from './runtime/env.js'
import { createRuntimeServices } from './runtime/services.js'

const env = loadNodeRuntimeEnv()
const services = await createRuntimeServices(env)
const apiApp = await createApiApp(services)

const server = createServer(apiApp)
const port = env.port

server.listen(port, () => {
  console.log(
    `[api] GraphQL server running on http://localhost:${port}/graphql`,
  )
})
