import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('[db:migrate] DATABASE_URL is required')
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsFolder = path.resolve(__dirname, '../../drizzle')

if (!fs.existsSync(migrationsFolder)) {
  console.log('[db:migrate] No migrations folder; skipping')
  process.exit(0)
}

const { Pool } = pg
const pool = new Pool({ connectionString: databaseUrl })
const db = drizzle(pool)

try {
  await migrate(db, { migrationsFolder })
} finally {
  await pool.end()
}
