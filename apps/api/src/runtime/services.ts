import type { ApiRuntimeEnv } from './env.js'
import { generateId } from './crypto.js'
import { createStripeService, type StripeService } from './stripe.js'
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
  stripe: StripeService | null
  generateId: () => string
}

function createRuntimeStripeService(env: ApiRuntimeEnv): StripeService | null {
  if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
    return null
  }

  return createStripeService({
    secretKey: env.stripeSecretKey,
    webhookSecret: env.stripeWebhookSecret,
  })
}

function createCourseRepositoryForTests(): CourseRepository {
  return createInMemoryCourseRepository()
}

export async function createRuntimeServices(
  env: ApiRuntimeEnv,
): Promise<RuntimeServices> {
  if (env.target === 'node') {
    const db = await createNodeDb(env.databaseUrl)
    if (!db) {
      throw new Error(
        '[api] DATABASE_URL is required and must be reachable for node runtime course repository.',
      )
    }

    const courseRepository = createNodeCourseRepository(db)

    return {
      env,
      courseRepository,
      stripe: createRuntimeStripeService(env),
      generateId,
    }
  }

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error(
      '[api] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for worker runtime course repository.',
    )
  }

  return {
    env,
    courseRepository: createWorkerSupabaseCourseRepository({
      supabaseUrl: env.supabaseUrl,
      serviceRoleKey: env.supabaseServiceRoleKey,
    }),
    stripe: createRuntimeStripeService(env),
    generateId,
  }
}

export { createCourseRepositoryForTests }
