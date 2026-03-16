# Summary
Make local smoke and dev-stack scripts resilient to port conflicts by selecting available ports and wiring endpoints dynamically.

# Implementation Plan
1) Update smoke-local to probe for available ports and pass them to API and web apps.
2) Update dev-stack to select available ports with environment overrides.
3) Update tests and docs to reflect dynamic port handling.
4) Run local smoke and unit/integration/e2e tests.

# Task List
- [ ] Add dynamic port selection to smoke-local
- [ ] Add dynamic port selection to dev-stack
- [ ] Update tests and docs
- [ ] Run smoke-local and unit/integration/e2e tests

# Tests
- Not run yet
