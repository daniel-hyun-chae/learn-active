import { getRuntimeEndpoint } from './runtime'

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

type AccessTokenProvider = () => Promise<string | null> | string | null

let accessTokenProvider: AccessTokenProvider | null = null

export function setGraphQLAccessTokenProvider(
  provider: AccessTokenProvider | null,
) {
  accessTokenProvider = provider
}

export async function fetchGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
) {
  const endpoint = getRuntimeEndpoint()
  const accessToken = accessTokenProvider ? await accessTokenProvider() : null

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }

  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed with ${response.status}`)
  }

  const payload = (await response.json()) as GraphQLResponse<T>
  if (payload.errors?.length) {
    throw new Error(
      payload.errors
        .map((error) => error.message ?? 'GraphQL error')
        .join(', '),
    )
  }

  if (!payload.data) {
    throw new Error('GraphQL response missing data')
  }

  return payload.data
}
