# Adopt Playwright for browser runtime startup validation

Date: 2026-03-07
Status: Accepted

## Context

The startup checks validated service availability and SSR responses, but they did not verify client hydration behavior in a real browser or unknown-route not-found rendering. We also needed devcontainer-ready browser automation so checks run without manual setup.

## Decision

Adopt Playwright (`playwright` npm package) for browser runtime validation. Add a reusable browser check script and integrate it into `pnpm smoke:local`, and update devcontainer provisioning to install Chromium and required runtime dependencies automatically.

## Consequences

- Startup validation now catches hydration/runtime browser errors and missing global not-found UI.
- Devcontainer startup has additional provisioning steps and image dependencies for Chromium support.
- Browser binaries are cached in a persistent volume to reduce repeated download overhead.

## Alternatives Considered

- Keep HTTP-only checks and rely on manual browser validation.
- Use a different browser automation framework.

## Links

- `scripts/browser-check.mjs`
- `scripts/smoke-local.mjs`
- `.devcontainer/devcontainer.json`
- `.devcontainer/Dockerfile`
- `docker-compose.devcontainer.yml`
- `evaluations/local-startup.md`
