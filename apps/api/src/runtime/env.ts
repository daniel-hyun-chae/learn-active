export type RuntimeTarget = 'node' | 'worker'

export type RuntimeStage = 'local' | 'staging' | 'production'

export type ApiRuntimeEnv = {
  target: RuntimeTarget
  stage: RuntimeStage
  port: number
  graphqlEndpoint: '/graphql'
  databaseUrl: string | null
  supabaseUrl: string | null
  supabaseServiceRoleKey: string | null
  apiAuthBypassForE2E: boolean
}

export type WorkerBindings = {
  APP_ENV?: string
  DATABASE_URL?: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  API_AUTH_BYPASS_FOR_E2E?: string
  PORT?: string
}

function normalizeOptional(value: string | undefined) {
  const next = value?.trim()
  return next ? next : null
}

function toBoolean(value: string | undefined) {
  return value === '1' || value === 'true'
}

function resolveStage(value: string | undefined): RuntimeStage {
  if (value === 'production' || value === 'staging' || value === 'local') {
    return value
  }

  return 'local'
}

export function loadNodeRuntimeEnv(
  source: Record<string, string | undefined> = process.env,
): ApiRuntimeEnv {
  return {
    target: 'node',
    stage: resolveStage(source.APP_ENV ?? source.NODE_ENV),
    port: Number(source.PORT ?? 4000),
    graphqlEndpoint: '/graphql',
    databaseUrl: normalizeOptional(source.DATABASE_URL),
    supabaseUrl: normalizeOptional(source.SUPABASE_URL),
    supabaseServiceRoleKey: normalizeOptional(source.SUPABASE_SERVICE_ROLE_KEY),
    apiAuthBypassForE2E: toBoolean(source.API_AUTH_BYPASS_FOR_E2E),
  }
}

export function loadWorkerRuntimeEnv(bindings: WorkerBindings): ApiRuntimeEnv {
  return {
    target: 'worker',
    stage: resolveStage(bindings.APP_ENV),
    port: Number(bindings.PORT ?? 4000),
    graphqlEndpoint: '/graphql',
    databaseUrl: normalizeOptional(bindings.DATABASE_URL),
    supabaseUrl: normalizeOptional(bindings.SUPABASE_URL),
    supabaseServiceRoleKey: normalizeOptional(
      bindings.SUPABASE_SERVICE_ROLE_KEY,
    ),
    apiAuthBypassForE2E: toBoolean(bindings.API_AUTH_BYPASS_FOR_E2E),
  }
}
