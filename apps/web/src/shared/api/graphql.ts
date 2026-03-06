import { getRuntimeEndpoint } from './runtime'

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

export async function fetchGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
) {
  const endpoint = getRuntimeEndpoint()
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
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
