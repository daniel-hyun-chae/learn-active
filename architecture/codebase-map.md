# Codebase Map

Module-level structural index for AI agents and human developers. Describes what lives where, not how it works internally. For architecture and data flow, see `architecture/overview.md`.

## Repository Root

```
apps/           # deployable applications
shared/         # shared packages consumed by apps
supabase/       # database migrations and Supabase config
tests/          # test suites (unit, integration, e2e)
spec/           # product specification and testable behaviors
architecture/   # technical documentation
decision-log/   # implementation decision records
backlog/        # work item tracking (proposed, done, archived)
evaluations/    # backlog-to-evaluation traceability artifacts
.opencode/      # AI agent governance (rules, skills, agents)
.github/        # CI/CD workflows
.githooks/      # optional repo-local git hooks
```

## Apps

### `apps/api/` -- GraphQL API

Dual-runtime GraphQL API: Cloudflare Worker (production) and Node (local dev). Built with GraphQL Yoga and TypeGraphQL.

| Path                            | Purpose                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/features/course/` | Course domain: resolver, repository (Drizzle + Supabase adapters), model, types, inputs, repository contract, seed data |
| `apps/api/src/features/auth/`   | JWT/JWKS authentication guards                                                                                          |
| `apps/api/src/features/health/` | Health check endpoint                                                                                                   |
| `apps/api/src/features/quiz/`   | Quiz format enum (planned)                                                                                              |
| `apps/api/src/db/schema.ts`     | Drizzle ORM schema definitions for all tables                                                                           |
| `apps/api/src/runtime/env.ts`   | Runtime environment variable loading                                                                                    |
| `apps/api/src/worker.ts`        | Cloudflare Worker entry point                                                                                           |
| `apps/api/src/app.ts`           | Node/local dev entry point                                                                                              |

### `apps/web/` -- Web Application

React SPA with TanStack Router, Vite, and Cloudflare Pages deployment. Serves both publisher (authoring) and learner (consumption) experiences.

| Path                                | Purpose                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `apps/web/src/features/auth/`       | AuthProvider, route guards, Supabase client integration                               |
| `apps/web/src/features/publishers/` | Publisher workspace: content authoring, rich text editor (Lexical), course management |
| `apps/web/src/features/learners/`   | Learner experience: course view, lesson view, exercises (FillInBlank, MultipleChoice) |
| `apps/web/src/shared/`              | Routing setup, design tokens, shared UI components                                    |

### `apps/learners-mobile/` -- Mobile App

Expo React Native app for learners. Offline-first with local quiz attempt storage.

| Path                                          | Purpose                              |
| --------------------------------------------- | ------------------------------------ |
| `apps/learners-mobile/src/features/auth/`     | Mobile authentication flow           |
| `apps/learners-mobile/src/features/learners/` | Mobile learner experience, exercises |

## Shared Packages

All under `shared/`. Each is a separate package consumed by one or more apps.

| Package                  | Purpose                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `shared/shared-i18n/`    | Internationalization with react-i18next; English translation keys for all user-facing strings |
| `shared/shared-graphql/` | GraphQL client setup, generated types, QuizAttemptDraft types                                 |
| `shared/shared-utils/`   | Quiz attempt offline store, storage abstractions                                              |
| `shared/shared-tokens/`  | Design tokens (JS and CSS exports)                                                            |
| `shared/shared-config/`  | Application configuration constants                                                           |
| `shared/shared-ui/`      | Shared UI components used across web and mobile                                               |

## Database

Managed by Supabase with Drizzle ORM for application access.

| Path                        | Purpose                                                   |
| --------------------------- | --------------------------------------------------------- |
| `supabase/migrations/`      | SQL migration files (authoritative schema source)         |
| `apps/api/src/db/schema.ts` | Drizzle ORM schema mirroring the migration-defined tables |

Recent addition: `supabase/migrations/0006_learner_attempt_progress.sql` introduces learner exercise attempt persistence (`learner_exercise_attempts`).

Tables: `profiles`, `owners`, `owner_members`, `courses`, `course_versions`, `course_publications`, `enrollments`, `payments`.

Content structure (modules, lessons, exercises) is stored as a JSONB blob in `course_versions.content`.

## Tests

| Path                 | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `tests/unit/`        | Unit tests                                          |
| `tests/integration/` | Integration tests (including governance validation) |
| `tests/e2e/`         | End-to-end tests                                    |

Commands: `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`.

## Spec

Product specification and testable behaviors. Each file covers a domain area with narrative sections and a Behaviors section listing testable assertions. See `spec/README.md` for conventions.

| File                          | Domain                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| `spec/platform.md`            | Monorepo structure, local startup, Docker, devcontainer, CI/CD |
| `spec/authentication.md`      | Sign-in, identity, session management                          |
| `spec/publisher-authoring.md` | Course creation, content editing, versioning, publishing       |
| `spec/learner-experience.md`  | Catalog browsing, enrollment, lessons, exercises, payments     |

## Governance and AI Agent Configuration

| Path                | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `.opencode/agents/` | Agent definitions (backlog-planner, change-orchestrator) |
| `.opencode/rules/`  | Durable rules loaded into every agent session            |
| `.opencode/skills/` | Reusable methodology for recurring work types            |
| `opencode.json`     | OpenCode MCP and agent configuration                     |
| `AGENTS.md`         | Agent contract and taxonomy                              |

## CI/CD

| Path                 | Purpose                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| `.github/workflows/` | GitHub Actions for staging (auto on main) and production (manual) deploys |

For deployment details, see `architecture/ci-cd.md`.

## Maintenance

- Update this file when directories are added, removed, or renamed at the module level.
- An integration test (`tests/integration/codebase-map.test.js`) validates that paths referenced here exist.
- Do not list individual functions or components -- keep entries at the folder/file level to minimize staleness.
