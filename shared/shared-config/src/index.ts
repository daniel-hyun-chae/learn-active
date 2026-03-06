type ViteEnv = {
  VITE_GRAPHQL_ENDPOINT?: string
}

const viteEnv = typeof import.meta !== 'undefined'
  ? (import.meta as ImportMeta & { env?: ViteEnv }).env
  : undefined

const processEnv = typeof process !== 'undefined' ? process.env : undefined

export const appConfig = {
  graphqlEndpoint:
    viteEnv?.VITE_GRAPHQL_ENDPOINT ??
    processEnv?.GRAPHQL_ENDPOINT ??
    '/graphql',
}
