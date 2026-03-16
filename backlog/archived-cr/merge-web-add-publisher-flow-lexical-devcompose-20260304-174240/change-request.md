# Summary

Merge learner and publisher web into a single web app, add publisher course creation with Lexical, move learner/publisher homes to /learn and /publish, add multi-module/lesson support, and introduce a Docker Compose dev mode with live reload.

# Implementation Plan

1. Rename learners-web to web and remove publishers-web; update workspace scripts, Docker, and routes.
2. Add publisher home (/publish) with course builder (Lexical for content, fill-in-the-blank builder).
3. Extend API with dev database schema + persistence for courses/modules/lessons/exercises.
4. Add learner home (/learn) and update landing redirect.
5. Add docker-compose.dev.yml with bind mounts and dev commands, plus README updates.
6. Add evaluations/tests for merged app + publisher workflow.
7. Run unit, integration, and e2e tests.

# Task List

- [ ] Rename learners-web to web and remove publishers-web
- [ ] Add publisher home with Lexical editor and exercise builder
- [ ] Add DB schema + persistence for courses/modules/lessons/exercises
- [ ] Update learner home routes and landing redirect
- [ ] Add Docker Compose dev mode and README updates
- [ ] Add evaluations and tests
- [ ] Run unit, integration, and e2e tests

# Tests

- Not run yet
