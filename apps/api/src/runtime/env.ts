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
}

export type WorkerBindings = {
  APP_ENV?: string
  DATABASE_URL?: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  PORT?: string
}

function normalizeOptional(value: string | undefined) {
  const next = value?.trim()
  return next ? next : null
}

function resolveStage(value: string | undefined): RuntimeStage {
  if (value === 'production' || value === 'staging' || value === 'local') {
    return value
  }

  return 'local'
}

function isLocalhostHost(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  )
}

function assertHostedSupabaseUrl(
  stage: RuntimeStage,
  supabaseUrl: string | null,
) {
  if (stage === 'local') {
    return
  }

  if (!supabaseUrl) {
    throw new Error(
      `[api-runtime] SUPABASE_URL is required for ${stage} runtime configuration.`,
    )
  }

  let parsed: URL
  try {
    parsed = new URL(supabaseUrl)
  } catch {
    throw new Error(
      `[api-runtime] SUPABASE_URL must be an absolute URL for ${stage}. Received: ${supabaseUrl}`,
    )
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(
      `[api-runtime] SUPABASE_URL must use https for ${stage}. Received: ${supabaseUrl}`,
    )
  }

  if (isLocalhostHost(parsed.hostname.toLowerCase())) {
    throw new Error(
      `[api-runtime] SUPABASE_URL must not target localhost for ${stage}. Received: ${supabaseUrl}`,
    )
  }
}

function assertRuntimeEnv(runtimeEnv: ApiRuntimeEnv) {
  assertHostedSupabaseUrl(runtimeEnv.stage, runtimeEnv.supabaseUrl)
}

export function loadNodeRuntimeEnv(
  source: Record<string, string | undefined> = process.env,
): ApiRuntimeEnv {
  const runtimeEnv: ApiRuntimeEnv = {
    target: 'node',
    stage: resolveStage(source.APP_ENV ?? source.NODE_ENV),
    port: Number(source.PORT ?? 4000),
    graphqlEndpoint: '/graphql',
    databaseUrl: normalizeOptional(source.DATABASE_URL),
    supabaseUrl: normalizeOptional(source.SUPABASE_URL),
    supabaseServiceRoleKey: normalizeOptional(source.SUPABASE_SERVICE_ROLE_KEY),
  }

  assertRuntimeEnv(runtimeEnv)

  return runtimeEnv
}

export function loadWorkerRuntimeEnv(bindings: WorkerBindings): ApiRuntimeEnv {
  const runtimeEnv: ApiRuntimeEnv = {
    target: 'worker',
    stage: resolveStage(bindings.APP_ENV),
    port: Number(bindings.PORT ?? 4000),
    graphqlEndpoint: '/graphql',
    databaseUrl: normalizeOptional(bindings.DATABASE_URL),
    supabaseUrl: normalizeOptional(bindings.SUPABASE_URL),
    supabaseServiceRoleKey: normalizeOptional(
      bindings.SUPABASE_SERVICE_ROLE_KEY,
    ),
  }

  assertRuntimeEnv(runtimeEnv)

  return runtimeEnv
}
