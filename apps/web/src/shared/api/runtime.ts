import { appConfig } from '@app/shared-config'

type RuntimeWithConfig = typeof globalThis & {
  __GRAPHQL_ENDPOINT__?: string
  __SUPABASE_URL__?: string
  __SUPABASE_ANON_KEY__?: string
  process?: { env?: Record<string, string | undefined> }
}

export type SupabaseRuntimeConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
}

function getRuntime() {
  return globalThis as RuntimeWithConfig
}

function getRuntimeEnvValue(...keys: string[]) {
  const runtime = getRuntime()

  for (const key of keys) {
    const envValue = runtime.process?.env?.[key]
    if (envValue) {
      return envValue
    }
  }

  return undefined
}

export function getRuntimeEndpoint() {
  if (typeof globalThis !== 'undefined') {
    const runtimeEndpoint = getRuntime().__GRAPHQL_ENDPOINT__
    if (runtimeEndpoint) {
      return runtimeEndpoint
    }

    const envEndpoint = getRuntimeEnvValue(
      'VITE_GRAPHQL_ENDPOINT',
      'GRAPHQL_ENDPOINT',
    )
    if (envEndpoint) {
      return envEndpoint
    }
  }

  const fallbackEnv = getRuntimeEnvValue(
    'VITE_GRAPHQL_ENDPOINT',
    'GRAPHQL_ENDPOINT',
  )
  if (fallbackEnv) {
    return fallbackEnv
  }

  return appConfig.graphqlEndpoint
}

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig | null {
  const runtime = getRuntime()

  const supabaseUrl =
    runtime.__SUPABASE_URL__ ??
    getRuntimeEnvValue('VITE_SUPABASE_URL', 'SUPABASE_URL')

  const supabaseAnonKey =
    runtime.__SUPABASE_ANON_KEY__ ??
    getRuntimeEnvValue('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  }
}
