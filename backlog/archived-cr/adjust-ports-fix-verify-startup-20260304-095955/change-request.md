# Summary
Move web app ports to the 4000 range and fix the startup verification script to run reliably on Windows.

# Implementation Plan
1) Update Vite dev server ports and Docker/README port mappings for learners and publishers web apps.
2) Update docker-start defaults and Dockerfiles to use the new ports.
3) Fix verify-startup script to invoke pnpm reliably and surface errors.
4) Update tests and evaluations to reflect port changes.
5) Run unit, integration, and e2e tests.

# Task List
- [x] Update web ports in Vite, Docker, and docs
- [x] Update docker-start defaults and Dockerfiles for new ports
- [x] Fix verify-startup script for Windows
- [x] Update tests/evaluations for port changes
- [x] Run unit, integration, and e2e tests

# Tests
- npm run test:unit
- npm run test:integration
- npm run test:e2e
