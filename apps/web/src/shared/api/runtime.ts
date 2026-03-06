import { appConfig } from '@app/shared-config'

export function getRuntimeEndpoint() {
  if (typeof globalThis !== 'undefined') {
    const runtimeEndpoint = (
      globalThis as typeof globalThis & {
        __GRAPHQL_ENDPOINT__?: string
      }
    ).__GRAPHQL_ENDPOINT__
    if (runtimeEndpoint) {
      return runtimeEndpoint
    }

    const envEndpoint = (
      globalThis as typeof globalThis & {
        process?: { env?: Record<string, string | undefined> }
      }
    ).process?.env?.GRAPHQL_ENDPOINT
    if (envEndpoint) {
      return envEndpoint
    }
  }

  const fallbackEnv = (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> }
    }
  ).process?.env?.GRAPHQL_ENDPOINT
  if (fallbackEnv) {
    return fallbackEnv
  }

  return appConfig.graphqlEndpoint
}
