type GraphQLError = {
  message: string
}

type GraphQLPayload<T> = {
  data?: T
  errors?: GraphQLError[]
}

function getRuntimeEndpoint() {
  const env = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env
  return (
    env?.EXPO_PUBLIC_GRAPHQL_ENDPOINT ??
    env?.GRAPHQL_ENDPOINT ??
    'http://localhost:4000/graphql'
  )
}

export async function fetchGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
) {
  const response = await fetch(getRuntimeEndpoint(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed with ${response.status}`)
  }

  const payload = (await response.json()) as GraphQLPayload<T>
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('\n'))
  }
  if (!payload.data) {
    throw new Error('GraphQL response missing data')
  }
  return payload.data
}
