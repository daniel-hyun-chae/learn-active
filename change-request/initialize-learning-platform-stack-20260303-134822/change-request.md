# Summary
Initialize a monorepo for learners (mobile/tablet + responsive web), publishers (responsive web), and a GraphQL API using the selected stack (TanStack Start, Expo React Native, TypeScript, Drizzle, GraphQL), plus shared packages, architecture docs, evaluation criteria, and baseline tests.

# Implementation Plan
1) Set up monorepo scaffolding (pnpm workspace + Turborepo), base TypeScript configs, lint/format config, and root scripts.
2) Scaffold apps: learners-web, publishers-web (TanStack Start), learners-mobile (Expo), api (Node TS GraphQL).
3) Create shared packages: ui, tokens, utils, graphql-types, config, and i18n.
4) Add data layer skeleton: Drizzle schema + migrations placeholder, GraphQL schema builder and server wiring.
5) Add offline persistence scaffolding for quiz attempts (mobile + web).
6) Add architecture documentation overview.
7) Add evaluation criteria and baseline tests referencing evaluation IDs.
8) Run unit, integration, and e2e tests.

# Task List
- [x] Set up monorepo scaffolding and root configs
- [x] Scaffold apps (learners-web, publishers-web, learners-mobile, api)
- [x] Create shared packages (ui, tokens, utils, graphql-types, config, i18n)
- [x] Add GraphQL server + Drizzle schema/migrations skeleton
- [x] Add offline persistence scaffolding (mobile + web)
- [x] Add architecture overview doc
- [x] Add evaluation criteria and baseline tests with evaluation references
- [x] Run unit, integration, and e2e tests

# Tests
- npm run test:unit
- npm run test:integration
- npm run test:e2e
