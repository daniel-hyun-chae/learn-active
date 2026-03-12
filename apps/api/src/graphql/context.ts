import type { YogaInitialContext } from 'graphql-yoga'
import type { RuntimeServices } from '../runtime/services.js'
import {
  getBearerToken,
  type AuthenticatedUser,
  verifyAccessToken,
} from '../features/auth/token.js'

export type GraphQLContext = {
  services: RuntimeServices
  request: YogaInitialContext['request'] & {
    user?: { id: string; email: string | null }
  }
  user: AuthenticatedUser | null
  authError: string | null
}

export function createContextFactory(services: RuntimeServices) {
  return async function createContext({
    request,
  }: YogaInitialContext): Promise<GraphQLContext> {
    const { env } = services

    let user: AuthenticatedUser | null = null
    let authError: string | null = null

    const bearerToken = getBearerToken(request)
    if (bearerToken) {
      try {
        user = await verifyAccessToken(bearerToken, {
          supabaseUrl: env.supabaseUrl,
        })
      } catch (error) {
        authError = error instanceof Error ? error.message : String(error)
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
      services,
      request: requestWithUser,
      user,
      authError,
    }
  }
}
