# Summary
Fix web app routing output and Docker runtime module resolution by adding explicit route trees and copying the pnpm store into runtime images.

# Implementation Plan
1) Replace placeholder route tree generation by wiring manual route trees in learners and publishers web apps.
2) Ensure Docker images use a local pnpm store and copy it into the runtime stage for module resolution.
3) Update startup verification/tests if needed.
4) Run unit, integration, and e2e tests.

# Task List
- [x] Add manual route trees and update routers
- [x] Fix pnpm store handling in Docker images
- [x] Run unit, integration, and e2e tests

# Tests
- npm run test:unit
- npm run test:integration
- npm run test:e2e
