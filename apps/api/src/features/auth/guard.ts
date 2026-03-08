import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../../graphql/context.js'

export function requireAuthenticatedUser(ctx: GraphQLContext) {
  if (ctx.authError) {
    throw new GraphQLError('Invalid or expired authentication token.', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }

  if (!ctx.user) {
    throw new GraphQLError('Authentication required.', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }

  return ctx.user
}
