import type { YogaInitialContext } from 'graphql-yoga'
import { createDb } from '../db/connection.js'
import {
  getBearerToken,
  type AuthenticatedUser,
  verifyAccessToken,
} from '../features/auth/token.js'

const dbPromise = createDb()

export type GraphQLContext = {
  db: Awaited<ReturnType<typeof createDb>>
  request: YogaInitialContext['request'] & {
    user?: { id: string; email: string | null }
  }
  user: AuthenticatedUser | null
  authError: string | null
}

export async function createContext({
  request,
}: YogaInitialContext): Promise<GraphQLContext> {
  const db = await dbPromise

  let user: AuthenticatedUser | null = null
  let authError: string | null = null

  const bearerToken = getBearerToken(request)
  if (bearerToken) {
    try {
      user = await verifyAccessToken(bearerToken)
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error)
    }
  } else if (process.env.API_AUTH_BYPASS_FOR_E2E === 'true') {
    user = {
      id: 'e2e-user',
      email: 'e2e@example.local',
    }
  }

  const requestWithUser = request as GraphQLContext['request']
  if (user) {
    requestWithUser.user = {
      id: user.id,
      email: user.email,
    }
  }

  return {
    db,
    request: requestWithUser,
    user,
    authError,
  }
}
