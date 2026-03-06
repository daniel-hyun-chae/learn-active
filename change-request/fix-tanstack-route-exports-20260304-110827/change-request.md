# Summary
Fix TanStack Start route exports to use file-based route call expressions so builds succeed and routes render.

# Implementation Plan
1) Restore file-based `Route` exports in learners and publishers web apps.
2) Remove manual route tree wiring that conflicts with the generator.
3) Run local smoke check and unit/integration/e2e tests.

# Task List
- [ ] Restore file-based route exports
- [ ] Remove manual route tree wiring
- [ ] Run local smoke check and tests

# Tests
- Not run yet
