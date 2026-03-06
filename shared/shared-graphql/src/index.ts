import { GraphQLClient } from 'graphql-request'
import { QueryClient } from '@tanstack/query-core'
import { appConfig } from '@app/shared-config'

export * from './types'

export function createGraphQLClient(endpoint: string = appConfig.graphqlEndpoint) {
  return new GraphQLClient(endpoint, {
    credentials: 'include',
  })
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}
