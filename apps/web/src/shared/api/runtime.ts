import { appConfig } from '@app/shared-config'

type RuntimeWithConfig = typeof globalThis & {
  __APP_THEME__?: string
  __GRAPHQL_ENDPOINT__?: string
  __SUPABASE_URL__?: string
  __SUPABASE_PUBLISHABLE_KEY__?: string
}

type RuntimeStage = 'local' | 'staging' | 'production'

export type SupabaseRuntimeConfig = {
  supabaseUrl: string
  supabasePublishableKey: string
}

function normalizeSupabaseUrlForBrowser(rawUrl: string) {
  if (typeof window === 'undefined') {
    return rawUrl
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return rawUrl
  }

  const localForwardPort = getImportMetaEnvValue('VITE_SUPABASE_FORWARD_PORT')
  if (!localForwardPort) {
    return rawUrl
  }

  const host = parsed.hostname.toLowerCase()
  const isLoopback =
    host === '127.0.0.1' ||
    host === 'localhost' ||
    host === '::1' ||
    host === '[::1]'

  if (!isLoopback) {
    return rawUrl
  }

  parsed.hostname = window.location.hostname || 'localhost'
  parsed.port = localForwardPort
  return parsed.toString()
}

function normalizeGraphQLEndpointForBrowser(rawUrl: string) {
  if (typeof window === 'undefined') {
    return rawUrl
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return rawUrl
  }

  const localForwardPort = getImportMetaEnvValue('VITE_GRAPHQL_FORWARD_PORT')
  if (!localForwardPort) {
    return rawUrl
  }

  const host = parsed.hostname.toLowerCase()
  const isLoopback =
    host === '127.0.0.1' ||
    host === 'localhost' ||
    host === '::1' ||
    host === '[::1]'

  if (!isLoopback) {
    return rawUrl
  }

  parsed.hostname = window.location.hostname || 'localhost'
  parsed.port = localForwardPort
  return parsed.toString()
}

export type WebRuntimeConfig = {
  theme: string
  graphqlEndpoint: string
  supabase: SupabaseRuntimeConfig | null
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

function getRuntimeStage(): RuntimeStage {
  const stage = getImportMetaEnvValue('VITE_APP_ENV', 'APP_ENV')
  if (stage === 'staging' || stage === 'production' || stage === 'local') {
    return stage
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

function assertHostedUrl(name: string, value: string, stage: RuntimeStage) {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(
      `[web-runtime] ${name} must be an absolute URL for ${stage}. Received: ${value}`,
    )
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(
      `[web-runtime] ${name} must use https for ${stage}. Received: ${value}`,
    )
  }

  if (isLocalhostHost(parsed.hostname.toLowerCase())) {
    throw new Error(
      `[web-runtime] ${name} must not target localhost for ${stage}. Received: ${value}`,
    )
  }
}

function assertWebRuntimeConfig(config: WebRuntimeConfig) {
  const stage = getRuntimeStage()
  if (stage === 'local') {
    return
  }

  assertHostedUrl('graphqlEndpoint', config.graphqlEndpoint, stage)

  if (!config.supabase) {
    throw new Error(
      `[web-runtime] Supabase runtime config is required for ${stage} environment.`,
    )
  }

  assertHostedUrl('supabaseUrl', config.supabase.supabaseUrl, stage)
}

export function getRuntimeEndpoint() {
  if (typeof globalThis !== 'undefined') {
    const runtimeEndpoint = getRuntime().__GRAPHQL_ENDPOINT__
    if (runtimeEndpoint) {
      return normalizeGraphQLEndpointForBrowser(runtimeEndpoint)
    }
  }

  const fallbackEnv = getImportMetaEnvValue('VITE_GRAPHQL_ENDPOINT')
  if (fallbackEnv) {
    return normalizeGraphQLEndpointForBrowser(fallbackEnv)
  }

  return normalizeGraphQLEndpointForBrowser(appConfig.graphqlEndpoint)
}

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig | null {
  const runtime = getRuntime()

  const supabaseUrl =
    runtime.__SUPABASE_URL__ ?? getImportMetaEnvValue('VITE_SUPABASE_URL')

  const supabasePublishableKey =
    runtime.__SUPABASE_PUBLISHABLE_KEY__ ??
    getImportMetaEnvValue('VITE_SUPABASE_PUBLISHABLE_KEY')

  if (!supabaseUrl || !supabasePublishableKey) {
    return null
  }

  return {
    supabaseUrl: normalizeSupabaseUrlForBrowser(supabaseUrl),
    supabasePublishableKey,
  }
}

export function getWebRuntimeConfig(): WebRuntimeConfig {
  const config: WebRuntimeConfig = {
    theme:
      getRuntime().__APP_THEME__ ??
      getImportMetaEnvValue('VITE_APP_THEME') ??
      'dark',
    graphqlEndpoint: getRuntimeEndpoint(),
    supabase: getSupabaseRuntimeConfig(),
  }

  assertWebRuntimeConfig(config)

  return config
}
