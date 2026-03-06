# Summary
Replace Pothos with TypeGraphQL in the API, add startup verification scripts and health checks, and harden Docker builds to ensure web outputs exist.

# Implementation Plan
1) Replace Pothos schema with TypeGraphQL resolvers and update API dependencies/config.
2) Add startup verification and env setup scripts plus package.json commands.
3) Update Dockerfiles/compose with health checks and build output validation.
4) Update docs, evaluations, and decision log for the library change.
5) Run unit, integration, and e2e tests.

# Task List
- [x] Replace Pothos with TypeGraphQL in the API
- [x] Add startup verification and env setup scripts
- [x] Harden Docker build output checks and health checks
- [x] Update docs, evaluations, and decision log
- [x] Run unit, integration, and e2e tests

# Tests
- npm run test:unit
- npm run test:integration
- npm run test:e2e
