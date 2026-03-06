Summary

- Stabilize pnpm preflight so per-package installs run when vite/tsc binaries are missing and verify:setup/smoke:local pass reliably on Windows.
- Ensure Vite routeTree normalization and alias/proxy resolution prevents "Failed to resolve ./routes/\_\_root" errors.
- Update evaluations/tests to lock in stability and required gates.

Implementation Plan

1. Inspect ensure-pnpm preflight and ensure per-package installs run for @app/web and @app/api when binaries are missing.
2. Validate routeTree normalization workflow and Vite alias/plugin behavior; adjust ordering or logic as needed.
3. Update evaluations/tests for any new checks or behavior changes.
4. Run pnpm verify:setup, pnpm smoke:local, and unit/integration/e2e tests.

Task List

- [x] Fix ensure-pnpm preflight to install per-package deps when vite/tsc binaries are missing.
- [x] Stabilize Vite routeTree normalization and alias resolution.
- [x] Update evaluations/tests to cover new or changed behavior.
- [x] Run pnpm verify:setup.
- [x] Run pnpm smoke:local.
- [x] Run unit tests.
- [x] Run integration tests.
- [x] Run e2e tests.

Tests

- pnpm verify:setup (failed: pnpm exec vite/tsc missing; missing apps/web vite.js and apps/api tsc; pnpm install cleanup error/time out)
- pnpm verify:setup (passed)
- pnpm smoke:local (passed)
- pnpm test:unit (passed)
- pnpm test:integration (passed)
- pnpm test:e2e (passed)
