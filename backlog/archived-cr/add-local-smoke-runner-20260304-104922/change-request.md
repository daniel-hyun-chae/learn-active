# Summary
Add local runtime smoke scripts to validate API and web apps without Docker and automate startup verification.

# Implementation Plan
1) Add local smoke script that builds and launches API + web apps, verifies endpoints, and shuts down.
2) Add dev-stack script to run API + web dev servers with health checks.
3) Update package.json scripts and README with new verification commands.
4) Add evaluations and tests for local startup checks.
5) Run unit, integration, and e2e tests.

# Task List
- [x] Add local smoke and dev-stack scripts
- [x] Update package.json scripts and README
- [x] Add evaluations and tests for local startup checks
- [x] Run unit, integration, and e2e tests

# Tests
- npm run test:unit
- npm run test:integration
- npm run test:e2e
