## Summary

Fix local magic-link OTP login failures (502 upstream) introduced by the versioning migration by making backfill-created `course_versions.created_by` always resolvable, even when no prior profile data exists.

## Implementation Plan

1. Update migration `0004` to guarantee a deterministic fallback profile row for `created_by`.
2. Update `created_by` backfill selection order to prefer owner-linked users and safely fall back to the deterministic system profile.
3. Add or update integration wiring assertions to prevent regression of the migration fallback logic.
4. Run unit, integration, and e2e tests and record results.

## Task List

- [x] Add deterministic profile fallback in migration 0004.
- [x] Update migration backfill `created_by` selection logic to never produce null.
- [x] Update integration assertions for migration fallback guard.
- [x] Add startup hardening to local db helper so auth health is verified and retried once on startup race.
- [x] Run `pnpm test:unit`, `pnpm test:integration`, and `pnpm test:e2e`.

## Tests

- `pnpm test:unit` -> pass.
- `pnpm test:integration` -> pass.
- `pnpm test:e2e` -> pass after startup hardening (including publisher auth storage-state setup and publisher flow).
