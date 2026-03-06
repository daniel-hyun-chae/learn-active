Summary

- Merge learner and publisher web apps into apps/web with /learn and /publish routes, preserving dark mode and responsive design tokens.
- Complete publisher workflow with Lexical rich text and fill-in-the-blank builder, persist courses to dev Postgres with seeding/re-seed.
- Bring learner mobile app to feature parity with web learner features, add docker-compose.dev.yml live reload for web + api, and update tests/evaluations/smoke scripts.

Implementation Plan

1. Audit repo gaps (tests, evaluations, mobile app, docker dev compose, references) and confirm missing updates.
2. Finalize publisher workflow: fix TypeScript issues, ensure GraphQL inputs/mutations align, keep localization and design tokens.
3. Update learner mobile app to match web learner feature set (course list, lesson view, exercises).
4. Add docker-compose.dev.yml with live reload for web + api (bind mounts, polling env vars), and update docs if needed.
5. Remove residual artifacts and remaining references to old apps (learners-web, publishers-web).
6. Update evaluation criteria and tests/smoke scripts to reference new routes and IDs.
7. Run unit, integration, and e2e tests and record results.

Task List

- [x] Audit repo gaps with subagents (tests, evaluations, mobile, compose, references)
- [x] Fix TypeScript and finalize publisher workflow with Lexical + fill-in-the-blank builder
- [x] Verify DB persistence and seed/re-seed mutation with dev Postgres
- [x] Update learner mobile app to full feature parity with web learner
- [x] Add docker-compose.dev.yml live reload for web + api
- [x] Remove old build artifacts and leftover directories
- [x] Update remaining references/tests/scripts/README as needed
- [x] Add/update evaluation criteria and ensure tests reference IDs
- [x] Run unit, integration, and e2e tests

Tests

- pnpm test:unit (pass)
- pnpm test:integration (pass)
- pnpm test:e2e (pass)
- pnpm smoke:local (pass)
