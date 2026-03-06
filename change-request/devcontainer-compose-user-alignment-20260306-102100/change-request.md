Summary

- Align the devcontainer compose runtime user with the configured remoteUser for OpenCode auth visibility.
- Add evaluation and integration test coverage to prevent user/mount mismatches.

Implementation Plan

1. Update docker-compose.devcontainer.yml to avoid running as root and align with the devcontainer user.
2. Extend devcontainer evaluation criteria to require user alignment in compose.
3. Update integration test to validate compose user alignment with devcontainer remoteUser.
4. Run pnpm verify:setup, pnpm smoke:local, and unit/integration/e2e tests.

Task List

- [x] Update compose devcontainer user alignment.
- [x] Update evaluations for devcontainer user alignment.
- [x] Update integration test gate for devcontainer user alignment.
- [ ] Run pnpm verify:setup.
- [ ] Run pnpm smoke:local.
- [ ] Run unit tests.
- [ ] Run integration tests.
- [ ] Run e2e tests.

Tests

- Not run yet.
