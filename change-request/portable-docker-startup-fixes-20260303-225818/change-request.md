# Summary
Add portable Docker-based startup for web/API, update docs and evaluations, and fix Vite/Pothos compatibility issues blocking local startup.

# Implementation Plan
1) Update web app Vite toolchain to a Vite 6-compatible set.
2) Fix Pothos v4 SchemaBuilder config to prevent API startup crash.
3) Add Dockerfiles and docker-compose.yml for learners-web, publishers-web, api, and Postgres.
4) Add `.env.example` and update shared config to read a configurable GraphQL endpoint.
5) Update README startup guide with Docker usage and env notes.
6) Add evaluation criteria and tests for containerized startup.
7) Run unit, integration, and e2e tests.

# Task List
- [x] Update Vite toolchain versions for web apps
- [x] Fix Pothos SchemaBuilder config
- [x] Add Dockerfiles and docker-compose.yml
- [x] Add env example and configurable GraphQL endpoint
- [x] Update README startup guide
- [x] Add evaluations and tests for containerized startup
- [x] Run unit, integration, and e2e tests

# Tests
- npm run test:unit
- npm run test:integration
- npm run test:e2e
