import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { sql } from 'drizzle-orm'
import * as schema from './schema.js'
import { seedCourseRow } from '../features/course/seed.js'

export async function createDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    return null
  }

  const { Pool } = pg
  const pool = new Pool({ connectionString })
  const db = drizzle(pool, { schema })

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS courses (
      id text PRIMARY KEY,
      title text NOT NULL,
      description text NOT NULL,
      language text NOT NULL,
      content jsonb NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  `)

  const existing = await db
    .select({ id: schema.courses.id })
    .from(schema.courses)
    .limit(1)
  if (existing.length === 0) {
    await db.insert(schema.courses).values(seedCourseRow)
  }

  return db
}
