import { appConfig } from '@app/shared-config'

type RuntimeWithConfig = typeof globalThis & {
  __APP_THEME__?: string
  __GRAPHQL_ENDPOINT__?: string
  __SUPABASE_URL__?: string
  __SUPABASE_ANON_KEY__?: string
}

export type SupabaseRuntimeConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
}

export type WebRuntimeConfig = {
  theme: string
  graphqlEndpoint: string
  supabase: SupabaseRuntimeConfig | null
  authBypassForE2E: boolean
}

function getRuntime() {
  return globalThis as RuntimeWithConfig
}

function getImportMetaEnvValue(...keys: string[]) {
  for (const key of keys) {
    const envValue = import.meta.env[key]
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
  }

  const fallbackEnv = getImportMetaEnvValue('VITE_GRAPHQL_ENDPOINT')
  if (fallbackEnv) {
    return fallbackEnv
  }

  return appConfig.graphqlEndpoint
}

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig | null {
  const runtime = getRuntime()

  const supabaseUrl =
    runtime.__SUPABASE_URL__ ?? getImportMetaEnvValue('VITE_SUPABASE_URL')

  const supabaseAnonKey =
    runtime.__SUPABASE_ANON_KEY__ ??
    getImportMetaEnvValue('VITE_SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  }
}

export function isWebAuthBypassEnabled() {
  return getImportMetaEnvValue('VITE_AUTH_BYPASS_FOR_E2E') === 'true'
}

export function getWebRuntimeConfig(): WebRuntimeConfig {
  return {
    theme:
      getRuntime().__APP_THEME__ ??
      getImportMetaEnvValue('VITE_APP_THEME') ??
      'dark',
    graphqlEndpoint: getRuntimeEndpoint(),
    supabase: getSupabaseRuntimeConfig(),
    authBypassForE2E: isWebAuthBypassEnabled(),
  }
}
