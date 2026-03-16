# Summary

Add a seeded German course with module/lesson content and a fill-in-the-blank exercise flow for learners, including course list UI, lesson view, and dark mode infrastructure.

# Implementation Plan

1. Add TypeGraphQL seed data and resolvers for courses, modules, lessons, content, and exercises.
2. Update learners web routes to fetch courses and lesson data from the API and render course list + lesson view.
3. Implement fill-in-the-blank exercise UI with typing and option variants, multiple blanks, and conversation context.
4. Add dark mode infrastructure (theme attributes and tokens) and update localization strings.
5. Update evaluations and tests to cover course list, lesson flow, and exercise variants.
6. Run unit, integration, and e2e tests.

# Task List

- [x] Add course seed data and API resolvers
- [x] Update learners web routes and UI for course list and lesson view
- [x] Implement fill-in-the-blank exercise UI (typing + options)
- [x] Add dark mode infrastructure and localization updates
- [x] Update evaluations and tests
- [x] Run unit, integration, and e2e tests

# Tests

- pnpm smoke:local
- npm run test:unit
- npm run test:integration
- npm run test:e2e
