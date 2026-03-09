import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.js'

export async function createNodeDb(connectionString: string | null) {
  if (!connectionString) {
    return null
  }

  const { Pool } = pg
  const pool = new Pool({ connectionString })

  try {
    const db = drizzle(pool, { schema })
    await pool.query('select 1')

    return db
  } catch (error) {
    console.warn(
      '[db] Database unavailable, falling back to in-memory seed data',
    )
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[db] ${message}`)
    await pool.end().catch(() => {})
    return null
  }
}
