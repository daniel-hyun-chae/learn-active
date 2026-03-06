import type { YogaInitialContext } from 'graphql-yoga'
import { createDb } from '../db/connection.js'

const dbPromise = createDb()

export type GraphQLContext = {
  db: Awaited<ReturnType<typeof createDb>>
  request: YogaInitialContext['request']
}

export async function createContext({
  request,
}: YogaInitialContext): Promise<GraphQLContext> {
  const db = await dbPromise
  return {
    db,
    request,
  }
}
