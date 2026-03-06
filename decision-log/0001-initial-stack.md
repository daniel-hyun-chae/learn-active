# Initial stack and tooling

Date: 2026-03-03
Status: Accepted

## Context
We are initializing a learning platform with a quiz-heavy learner experience, offline support for learners, and a custom authoring tool for publishers. The stack must support mobile/tablet apps and responsive desktop web while keeping a shared TypeScript codebase and design tokens.

## Decision
Adopt a TypeScript-first monorepo with the following core libraries and tools:
- Web apps: TanStack Start (React) for learners and publishers.
- Mobile apps: Expo React Native for learner mobile/tablet.
- API: GraphQL Yoga with TypeGraphQL for schema, backed by Postgres via Drizzle ORM.
- Client data: graphql-request with TanStack Query for caching.
- Offline scaffolding: IndexedDB persistence on web and AsyncStorage on mobile for quiz attempts.
- Shared packages for tokens, UI, i18n, config, GraphQL types, and utilities.

## Consequences
- One TypeScript language across frontend and backend improves sharing and consistency.
- TanStack Start is alpha; we must track version compatibility in upgrades.
- TypeGraphQL uses decorators and requires emitDecoratorMetadata + reflect-metadata.
- Drizzle keeps schema and types in code but requires discipline around migrations.
- Offline-first behavior needs careful sync semantics for quiz attempts.

## Alternatives Considered
- Next.js for web (rejected: preference for TanStack Start)
- Flutter for mobile (rejected: team preference for React Native)
- REST API (rejected: preference for GraphQL)

## Links
- Architecture: `architecture/overview.md`
- Evaluations: `evaluations/platform-initialization.md`
