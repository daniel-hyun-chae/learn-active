# Product Guidelines

These rules apply only to this product and are in addition to the global guidelines.

## Localization

- The application must be translatable (all user-facing strings support localization).

## Package Manager Lockfile Parity (Product)

This repository is pnpm-based and requires lockfile parity with the repository-declared pnpm major.

- `package.json` `packageManager` pnpm major and `pnpm-lock.yaml` `lockfileVersion` major must match.
- Regenerate lockfile with the repository-declared pnpm major (via Corepack) whenever dependencies or lockfile metadata change.
- Local validation for AI-driven changes must run the same parity check enforced in CI before marking work complete.

## Seed Content Governance (Product)

- Local and staging environments must always have idempotent sample course seed content available for manual validation.
- Seed content must be realistic and cover all currently supported learner/publisher content and exercise capabilities.
- Whenever a new learner/publisher capability is introduced (new block type, exercise type, or major behavior mode), seed content and related integration checks must be updated in the same change.

## Implementation Gate (Product)

Before marking work complete, confirm:

- Localization readiness verified for new/changed user-facing strings.
- Pnpm major and lockfile major parity validated.
- CI-equivalent local validation suite run and passing:
  - `pnpm validate:lockfile`
  - `pnpm lint`
  - `pnpm build`
  - `pnpm test:unit`
  - `pnpm test:integration`
  - `pnpm test:e2e`
- Hosted deploy secret contract updates kept in sync across validator scripts, deploy workflows, and architecture docs when runtime-required secrets change.
