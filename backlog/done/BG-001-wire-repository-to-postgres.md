# BG-001: Wire repository to real Postgres

Priority: P0
Status: Done
Theme: Foundation

## Why now

The API repository (`apps/api/src/features/course/repository.ts`) discards DB connections and runs entirely on shared in-memory Maps. `createNodeCourseRepository(db)` and `createWorkerSupabaseCourseRepository(config)` both `void` their arguments and return in-memory state. No data persists across server restarts, and staging/production deployments are empty shells. Every feature built on top of this is unusable outside a single dev session.

## Scope

- Implement real Postgres queries in `createNodeCourseRepository` using Drizzle ORM against the existing schema (`apps/api/src/db/schema.ts`).
- Implement real Supabase queries in `createWorkerSupabaseCourseRepository` for the Cloudflare Worker runtime.
- Cover all `CourseRepository` interface methods: ownership provisioning, public/publisher/learner course queries, enrollment, payments, versioning, publishing, diffing.
- Validate against local Supabase with existing e2e and integration tests.
- Retain `createInMemoryCourseRepository` for unit tests that don't need a database.
- Remove shared in-memory state as the default path for Node and Worker runtimes.

## Out of scope

- New tables or schema changes beyond what migrations 0001-0005 already define.
- Connection pooling tuning or performance optimization.
- Changing the GraphQL schema or resolver layer.

## Dependencies

- None. This is the foundation for everything else.

## Notes

- The Drizzle schema in `apps/api/src/db/schema.ts` already mirrors the SQL migrations. The tables (`courses`, `course_versions`, `course_publications`, `enrollments`, `payments`, `owners`, `owner_members`, `profiles`) are all defined.
- RLS policies in migrations 0003 and 0004 are already in place, but the Worker runtime uses `service_role` key so RLS enforcement depends on whether queries go through Supabase client or direct Postgres.
- The `CourseRepository` interface is already well-defined with 20+ methods. The implementation swap should be transparent to resolvers.
