import type { ApiRuntimeEnv } from './env.js'
import { runtimeLogger } from './logger.js'
import { generateId } from './crypto.js'
import { createNodeDb } from '../db/connection.js'
import {
  createInMemoryCourseRepository,
  createNodeCourseRepository,
  createWorkerSupabaseCourseRepository,
  type CourseRepository,
} from '../features/course/repository.js'

export type RuntimeServices = {
  env: ApiRuntimeEnv
  courseRepository: CourseRepository
  generateId: () => string
}

function createCourseRepository(env: ApiRuntimeEnv): Promise<CourseRepository>
function createCourseRepository(
  env: ApiRuntimeEnv,
  nodeDb: NonNullable<Awaited<ReturnType<typeof createNodeDb>>>,
): Promise<CourseRepository>
async function createCourseRepository(
  env: ApiRuntimeEnv,
  nodeDb?: NonNullable<Awaited<ReturnType<typeof createNodeDb>>>,
): Promise<CourseRepository> {
  if (env.target === 'node' && nodeDb) {
    return createNodeCourseRepository(nodeDb)
  }

  if (
    env.target === 'worker' &&
    env.supabaseUrl &&
    env.supabaseServiceRoleKey
  ) {
    return createWorkerSupabaseCourseRepository({
      supabaseUrl: env.supabaseUrl,
      serviceRoleKey: env.supabaseServiceRoleKey,
    })
  }

  runtimeLogger.warn(
    '[api] No runtime DB adapter available, using in-memory course repository',
  )
  return createInMemoryCourseRepository()
}

export async function createRuntimeServices(
  env: ApiRuntimeEnv,
): Promise<RuntimeServices> {
  if (env.target === 'node') {
    const db = await createNodeDb(env.databaseUrl)
    const courseRepository = db
      ? await createCourseRepository(env, db)
      : await createCourseRepository(env)

    return {
      env,
      courseRepository,
      generateId,
    }
  }

  return {
    env,
    courseRepository: await createCourseRepository(env),
    generateId,
  }
}
