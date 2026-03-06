Summary

- Align devcontainer mounts with the node user home so OpenCode auth is available inside the container.
- Add evaluation/test coverage to prevent devcontainer auth mount regressions.

Implementation Plan

1. Update devcontainer mounts to target /home/node for auth, SSH, and netrc.
2. Add evaluation criteria for devcontainer OpenCode auth mount alignment.
3. Add integration test to validate mount targets against the configured remoteUser.
4. Run pnpm verify:setup, pnpm smoke:local, and unit/integration/e2e tests.

Task List

- [x] Update devcontainer mount targets to /home/node paths.
- [x] Add evaluation criteria for devcontainer auth mount alignment.
- [x] Add integration test for devcontainer mount targets.
- [x] Run pnpm verify:setup.
- [x] Run pnpm smoke:local.
- [x] Run unit tests.
- [x] Run integration tests.
- [x] Run e2e tests.

Tests

- pnpm verify:setup (passed)
- pnpm smoke:local (passed)
- pnpm test:unit (passed)
- pnpm test:integration (passed)
- pnpm test:e2e (passed)
