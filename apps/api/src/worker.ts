import { createApiApp } from './app.js'
import { loadWorkerRuntimeEnv, type WorkerBindings } from './runtime/env.js'
import type { WorkerExecutionContext } from './runtime/http.js'
import { createRuntimeServices } from './runtime/services.js'

const appByBindingKey = new Map<
  string,
  Promise<Awaited<ReturnType<typeof createApiApp>>>
>()

function getBindingKey(bindings: WorkerBindings) {
  const appEnv = bindings.APP_ENV ?? 'local'
  const databaseUrl = bindings.DATABASE_URL ?? ''
  const supabaseUrl = bindings.SUPABASE_URL ?? ''
  const hasServiceRole = bindings.SUPABASE_SERVICE_ROLE_KEY ? '1' : '0'
  return `${appEnv}|${databaseUrl}|${supabaseUrl}|${hasServiceRole}`
}

async function getApiApp(bindings: WorkerBindings) {
  const key = getBindingKey(bindings)
  const existing = appByBindingKey.get(key)
  if (existing) {
    return existing
  }

  const next = (async () => {
    const env = loadWorkerRuntimeEnv(bindings)
    const services = await createRuntimeServices(env)
    return createApiApp(services)
  })()

  appByBindingKey.set(key, next)
  return next
}

export default {
  async fetch(
    request: Request,
    bindings: WorkerBindings,
    context: WorkerExecutionContext,
  ) {
    const app = await getApiApp(bindings)
    return app.fetch(request, bindings, context)
  },
}
