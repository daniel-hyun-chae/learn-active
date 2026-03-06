# Summary

Update Drizzle migrations to preserve existing data during baseline (idempotent initial migration), fix OpenCode CLI installation/mounts in the devcontainer, and record continuous-learning rules to validate tooling changes end-to-end.

# Implementation Plan

1. Make the initial Drizzle migration idempotent to allow applying migrations when the schema already exists.
2. Fix OpenCode CLI installation path, PATH, and mounts to match the remote user and document usage in README.
3. Add a continuous-learning rule to require running tool commands and aligning config to installed versions.
4. Run unit, integration, and e2e tests.

# Task List

- [x] Update drizzle config to new format.
- [x] Make initial Drizzle migration idempotent.
- [x] Fix OpenCode CLI install/mounts and document usage.
- [x] Add continuous-learning rule for tooling validation.
- [x] Run unit tests.
- [x] Run integration tests.
- [x] Run e2e tests.

# Tests

- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm test:e2e`
