import { eq } from 'drizzle-orm'
import type { createNodeDb } from '../../db/connection.js'
import { courses as coursesTable } from '../../db/schema.js'
import type { CourseRecord } from './model.js'
import { seedCourseRow } from './seed.js'

type NodeDb = NonNullable<Awaited<ReturnType<typeof createNodeDb>>>

export type CourseRepository = {
  listCourses: () => Promise<CourseRecord[]>
  getCourseById: (id: string) => Promise<CourseRecord | null>
  upsertCourse: (row: CourseRecord) => Promise<CourseRecord>
  seedSampleCourse: (row: CourseRecord) => Promise<CourseRecord>
}

function cloneRow(row: CourseRecord): CourseRecord {
  return JSON.parse(JSON.stringify(row)) as CourseRecord
}

export function createInMemoryCourseRepository(
  initialRows: CourseRecord[] = [seedCourseRow as CourseRecord],
): CourseRepository {
  const rows = new Map<string, CourseRecord>()

  for (const row of initialRows) {
    rows.set(row.id, cloneRow(row))
  }

  return {
    async listCourses() {
      return Array.from(rows.values()).map(cloneRow)
    },
    async getCourseById(id) {
      const row = rows.get(id)
      return row ? cloneRow(row) : null
    },
    async upsertCourse(row) {
      const next = cloneRow(row)
      rows.set(next.id, next)
      return cloneRow(next)
    },
    async seedSampleCourse(row) {
      const next = cloneRow(row)
      rows.set(next.id, next)
      return cloneRow(next)
    },
  }
}

export function createNodeCourseRepository(db: NodeDb): CourseRepository {
  return {
    async listCourses() {
      const rows = await db.select().from(coursesTable)
      return rows.map((row) => cloneRow(row as CourseRecord))
    },
    async getCourseById(id) {
      const rows = await db
        .select()
        .from(coursesTable)
        .where(eq(coursesTable.id, id))
        .limit(1)

      const row = rows[0]
      return row ? cloneRow(row as CourseRecord) : null
    },
    async upsertCourse(row) {
      await db
        .insert(coursesTable)
        .values({
          id: row.id,
          title: row.title,
          description: row.description,
          content: row.content,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: coursesTable.id,
          set: {
            title: row.title,
            description: row.description,
            content: row.content,
            updatedAt: new Date(),
          },
        })

      const rows = await db
        .select()
        .from(coursesTable)
        .where(eq(coursesTable.id, row.id))
        .limit(1)

      const next = (rows[0] ?? row) as CourseRecord
      return cloneRow(next)
    },
    async seedSampleCourse(row) {
      await db
        .insert(coursesTable)
        .values({
          id: row.id,
          title: row.title,
          description: row.description,
          content: row.content,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: coursesTable.id,
          set: {
            title: row.title,
            description: row.description,
            content: row.content,
            updatedAt: new Date(),
          },
        })

      return cloneRow(row)
    },
  }
}

export function createWorkerSupabaseCourseRepository(config: {
  supabaseUrl: string
  serviceRoleKey: string
}): CourseRepository {
  const baseUrl = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/courses`

  async function request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        apikey: config.serviceRoleKey,
        authorization: `Bearer ${config.serviceRoleKey}`,
        ...(init.headers ?? {}),
      },
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(`Supabase REST error ${response.status}: ${message}`)
    }

    if (response.status === 204) {
      return [] as T
    }

    return (await response.json()) as T
  }

  return {
    async listCourses() {
      const rows = await request<CourseRecord[]>(
        '?select=id,title,description,content&order=updated_at.desc.nullslast',
        { method: 'GET' },
      )

      return rows.map(cloneRow)
    },
    async getCourseById(id) {
      const rows = await request<CourseRecord[]>(
        `?select=id,title,description,content&id=eq.${encodeURIComponent(id)}&limit=1`,
        { method: 'GET' },
      )

      const row = rows[0]
      return row ? cloneRow(row) : null
    },
    async upsertCourse(row) {
      const rows = await request<CourseRecord[]>(
        '?on_conflict=id&select=id,title,description,content',
        {
          method: 'POST',
          headers: {
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify([row]),
        },
      )

      return cloneRow(rows[0] ?? row)
    },
    async seedSampleCourse(row) {
      return this.upsertCourse(row)
    },
  }
}
