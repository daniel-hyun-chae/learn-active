import {
  createApiApp,
  handleStripeWebhookRequest,
  isStripeWebhookRequest,
} from './app.js'
import { loadWorkerRuntimeEnv, type WorkerBindings } from './runtime/env.js'
import type { WorkerExecutionContext } from './runtime/http.js'
import { createRuntimeServices } from './runtime/services.js'

const appByBindingKey = new Map<
  string,
  Promise<{
    app: Awaited<ReturnType<typeof createApiApp>>
    services: Awaited<ReturnType<typeof createRuntimeServices>>
  }>
>()

function getBindingKey(bindings: WorkerBindings) {
  const appEnv = bindings.APP_ENV ?? 'local'
  const databaseUrl = bindings.DATABASE_URL ?? ''
  const supabaseUrl = bindings.SUPABASE_URL ?? ''
  const hasServiceRole = bindings.SUPABASE_SERVICE_ROLE_KEY ? '1' : '0'
  const stripeSecretKey = bindings.STRIPE_SECRET_KEY ? '1' : '0'
  const stripePublishableKey = bindings.STRIPE_PUBLISHABLE_KEY ?? ''
  const stripeWebhookSecret = bindings.STRIPE_WEBHOOK_SECRET ? '1' : '0'
  return `${appEnv}|${databaseUrl}|${supabaseUrl}|${hasServiceRole}|${stripeSecretKey}|${stripePublishableKey}|${stripeWebhookSecret}`
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
    const app = await createApiApp(services)
    return { app, services }
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
    const { app, services } = await getApiApp(bindings)
    if (isStripeWebhookRequest(request, services)) {
      return handleStripeWebhookRequest(request, services)
    }
    return app.fetch(request, bindings, context)
  },
}
