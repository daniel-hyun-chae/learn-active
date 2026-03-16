# Product Guidelines

These rules apply only to this product and are in addition to the global guidelines.

## Localization

- The application must be translatable (all user-facing strings support localization).

## Package Manager Lockfile Parity (Product)

This repository is pnpm-based and requires lockfile parity with the repository-declared pnpm major.

- `package.json` `packageManager` pnpm major and `pnpm-lock.yaml` `lockfileVersion` major must match.
- Regenerate lockfile with the repository-declared pnpm major (via Corepack) whenever dependencies or lockfile metadata change.
- Local validation for AI-driven changes must run the same parity check enforced in CI before marking work complete.

## Implementation Gate (Product)

Before marking work complete, confirm:

- Localization readiness verified for new/changed user-facing strings.
- Pnpm major and lockfile major parity validated.
